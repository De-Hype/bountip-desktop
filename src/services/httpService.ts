// import { tokenManager } from "@/utils/tokenManager";

// export class HttpService {
//   private baseUrl: string;

//   constructor() {
//     this.baseUrl =
//       //"https://seal-app-wzqhf.ondigitalocean.app"
//       "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
//   }

//   private buildUrl(path: string): string {
//     if (path.startsWith("http")) return path;
//     return `${this.baseUrl}${path}`;
//   }

//   private async request<T>(
//     method: "GET" | "POST" | "PATCH" | "DELETE",
//     path: string,
//     data?: unknown,
//     useAuth = false
//   ): Promise<T> {
//     const headers: Record<string, string> = {
//       "Content-Type": "application/json",
//     };

//     if (useAuth) {
//       const accessToken = tokenManager.getAccessToken();
//       if (accessToken) {
//         headers["Authorization"] = `Bearer ${accessToken}`;
//       }
//     }

//     const response = await fetch(this.buildUrl(path), {
//       method,
//       headers,
//       body:
//         method === "POST" || method === "PATCH"
//           ? JSON.stringify(data ?? {})
//           : undefined,
//     });

//     const json = await response.json().catch(() => null);

//     if (!response.ok) {
//       const message =
//         (json && (json.message || json.error)) ||
//         `Request failed with status ${response.status}`;
//       throw new Error(message);
//     }

//     return json as T;
//   }

//   get<T>(path: string, useAuth = false) {
//     return this.request<T>("GET", path, undefined, useAuth);
//   }

//   post<T>(path: string, data?: unknown, useAuth = false) {
//     return this.request<T>("POST", path, data, useAuth);
//   }

//   patch<T>(path: string, data?: unknown, useAuth = false) {
//     return this.request<T>("PATCH", path, data, useAuth);
//   }

//   delete<T>(path: string, data?: unknown, useAuth = false) {
//     return this.request<T>("DELETE", path, data, useAuth);
//   }
// }

// const httpService = new HttpService();
// export default httpService;

import { tokenManager } from "@/utils/tokenManager";

type ElectronAPI = {
  getNetworkStatus: () => Promise<{ online: boolean }>;
  cacheGet: (key: string) => Promise<any>;
  cachePut: (key: string, value: any) => Promise<void>;
  queueAdd: (op: { method: string; path: string; data?: any; useAuth?: boolean }) => Promise<void>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

export class HttpService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      //"https://seal-app-wzqhf.ondigitalocean.app"
      "https://seal-app-wzqhf.ondigitalocean.app/api/v1";
  }

  private buildUrl(path: string): string {
    if (path.startsWith("http")) return path;
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    data?: unknown,
    useAuth = false,
    fullError = false
  ): Promise<T> {
    const api = getElectronAPI();
    const key = `GET:${path}`;
    // Strict offline guard: never perform network calls when offline
    if (api) {
      try {
        const { online } = await api.getNetworkStatus();
        if (!online) {
          if (method === "GET") {
            try {
              const cached = await api.cacheGet(key);
              if (cached != null) return cached as T;
            } catch {}
            try {
              await api.queueAdd({ method: "GET", path, useAuth });
            } catch {}
            const err = new Error("offline");
            (err as any).code = "OFFLINE";
            throw err;
          } else {
            try {
              await api.queueAdd({ method, path, data, useAuth });
            } catch {}
            const err = new Error("offline");
            (err as any).code = "OFFLINE";
            throw err;
          }
        }
      } catch {}
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (useAuth) {
      const accessToken = tokenManager.getAccessToken();
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(this.buildUrl(path), {
      method,
      headers,
      body:
        method === "POST" || method === "PATCH"
          ? JSON.stringify(data ?? {})
          : undefined,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      if (fullError) {
        // Throw an error with full context
        const error = new Error(
          (json && (json.message || json.error)) ||
            `Request failed with status ${response.status}`
        );
        (error as any).response = {
          status: response.status,
          statusText: response.statusText,
          data: json,
        };
        throw error;
      } else {
        // Throw simple message (default behavior)
        const message =
          (json && (json.message || json.error)) ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }
    }

    // Cache successful GET responses
    if (method === "GET" && api) {
      try {
        await api.cachePut(key, json);
      } catch {}
    }

    return json as T;
  }

  get<T>(path: string, useAuth = false, fullError = false) {
    return this.request<T>("GET", path, undefined, useAuth, fullError);
  }

  post<T>(path: string, data?: unknown, useAuth = false, fullError = false) {
    const api = getElectronAPI();
    if (api) {
      // request() already guards offline and queues; keep catch for non-offline failures
      return this.request<T>("POST", path, data, useAuth, fullError).catch(async (err) => {
        try {
          const { online } = await api.getNetworkStatus();
          if (!online) return Promise.reject(err);
        } catch {}
        // For other errors, propagate
        throw err;
      });
    }
    return this.request<T>("POST", path, data, useAuth, fullError);
  }

  patch<T>(path: string, data?: unknown, useAuth = false, fullError = false) {
    const api = getElectronAPI();
    if (api) {
      return this.request<T>("PATCH", path, data, useAuth, fullError).catch(async (err) => {
        try {
          const { online } = await api.getNetworkStatus();
          if (!online) return Promise.reject(err);
        } catch {}
        throw err;
      });
    }
    return this.request<T>("PATCH", path, data, useAuth, fullError);
  }

  delete<T>(path: string, data?: unknown, useAuth = false, fullError = false) {
    const api = getElectronAPI();
    if (api) {
      return this.request<T>("DELETE", path, data, useAuth, fullError).catch(async (err) => {
        try {
          const { online } = await api.getNetworkStatus();
          if (!online) return Promise.reject(err);
        } catch {}
        throw err;
      });
    }
    return this.request<T>("DELETE", path, data, useAuth, fullError);
  }
}

const httpService = new HttpService();
export default httpService;
