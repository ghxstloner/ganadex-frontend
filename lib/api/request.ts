"use client";

import { toast } from "sonner";
import {
  buildApiUrl,
  resolveApiErrorMessage,
  type ApiError,
} from "@/lib/api/client";
import { getToken, logout } from "@/lib/auth/storage";

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  withAuth?: boolean;
  toastOnError?: boolean;
};

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const url = buildApiUrl(path);
  const method = options.method ?? (options.body ? "POST" : "GET");
  const headers: HeadersInit = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.withAuth !== false) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
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

    if (options.toastOnError !== false) {
      if (response.status === 401) {
        toast.error("Sesion expirada. Inicia sesion de nuevo.");
      } else {
        toast.error(error.message);
      }
    }

    if (response.status === 401) {
      logout();
    }

    throw error;
  }

  return body as TResponse;
}

export const apiClient = apiRequest;
