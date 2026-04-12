/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import ReactQueryProvider from "@/react-query/providers";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { tokenManager } from "@/utils/tokenManager";
import { userStorage } from "@/services/userStorage";
import useToastStore from "@/stores/toastStore";
import Toast from "@/shared/Toast/Toast";
import AssetsFiles from "@/assets";
import httpService from "@/services/httpService";
import businessService from "@/services/businessService";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { outletApi } from "@/redux/outlets";
import { appApi } from "@/redux/app";
import { authApi } from "@/redux/auth";
import { WifiOff } from "lucide-react";
import { UpdateNotifier } from "@/components/UpdateNotifier";
import {
  initializeNetworkListeners,
  useNetworkStore,
} from "@/stores/useNetworkStore";

import { useBusinessStore } from "@/stores/useBusinessStore";

const PUBLIC_PATHS = ["/auth", "/reset-password", "/verify"];

export function Providers({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const {
    fetchBusinessData,
    isLoading: businessLoading,
    hasInitialized,
    selectedOutlet,
  } = useBusinessStore();
  const toast = useToastStore();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);
  const { isOnline, hasCheckedStatus } = useNetworkStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSplashIndex, setSyncSplashIndex] = useState(0);
  const [syncSplashProgress, setSyncSplashProgress] = useState(18);

  const SYNC_INTERVAL_MS = Number(
    import.meta.env.VITE_SYNC_INTERVAL_MS || 300000,
  );

  const syncSplashMessages = useMemo(
    () => [
      {
        title: "Getting your application ready...",
        subtitle: "Syncing menus, inventory, and recipes — just a moment.",
      },
      {
        title: "Pulling your latest data...",
        subtitle: "Updating products, ingredients, and settings.",
      },
      {
        title: "Almost there...",
        subtitle: "Finishing setup so you can start working.",
      },
    ],
    [],
  );

  const isSplashVisible =
    isBootstrapping ||
    isInitialSyncing ||
    (isAuthenticated && !hasInitialized) ||
    (isAuthenticated && !selectedOutlet);

  useEffect(() => {
    if (!isSplashVisible) return;
    setSyncSplashIndex(0);
    setSyncSplashProgress(18);

    const messageTimer = window.setInterval(() => {
      setSyncSplashIndex((prev) => (prev + 1) % syncSplashMessages.length);
    }, 2400);

    const progressTimer = window.setInterval(() => {
      setSyncSplashProgress((prev) => {
        if (prev >= 86) return 22;
        return prev + 6;
      });
    }, 320);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, [isSplashVisible, syncSplashMessages.length]);

  /**
   * ------------------------------------------------------
   * STEP 1 — SAFE AUTH HYDRATION (KEYCHAIN SAFE)
   * ------------------------------------------------------
   */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (typeof window === "undefined") return;

        // 🔥 SAFE, IDEMPOTENT, NO RACE CONDITIONS
        const tokens = await tokenManager.hydrate();
        const storedUser = await userStorage.loadUser();

        if (!alive) return;

        if (tokens) {
          setAuth({ user: storedUser ?? null, tokens });
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        // 🔥 THIS MUST ALWAYS RUN
        if (alive) setIsBootstrapping(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [setAuth, clearAuth]);

  /**
   * ------------------------------------------------------
   * STEP 2 — NETWORK STATUS SYNC (ELECTRON ONLY)
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use the centralized network listener
    const cleanup = initializeNetworkListeners();
    return cleanup;
  }, []);

  /**
   * ------------------------------------------------------
   * STEP 2.5 — BUSINESS DATA FETCH + INITIAL SYNC
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const api = (window as any).electronAPI;
        if (!api) return;

        // 0. Ensure user still exists in DB (handle potential data wipe or session loss)
        const currentUser = await api.getUser();

        // Only clear auth if we are NOT in the middle of bootstrapping or initial sync
        // and the user is truly missing from the database.
        if (
          !isBootstrapping &&
          !isInitialSyncing &&
          (!currentUser || !currentUser.id)
        ) {
          console.warn(
            "[Providers] Authenticated but no user found in DB. Clearing auth...",
          );
          clearAuth();
          return;
        }

        // 1. Initial load from local DB
        await fetchBusinessData();

        // 2. Check if we need a sync pull
        const { outlets } = useBusinessStore.getState();
        const hasUnonboarded = outlets.some((o) => !o.isOnboarded);

        // If no outlets found OR some are unonboarded and we are online, perform sync pull
        if ((outlets.length === 0 || hasUnonboarded) && isOnline) {
          try {
            console.log("[Providers] Triggering initial sync pull...");
            setIsInitialSyncing(true);
            await api.triggerSync();
            // 3. Re-fetch after sync to get latest data
            await fetchBusinessData();
          } catch (error) {
            console.error("[Providers] Initial sync failed:", error);
          } finally {
            setIsInitialSyncing(false);
          }
        }
      })();
    }
  }, [isAuthenticated, isOnline]);

  /**
   * ------------------------------------------------------
   * STEP 3 — OFFLINE SYNC + P2P (UNCHANGED LOGIC)
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (!isOnline || !isAuthenticated) return;
    if (typeof window === "undefined") return;

    const api = (window as any).electronAPI;
    if (!api) return;

    const sync = async () => {
      if (isSyncing) return;
      setIsSyncing(true);

      try {
        const queue = (await api.queueList()) || [];
        const remaining: any[] = [];

        for (const op of queue) {
          // Only process legacy HTTP-style ops in the frontend.
          // Entity-style ops ({ table, action, data }) are handled by SyncService in main.
          if (op.method) {
            try {
              if (op.method === "POST")
                await httpService.post(op.path, op.data, true, true);
              else if (op.method === "PATCH")
                await httpService.patch(op.path, op.data, true, true);
              else if (op.method === "DELETE")
                await httpService.delete(op.path, op.data, true, true);
              else {
                // Method exists but not handled here; preserve for other processors
                remaining.push(op);
              }
            } catch {
              // On error, keep the item in the queue for retry
              remaining.push(op);
            }
          } else {
            // Preserve unknown formats (likely entity-style ops)
            remaining.push(op);
          }
        }

        // Only update the queue if it was modified (items successfully processed)
        if (remaining.length !== queue.length) {
          await api.queueSet(remaining);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    sync();
    const id = setInterval(sync, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, isOnline]);

  /**
   * ------------------------------------------------------
   * STEP 4 — ROUTE GUARDS (NO LOOPS, NO BLANK)
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (isBootstrapping) return;

    const pathname = location.pathname;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!isAuthenticated && !isPublic) {
      if (!pathname.startsWith("/auth")) {
        // Pass current path as state to preserve it after login
        navigate("/auth", {
          state: { from: pathname + location.search + location.hash },
        });
      }
      return;
    }

    const onAuthPage = pathname.startsWith("/auth");
    if (isAuthenticated && onAuthPage) {
      // Check if there is a 'from' path in location state
      const state = location.state as { from?: string } | null;
      if (state?.from) {
        navigate(state.from);
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, location.pathname, isBootstrapping, navigate]);

  /**
   * ------------------------------------------------------
   * SPLASH SCREEN (NEVER RETURN NULL)
   * ------------------------------------------------------
   */
  if (isSplashVisible) {
    const splash = syncSplashMessages[syncSplashIndex] || syncSplashMessages[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img
          src={AssetsFiles.LogoTwo}
          alt="Bountip"
          className="w-36 animate-pulse"
        />
        <div className="mt-8 w-full max-w-[520px] px-6 flex flex-col items-center">
          <div className="text-[22px] font-bold text-[#111827] text-center">
            {splash.title}
          </div>
          <div className="mt-3 text-[14px] text-[#6B7280] text-center">
            {splash.subtitle}
          </div>

          <div className="mt-7 h-3 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full bg-[#15BA5C] transition-[width] duration-300 ease-out"
              style={{ width: `${syncSplashProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReduxProvider>
      <ReactQueryProvider>
        <div
          className={`fixed top-0 left-0 right-0 bg-red-600 text-white text-sm py-2 text-center z-50 transition-all duration-300 transform ${
            hasCheckedStatus && !isOnline
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <WifiOff size={16} className="inline mr-2" />
          Offline mode — syncing paused
        </div>

        <Toast {...toast} />
        {children}
      </ReactQueryProvider>
      {/* Update Notifier */}
      <UpdateNotifier />
    </ReduxProvider>
  );
}

/**
 * ------------------------------------------------------
 * REDUX PROVIDER (UNCHANGED)
 * ------------------------------------------------------
 */
function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() =>
    configureStore({
      reducer: {
        [outletApi.reducerPath]: outletApi.reducer,
        [appApi.reducerPath]: appApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
      },
      middleware: (gDM) =>
        gDM().concat(
          outletApi.middleware,
          appApi.middleware,
          authApi.middleware,
        ),
    }),
  );

  return <Provider store={store}>{children}</Provider>;
}
