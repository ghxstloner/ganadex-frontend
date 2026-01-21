export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const defaultMessageByStatus: Record<number, string> = {
  400: "Datos invalidos",
  401: "Credenciales invalidas",
  403: "No tienes permisos para esta accion",
  404: "Recurso no encontrado",
  409: "El email ya esta registrado",
};

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no esta configurado");
  }
  return baseUrl.replace(/\/$/, "");
}

export function resolveApiErrorMessage(body: unknown, status: number) {
  const payload = body as {
    message?: string;
    error?: string;
    errors?: string[] | string;
  } | null;
  const message =
    typeof payload?.message === "string"
      ? payload.message
      : typeof payload?.error === "string"
        ? payload.error
        : Array.isArray(payload?.errors)
          ? payload.errors.join(", ")
          : typeof payload?.errors === "string"
            ? payload.errors
            : undefined;

  return message || defaultMessageByStatus[status] || "Error inesperado";
}

export function buildApiUrl(path: string) {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Construye la URL completa para una imagen subida al backend.
 * Normaliza las rutas con backslashes (Windows) a forward slashes.
 * @param fotoUrl - Ruta relativa de la imagen (ej: "uploads\\2\\animales\\animal_1.webp")
 * @returns URL completa para acceder a la imagen
 */
export function buildImageUrl(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null;
  
  // Normalizar backslashes a forward slashes
  const normalizedPath = fotoUrl.replace(/\\/g, "/");
  
  // Asegurar que comience con /uploads/
  const path = normalizedPath.startsWith("/") 
    ? normalizedPath 
    : normalizedPath.startsWith("uploads/")
      ? `/${normalizedPath}`
      : `/uploads/${normalizedPath}`;
  
  return buildApiUrl(path);
}

export async function postJSON<TResponse>(
  path: string,
  data: unknown
): Promise<TResponse> {
  const url = buildApiUrl(path);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: resolveApiErrorMessage(body, response.status),
      details: body?.errors ?? body?.details,
    };
    throw error;
  }

  return body as TResponse;
}
