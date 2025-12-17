export enum COOKIE_NAMES {
  BOUNTIP_LOGIN_USER_TOKENS = "bountip_login_user_tokens",
  BOUNTIP_LOGIN_USER = "bountip_login_user",
  RESET_USER_EMAIL = "reset_user_email",
  TOKEN_USER_EMAIL = "token_user_email",
  REG_USER_EMAIL = "reg_user_email",
}

export function setCookie<T>(
  name: COOKIE_NAMES | string,
  value: T,
  days = 7
): void {
  if (typeof document === "undefined") return;
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  const serialized =
    typeof value === "string"
      ? value
      : encodeURIComponent(JSON.stringify(value));
  document.cookie = `${name}=${serialized}; expires=${expires}; path=/`;
}

export function getCookie<T = unknown>(name: COOKIE_NAMES | string): T | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.split("=")[1];
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return value as unknown as T;
  }
}

export function deleteCookie(name: COOKIE_NAMES | string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

