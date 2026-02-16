export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

let inMemoryTokens: AuthTokens | null = null;

type ElectronAPI = {
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
      api.clearTokens();
    }
  },

  /**
   * Load tokens from the secure store (keytar via Electron main process)
   * into the in-memory cache. Returns the tokens or null.
   */
  async loadTokensFromStore(): Promise<AuthTokens | null> {
    const api = getElectronAPI();
    if (!api) return null;

    try {
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

  getAccessToken(): string | null {
    return this.getTokens()?.accessToken ?? null;
  },

  getRefreshToken(): string | null {
    return this.getTokens()?.refreshToken ?? null;
  },
};
