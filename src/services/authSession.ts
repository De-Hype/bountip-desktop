import { NavigateFunction } from "react-router-dom";
import { tokenManager } from "@/utils/tokenManager";
import { useAuthStore } from "@/stores/authStore";
import { COOKIE_NAMES } from "@/utils/cookiesUtils";

export const performLogout = (navigate: NavigateFunction) => {
  // Clear tokens from memory + keytar
  tokenManager.clearTokens();

  // Clear auth store
  const { clearAuth, user } = useAuthStore.getState();

  // Persist last email for PIN login
  const email = user?.email || null;
  const api = (window as any).electronAPI;
  if (email && api?.cachePut) {
    api.cachePut(COOKIE_NAMES.TOKEN_USER_EMAIL, email);
  }
  clearAuth();

  // Clear any related cookies
  if (api?.cachePut) {
    api.cachePut(COOKIE_NAMES.REG_USER_EMAIL, null);
    api.cachePut(COOKIE_NAMES.RESET_USER_EMAIL, null);
  }

  // Redirect to sign-in
  navigate("/auth");
};
