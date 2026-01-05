import { postJSON } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/request";
import type {
  AuthLoginResponse,
  AuthRegisterResponse,
  GanadexSession,
  LoginRequest,
  RegisterRequest,
} from "@/lib/types/auth";
import {
  getStoredSession,
  getToken,
  logout,
  saveSession,
  setStoredSession,
  updateStoredSession,
} from "@/lib/auth/storage";

export async function register(
  data: RegisterRequest
): Promise<AuthRegisterResponse> {
  return postJSON<AuthRegisterResponse>("/auth/register", data);
}

export async function login(data: LoginRequest): Promise<AuthLoginResponse> {
  return postJSON<AuthLoginResponse>("/auth/login", data);
}

export async function setActiveCompany(
  empresaId: string
): Promise<GanadexSession> {
  return apiRequest<GanadexSession>("/auth/empresa-activa", {
    method: "POST",
    body: {
      empresa_id: empresaId,
    },
  });
}

export {
  getStoredSession,
  getToken,
  logout,
  saveSession,
  setStoredSession,
  updateStoredSession,
};
