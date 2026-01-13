"use client";

import { toast } from "sonner";
import {
  buildApiUrl,
  resolveApiErrorMessage,
  type ApiError,
} from "@/lib/api/client";
import { getToken, getStoredSession, logout } from "@/lib/auth/storage";
import { isNoEmpresaActivaError } from "@/lib/api/errors";

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  withAuth?: boolean;
  toastOnError?: boolean;
  /** Skip empresa_activa_id injection (for auth routes) */
  skipTenant?: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

function redirectToSelectCompany() {
  if (typeof window !== "undefined") {
    toast.error("Selecciona una empresa para continuar");
    window.location.href = "/select-company";
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const url = buildApiUrl(path);
  const method = options.method ?? (options.body ? "POST" : "GET");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Inject auth token
  if (options.withAuth !== false) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Inject empresa activa header for business endpoints
  if (!options.skipTenant) {
    const session = getStoredSession();
    if (session?.empresa_activa_id) {
      headers["x-empresa-id"] = session.empresa_activa_id;
    } else {
      // For non-auth endpoints, require empresa activa
      const isAuthPath = path.startsWith("/auth") || path === "/me";
      if (!isAuthPath && typeof window !== "undefined") {
        redirectToSelectCompany();
        throw new Error("Empresa activa requerida");
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const body =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: resolveApiErrorMessage(body, response.status),
      details: body?.errors ?? body?.details,
    };

    // Check for empresa activa required error
    if (isNoEmpresaActivaError(error)) {
      redirectToSelectCompany();
      throw error;
    }

    // Check if this is an auth route (login/register)
    const isAuthRoute = path.startsWith("/auth/login") || path.startsWith("/auth/register");

    if (options.toastOnError !== false) {
      if (response.status === 401) {
        toast.error("Sesión expirada. Inicia sesión de nuevo.");
      } else {
        toast.error(error.message);
      }
    }

    // Only logout on 401 if not on auth routes (login/register errors shouldn't trigger logout)
    if (response.status === 401 && !isAuthRoute) {
      logout();
    }

    throw error;
  }

  // Handle wrapper compatibility: {ok: true, data} or direct response
  if (body && typeof body === "object" && "ok" in body && body.ok === true) {
    // Wrapped response
    if ("meta" in body) {
      // Return data with meta for paginated responses
      return { items: body.data, meta: body.meta } as TResponse;
    }
    return body.data as TResponse;
  }

  // Handle direct paginated response: {data: [...], meta: {...}}
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    "meta" in body &&
    Array.isArray(body.data)
  ) {
    return { items: body.data, meta: body.meta } as TResponse;
  }

  return body as TResponse;
}

export const apiClient = apiRequest;
