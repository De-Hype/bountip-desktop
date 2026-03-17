/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import ReactQueryProvider from "@/react-query/providers";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  } = useBusinessStore();
  const toast = useToastStore();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);
  const { isOnline } = useNetworkStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const SYNC_INTERVAL_MS = Number(
    import.meta.env.VITE_SYNC_INTERVAL_MS || 300000,
  );

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
        // 1. Initial load from local DB
        await fetchBusinessData();

        const api = (window as any).electronAPI;
        if (!api) return;

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
  if (
    isBootstrapping ||
    isInitialSyncing ||
    (isAuthenticated && !hasInitialized)
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img
          src={AssetsFiles.LogoTwo}
          alt="Bountip"
          className="w-36 animate-pulse"
        />
        {isInitialSyncing && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-gray-600 font-medium animate-pulse">
              Preparing your workspace...
            </p>
            <p className="text-gray-400 text-sm">
              This will only take a moment
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <ReduxProvider>
      <ReactQueryProvider>
        <div
          className={`fixed top-0 left-0 right-0 bg-red-600 text-white text-sm py-2 text-center z-50 transition-all duration-300 transform ${
            !isOnline
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
