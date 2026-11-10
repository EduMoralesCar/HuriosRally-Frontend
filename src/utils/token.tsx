import { clearCurrentEmail } from "../api/localStorageDb";

const TOKEN_KEY = "hurios_token";
const ROLE_KEY = "hurios_role";
const AUTH_MESSAGE_KEY = "hurios_auth_message";
const TAB_INIT_KEY = "hurios_tab_session_initialized";
const DEFAULT_EXPIRED_MESSAGE = "Tu sesion expiro. Inicia sesion de nuevo.";

function ensureTabHydrated() {
  if (typeof window === "undefined") return;
  try {
    const initialized = window.sessionStorage.getItem(TAB_INIT_KEY);
    if (!initialized) {
      const localToken = window.localStorage.getItem(TOKEN_KEY);
      const localRole = window.localStorage.getItem(ROLE_KEY);
      if (localToken && !window.sessionStorage.getItem(TOKEN_KEY)) {
        window.sessionStorage.setItem(TOKEN_KEY, localToken);
      }
      if (localRole && !window.sessionStorage.getItem(ROLE_KEY)) {
        window.sessionStorage.setItem(ROLE_KEY, localRole);
      }
      window.sessionStorage.setItem(TAB_INIT_KEY, "true");
    }
  } catch {
    // ignore storage errors
  }
}

export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    // Guardar en sessionStorage permite que cada pestaña tenga su propia cuenta activa (Admin en Pestaña 1 y Cliente en Pestaña 2)
    window.sessionStorage.setItem(TOKEN_KEY, token);
    window.sessionStorage.setItem(TAB_INIT_KEY, "true");
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    ensureTabHydrated();
    return (
      window.sessionStorage.getItem(TOKEN_KEY) ||
      window.localStorage.getItem(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(ROLE_KEY);
    window.sessionStorage.setItem(TAB_INIT_KEY, "true");
    clearCurrentEmail();
  } catch {
    // ignore
  }
}

export function saveRole(role: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ROLE_KEY, role);
    window.sessionStorage.setItem(TAB_INIT_KEY, "true");
    window.localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    ensureTabHydrated();
    return (
      window.sessionStorage.getItem(ROLE_KEY) ||
      window.localStorage.getItem(ROLE_KEY)
    );
  } catch {
    return null;
  }
}

export function redirectToLoginForExpiredSession(
  message: string = DEFAULT_EXPIRED_MESSAGE,
) {
  if (typeof window === "undefined") {
    return;
  }

  clearToken();
  window.sessionStorage?.setItem(AUTH_MESSAGE_KEY, message);

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export function consumeAuthMessage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const message = window.sessionStorage?.getItem(AUTH_MESSAGE_KEY) || null;

  if (message) {
    window.sessionStorage?.removeItem(AUTH_MESSAGE_KEY);
  }

  return message;
}

export function handleUnauthorizedResponse(
  message: string = DEFAULT_EXPIRED_MESSAGE,
): never {
  redirectToLoginForExpiredSession(message);
  throw new Error(message);
}
