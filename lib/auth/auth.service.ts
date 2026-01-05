import Cookies from "js-cookie";
import { postJSON } from "@/lib/api/client";
import type {
  AuthLoginResponse,
  AuthRegisterResponse,
  GanadexSession,
  LoginRequest,
  RegisterRequest,
} from "@/lib/types/auth";

const TOKEN_KEY = "ganadex_token";
const SESSION_KEY = "ganadex_session";

export async function register(
  data: RegisterRequest
): Promise<AuthRegisterResponse> {
  return postJSON<AuthRegisterResponse>("/auth/register", data);
}

export async function login(data: LoginRequest): Promise<AuthLoginResponse> {
  return postJSON<AuthLoginResponse>("/auth/login", data);
}

export function saveSession(
  response: AuthRegisterResponse | AuthLoginResponse
) {
  if (typeof window === "undefined") return;

  Cookies.set(TOKEN_KEY, response.access_token, {
    expires: 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const empresaActivaId =
    "empresa_activa_sugerida" in response &&
    response.empresa_activa_sugerida
      ? response.empresa_activa_sugerida
      : response.empresas[0]?.id ?? null;

  const session: GanadexSession = {
    user: response.user,
    empresas: response.empresas,
    empresa_activa_id: empresaActivaId,
  };

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
