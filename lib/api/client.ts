export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const defaultMessageByStatus: Record<number, string> = {
  400: "Datos involidos",
  401: "Credenciales involidas",
  404: "Recurso no encontrado",
  409: "El email ya esto registrado",
};

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no esto configurado");
  }
  return baseUrl.replace(/\/$/, "");
}

export function resolveApiErrorMessage(body: any, status: number) {
  const message =
    typeof body?.message === "string"
      ? body.message
      : typeof body?.error === "string"
        ? body.error
        : Array.isArray(body?.errors)
          ? body.errors.join(", ")
          : typeof body?.errors === "string"
            ? body.errors
            : undefined;

  return message || defaultMessageByStatus[status] || "Error inesperado";
}

export function buildApiUrl(path: string) {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
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
