"use client";

import type { ApiError } from "@/lib/api/client";

export type ParsedApiError = {
  title: string;
  description: string;
  fieldErrors?: Record<string, string[]>;
};

export function parseApiError(error: unknown): ParsedApiError {
  if (!error || typeof error !== "object") {
    return {
      title: "Error inesperado",
      description: "Ocurrió un error al procesar la solicitud.",
    };
  }

  const apiError = error as ApiError;
  const status = apiError.status ?? 500;

  // Extract field errors if present
  let fieldErrors: Record<string, string[]> | undefined;
  const details = apiError.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    fieldErrors = {};
    for (const [key, value] of Object.entries(details)) {
      if (Array.isArray(value)) {
        fieldErrors[key] = value.map(String);
      } else if (typeof value === "string") {
        fieldErrors[key] = [value];
      }
    }
  }

  const titleByStatus: Record<number, string> = {
    400: "Datos inválidos",
    401: "No autorizado",
    403: "Sin permisos",
    404: "No encontrado",
    409: "Conflicto",
    422: "Error de validación",
    500: "Error del servidor",
  };

  return {
    title: titleByStatus[status] ?? "Error",
    description: apiError.message ?? "Ocurrió un error inesperado.",
    fieldErrors: Object.keys(fieldErrors ?? {}).length ? fieldErrors : undefined,
  };
}

export function isNoEmpresaActivaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const apiError = error as ApiError;
  
  // Check for specific codes that indicate missing empresa activa
  if (apiError.status === 409 || apiError.status === 400) {
    const message = apiError.message?.toLowerCase() ?? "";
    return (
      message.includes("empresa_activa") ||
      message.includes("empresa activa") ||
      message.includes("selecciona una empresa")
    );
  }
  return false;
}
