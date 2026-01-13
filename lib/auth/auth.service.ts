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
  return apiRequest<AuthRegisterResponse>("/auth/register", {
    method: "POST",
    body: data,
    skipTenant: true,
    toastOnError: false,
  });
}

export async function login(data: LoginRequest): Promise<AuthLoginResponse> {
  return apiRequest<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: data,
    skipTenant: true,
    toastOnError: false,
  });
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
