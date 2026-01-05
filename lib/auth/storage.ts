import Cookies from "js-cookie";
import type {
  AuthLoginResponse,
  AuthRegisterResponse,
  GanadexSession,
} from "@/lib/types/auth";

const TOKEN_KEY = "ganadex_token";
const SESSION_KEY = "ganadex_session";

export function saveSession(
  response: AuthRegisterResponse | AuthLoginResponse
) {
  if (typeof window === "undefined") return;

  Cookies.set(TOKEN_KEY, response.access_token, {
    expires: 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const session: GanadexSession = {
    user: response.user,
    empresas: response.empresas,
    empresa_activa_id: response.empresa_activa_id ?? null,
  };

  setStoredSession(session);
}

export function setStoredSession(session: GanadexSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStoredSession(): GanadexSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as GanadexSession;
    if (!parsed?.user?.id || !Array.isArray(parsed.empresas)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function updateStoredSession(
  patch: Partial<GanadexSession>
): GanadexSession | null {
  if (typeof window === "undefined") return null;
  const current = getStoredSession();
  if (!current) return null;

  const next: GanadexSession = {
    ...current,
    ...patch,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export function logout() {
  if (typeof window === "undefined") return;

  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "/login";
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return Cookies.get(TOKEN_KEY) ?? null;
}
