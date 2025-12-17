import { NavigateFunction } from "react-router-dom";
import { tokenManager } from "@/utils/tokenManager";
import { useAuthStore } from "@/stores/authStore";
import { deleteCookie, COOKIE_NAMES, setCookie } from "@/utils/cookiesUtils";

export const performLogout = (navigate: NavigateFunction) => {
  // Clear tokens from memory + keytar
  tokenManager.clearTokens();

  // Clear auth store
  const { clearAuth, user } = useAuthStore.getState();

  // Persist last email for PIN login
  const email = user?.email || null;
  if (email) setCookie(COOKIE_NAMES.TOKEN_USER_EMAIL, email, 30);
  clearAuth();

  // Clear any related cookies
  deleteCookie(COOKIE_NAMES.BOUNTIP_LOGIN_USER_TOKENS);
  deleteCookie(COOKIE_NAMES.BOUNTIP_LOGIN_USER);
  deleteCookie(COOKIE_NAMES.REG_USER_EMAIL);
  deleteCookie(COOKIE_NAMES.RESET_USER_EMAIL);

  // Redirect to sign-in
  navigate("/auth");
};
