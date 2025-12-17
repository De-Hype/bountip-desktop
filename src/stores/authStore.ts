import { create } from "zustand";
import { AuthTokens } from "@/utils/tokenManager";

export type AuthUser = {
  id?: string | number;
  email?: string;
  name?: string;
  status?: string;
  isEmailVerified?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  pin: string;
  setAuth: (payload: { user: AuthUser | null; tokens: AuthTokens }) => void;
  clearAuth: () => void;
  setPin: (pin: string) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  pin: "",
  setAuth: ({ user, tokens }) =>
    set({
      user,
      tokens,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      pin: "",
    }),
  setPin: (pin) => set({ pin }),
}));
