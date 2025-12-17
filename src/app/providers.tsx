/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
"use client";

import ReactQueryProvider from "@/react-query/providers";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { tokenManager } from "@/utils/tokenManager";
import { userStorage } from "@/services/userStorage";
import useToastStore from "@/stores/toastStore";
import Toast from "@/shared/Toast/Toast";
import AssetsFiles from "@/assets";
import Image from "next/image";
import httpService from "@/services/httpService";
import businessService from "@/services/businessService";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { outletApi } from "@/redux/outlets";
import { appApi } from "@/redux/app";
import { authApi } from "@/redux/auth";
import { getPhoneCountries } from "@/utils/getPhoneCountries";
import useBusinessStore from "@/stores/useBusinessStore";
import { electronNavigate } from "@/utils/electronNavigate";
import { WifiOff } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim()
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : "https://seal-app-wzqhf.ondigitalocean.app/api/v1";

const PUBLIC_PATHS = ["/auth/", "/reset-password/", "/verify/"];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const toast = useToastStore();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const SYNC_INTERVAL_MS = Number(
    process.env.NEXT_PUBLIC_SYNC_INTERVAL_MS || 300000
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
   * STEP 2 — NETWORK STATUS SYNC (ELECTRON)
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const api = (window as any).electronAPI;
    if (!api) return;

    const sync = () => api.setNetworkStatus(navigator.onLine);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    api
      .getNetworkStatus()
      .then(({ online }: any) => setIsOnline(online))
      .catch(() => setIsOnline(navigator.onLine));

    const off = api.onNetworkStatus(({ online }: any) => setIsOnline(online));

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      off && off();
    };
  }, []);

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
        await businessService.loadBusiness();
        await businessService.loadAllOutlet();

        const queue = (await api.queueList()) || [];
        const failed: any[] = [];

        for (const op of queue) {
          try {
            if (op.method === "POST")
              await httpService.post(op.path, op.data, true, true);
            if (op.method === "PATCH")
              await httpService.patch(op.path, op.data, true, true);
            if (op.method === "DELETE")
              await httpService.delete(op.path, op.data, true, true);
          } catch {
            failed.push(op);
          }
        }

        await api.queueSet(failed);
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

    const isFile =
      typeof window !== "undefined" && window.location.protocol === "file:";
    let fileRoute = "";
    if (isFile) {
      try {
        const afterOut = window.location.pathname.split("/out/")[1] || "";
        // Normalize like app router paths (strip index.html, trailing slash)
        fileRoute =
          "/" + afterOut.replace(/index\.html$/, "").replace(/\/?$/, "");
      } catch {}
    }

    const isPublic =
      PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      (isFile &&
        (fileRoute.startsWith("/auth") ||
          fileRoute.startsWith("/reset-password") ||
          fileRoute.startsWith("/verify")));

    if (!isAuthenticated && !isPublic) {
      if (isFile) {
        if (!fileRoute.startsWith("/auth")) electronNavigate("auth");
      } else {
        if (pathname !== "/auth") electronNavigate("auth");
      }
      return;
    }

    const onAuthPage =
      pathname.startsWith("/auth/") ||
      (isFile && fileRoute.startsWith("/auth"));
    if (isAuthenticated && onAuthPage) {
      if (isFile) {
        if (!fileRoute.startsWith("/dashboard")) electronNavigate("dashboard");
      } else {
        if (pathname !== "/dashboard") electronNavigate("dashboard");
      }
    }
  }, [isAuthenticated, pathname, isBootstrapping]);

  /**
   * ------------------------------------------------------
   * SPLASH SCREEN (NEVER RETURN NULL)
   * ------------------------------------------------------
   */
  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Image
          src={AssetsFiles.LogoTwo}
          alt="Bountip"
          priority
          className="w-36 animate-pulse"
        />
      </div>
    );
  }

  return (
    <ReduxProvider>
      <ReactQueryProvider>
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-sm py-2 text-center z-50">
            <WifiOff size={16} className="inline mr-2" />
            Offline mode — syncing paused
          </div>
        )}

        <Toast {...toast} />
        {children}
      </ReactQueryProvider>
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
          authApi.middleware
        ),
    })
  );

  return <Provider store={store}>{children}</Provider>;
}
