export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

let inMemoryTokens: AuthTokens | null = null;
let refreshInFlight: Promise<AuthTokens | null> | null = null;

const TOKENS_CACHE_KEY = "auth:tokens";
const API_BASE_URL = "https://seal-app-wzqhf.ondigitalocean.app/api/v1";

type ElectronAPI = {
  cacheGet?: (key: string) => Promise<any>;
  cachePut?: (key: string, value: any) => Promise<void>;
  cacheDelete?: (key: string) => Promise<void>;
  storeTokens: (payload: AuthTokens) => void;
  clearTokens: () => void;
  getTokens: () => Promise<AuthTokens | null>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

export const tokenManager = {
  setTokens(accessToken: string, refreshToken: string) {
    inMemoryTokens = { accessToken, refreshToken };
    const api = getElectronAPI();
    if (api) {
      if (api.cachePut) {
        api
          .cachePut(TOKENS_CACHE_KEY, { accessToken, refreshToken })
          .catch(() => null);
      }
      api.storeTokens({ accessToken, refreshToken });
    }
  },

  getTokens(): AuthTokens | null {
    return inMemoryTokens;
  },

  clearTokens() {
    inMemoryTokens = null;
    const api = getElectronAPI();
    if (api) {
      if (api.cacheDelete) {
        api.cacheDelete(TOKENS_CACHE_KEY).catch(() => null);
      }
      api.clearTokens();
    }
  },

  /**
   * Load tokens from cache / secure store (Electron main process)
   * into the in-memory cache. Returns the tokens or null.
   */
  async loadTokensFromStore(): Promise<AuthTokens | null> {
    const api = getElectronAPI();
    if (!api) return null;

    try {
      if (api.cacheGet) {
        const cached = await api.cacheGet(TOKENS_CACHE_KEY);
        const cachedAccessToken =
          cached?.accessToken != null ? String(cached.accessToken) : "";
        const cachedRefreshToken =
          cached?.refreshToken != null ? String(cached.refreshToken) : "";
        if (cachedAccessToken && cachedRefreshToken) {
          const stored = {
            accessToken: cachedAccessToken,
            refreshToken: cachedRefreshToken,
          };
          inMemoryTokens = stored;
          return stored;
        }
      }

      const stored = await api.getTokens();
      if (!stored) {
        inMemoryTokens = null;
        return null;
      }
      inMemoryTokens = stored;
      return stored;
    } catch {
      // On any IPC failure, just behave as logged out
      inMemoryTokens = null;
      return null;
    }
  },

  async hydrate(): Promise<AuthTokens | null> {
    return this.loadTokensFromStore();
  },

  async refreshAccessToken(): Promise<AuthTokens | null> {
    if (refreshInFlight) return refreshInFlight;

    const run = async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return null;

      const endpoints = [
        "/auth/refresh",
        // "/auth/refresh-token",
        // "/auth/refreshToken",
        // "/auth/token/refresh",
      ];

      for (const path of endpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${path}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const json = await response.json().catch(() => null);
          if (!response.ok) {
            if (response.status === 404) continue;
            return null;
          }

          const rawTokens =
            json?.data?.tokens ??
            json?.data?.token ??
            json?.tokens ??
            json?.token ??
            json?.data ??
            json;

          const nextAccessToken =
            rawTokens?.accessToken ??
            rawTokens?.access_token ??
            rawTokens?.access ??
            rawTokens?.token ??
            "";
          const nextRefreshToken =
            rawTokens?.refreshToken ?? rawTokens?.refresh_token ?? refreshToken;

          const accessToken =
            nextAccessToken != null ? String(nextAccessToken) : "";
          const updatedRefreshToken =
            nextRefreshToken != null ? String(nextRefreshToken) : "";

          if (!accessToken || !updatedRefreshToken) return null;
          this.setTokens(accessToken, updatedRefreshToken);
          return { accessToken, refreshToken: updatedRefreshToken };
        } catch {
          continue;
        }
      }

      return null;
    };

    refreshInFlight = run().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  },

  getAccessToken(): string | null {
    return this.getTokens()?.accessToken ?? null;
  },

  getRefreshToken(): string | null {
    return this.getTokens()?.refreshToken ?? null;
  },
};
