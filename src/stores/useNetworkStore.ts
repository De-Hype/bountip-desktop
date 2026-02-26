import { create } from "zustand";

type ElectronAPI = {
  getNetworkStatus: () => Promise<{ online: boolean }>;
  onNetworkStatus: (
    callback: (status: { online: boolean }) => void
  ) => () => void;
  setNetworkStatus: (online: boolean) => void;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

type NetworkState = {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),
}));

export const initializeNetworkListeners = () => {
  const { setIsOnline } = useNetworkStore.getState();
  const api = getElectronAPI();

  if (!api) {
    // Fallback for browser environment (if running without Electron)
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }

  // 1. Initial Fetch from Main Process
  api
    .getNetworkStatus()
    .then(({ online }) => {
      console.log("[NetworkStore] Initial network status:", online);
      setIsOnline(online);
    })
    .catch((err) => {
      console.error("[NetworkStore] Failed to get network status:", err);
      setIsOnline(false);
    });

  // 2. Listen for Updates from Main Process
  const removeListener = api.onNetworkStatus(({ online }) => {
    console.log("[NetworkStore] Network status updated:", online);
    setIsOnline(online);
  });

  // 3. Notify Main Process of Browser Events
  const handleBrowserOnline = () => api.setNetworkStatus(true);
  const handleBrowserOffline = () => api.setNetworkStatus(false);

  window.addEventListener("online", handleBrowserOnline);
  window.addEventListener("offline", handleBrowserOffline);

  return () => {
    window.removeEventListener("online", handleBrowserOnline);
    window.removeEventListener("offline", handleBrowserOffline);
    if (removeListener) removeListener();
  };
};
