import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    TransaccionFinanciera,
    CreateTransaccionDTO,
    UpdateTransaccionDTO,
    CategoriaFinanciera,
    CreateCategoriaDTO,
    UpdateCategoriaDTO,
    TipoTransaccion,
    Moneda,
    Adjunto,
} from "@/lib/types/business";

export type TransaccionesQuery = {
    q?: string;
    tipo?: string;
    categoria_id?: string;
    moneda_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
};

export type CategoriasQuery = {
    tipo?: string;
    page?: number;
    limit?: number;
};

function buildQueryString(query: Record<string, unknown>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    }
    const str = params.toString();
    return str ? `?${str}` : "";
}

// Transacciones
export async function fetchTransacciones(
    query: TransaccionesQuery = {}
): Promise<PaginatedResponse<TransaccionFinanciera>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<TransaccionFinanciera>>(
        `${endpoints.finanzasTransacciones}${qs}`
    );
}

export async function fetchTransaccion(id: string): Promise<TransaccionFinanciera> {
    return apiRequest<TransaccionFinanciera>(endpoints.finanzasTransaccionById(id));
}

export async function createTransaccion(
    data: CreateTransaccionDTO
): Promise<TransaccionFinanciera> {
    return apiRequest<TransaccionFinanciera>(endpoints.finanzasTransacciones, {
        method: "POST",
        body: data,
    });
}

export async function updateTransaccion(
    id: string,
    data: UpdateTransaccionDTO
): Promise<TransaccionFinanciera> {
    return apiRequest<TransaccionFinanciera>(endpoints.finanzasTransaccionById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteTransaccion(id: string): Promise<void> {
    return apiRequest<void>(endpoints.finanzasTransaccionById(id), {
        method: "DELETE",
    });
}

// Adjuntos
export async function fetchAdjuntos(transaccionId: string): Promise<Adjunto[]> {
    return apiRequest<Adjunto[]>(endpoints.finanzasTransaccionAdjuntos(transaccionId));
}

export async function deleteAdjunto(id: string): Promise<void> {
    return apiRequest<void>(endpoints.finanzasAdjuntoById(id), {
        method: "DELETE",
    });
}

// Categorías
export async function fetchCategorias(
    query: CategoriasQuery = {}
): Promise<PaginatedResponse<CategoriaFinanciera>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<CategoriaFinanciera>>(
        `${endpoints.finanzasCategorias}${qs}`
    );
}

export async function fetchCategoria(id: string): Promise<CategoriaFinanciera> {
    return apiRequest<CategoriaFinanciera>(endpoints.finanzasCategoriaById(id));
}

export async function createCategoria(
    data: CreateCategoriaDTO
): Promise<CategoriaFinanciera> {
    return apiRequest<CategoriaFinanciera>(endpoints.finanzasCategorias, {
        method: "POST",
        body: data,
    });
}

export async function updateCategoria(
    id: string,
    data: UpdateCategoriaDTO
): Promise<CategoriaFinanciera> {
    return apiRequest<CategoriaFinanciera>(endpoints.finanzasCategoriaById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteCategoria(id: string): Promise<void> {
    return apiRequest<void>(endpoints.finanzasCategoriaById(id), {
        method: "DELETE",
    });
}

// Tipos
export async function fetchTiposTransaccion(): Promise<TipoTransaccion[]> {
    return apiRequest<TipoTransaccion[]>(endpoints.finanzasTipos);
}

// Monedas
export async function fetchMonedas(): Promise<Moneda[]> {
    return apiRequest<Moneda[]>(endpoints.monedas);
}
