import type { AuthUser } from "@/stores/authStore";

type StoredUser = AuthUser & {
  status?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ElectronAPI = {
  saveUser: (user: StoredUser) => Promise<void>;
  getUser: () => Promise<StoredUser | null>;
};

const getElectronAPI = (): ElectronAPI | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
};

export const userStorage = {
  async saveUserFromApi(apiUser: any) {
    const api = getElectronAPI();
    if (!api || !apiUser) return;

    const userToStore: StoredUser = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.fullName,
      status: apiUser.status,
      isEmailVerified: apiUser.isEmailVerified,
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt,
    };

    await api.saveUser(userToStore);
  },

  async loadUser(): Promise<StoredUser | null> {
    const api = getElectronAPI();
    if (!api) return null;
    try {
      const stored = await api.getUser();
      return stored ?? null;
    } catch {
      return null;
    }
  },
};
