import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    EntregaLeche,
    CreateEntregaLecheDTO,
    UpdateEntregaLecheDTO,
    LiquidacionLeche,
    CreateLiquidacionLecheDTO,
    UpdateLiquidacionLecheDTO,
    ConciliacionLeche,
} from "@/lib/types/business";

export type EntregasLecheQuery = {
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor_id?: string;
    page?: number;
    limit?: number;
};

export type LiquidacionesLecheQuery = {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
};

export type ConciliacionQuery = {
    periodo_inicio: string;
    periodo_fin: string;
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

// Entregas
export async function fetchEntregasLeche(
    query: EntregasLecheQuery = {}
): Promise<PaginatedResponse<EntregaLeche>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<EntregaLeche>>(
        `${endpoints.lecheEntregas}${qs}`
    );
}

export async function fetchEntregaLeche(id: string): Promise<EntregaLeche> {
    return apiRequest<EntregaLeche>(endpoints.lecheEntregaById(id));
}

export async function createEntregaLeche(
    data: CreateEntregaLecheDTO
): Promise<EntregaLeche> {
    return apiRequest<EntregaLeche>(endpoints.lecheEntregas, {
        method: "POST",
        body: data,
    });
}

export async function updateEntregaLeche(
    id: string,
    data: UpdateEntregaLecheDTO
): Promise<EntregaLeche> {
    return apiRequest<EntregaLeche>(endpoints.lecheEntregaById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteEntregaLeche(id: string): Promise<void> {
    return apiRequest<void>(endpoints.lecheEntregaById(id), {
        method: "DELETE",
    });
}

// Liquidaciones
export async function fetchLiquidacionesLeche(
    query: LiquidacionesLecheQuery = {}
): Promise<PaginatedResponse<LiquidacionLeche>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<LiquidacionLeche>>(
        `${endpoints.lecheLiquidaciones}${qs}`
    );
}

export async function fetchLiquidacionLeche(id: string): Promise<LiquidacionLeche> {
    return apiRequest<LiquidacionLeche>(endpoints.lecheLiquidacionById(id));
}

export async function createLiquidacionLeche(
    data: CreateLiquidacionLecheDTO
): Promise<LiquidacionLeche> {
    return apiRequest<LiquidacionLeche>(endpoints.lecheLiquidaciones, {
        method: "POST",
        body: data,
    });
}

export async function updateLiquidacionLeche(
    id: string,
    data: UpdateLiquidacionLecheDTO
): Promise<LiquidacionLeche> {
    return apiRequest<LiquidacionLeche>(endpoints.lecheLiquidacionById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteLiquidacionLeche(id: string): Promise<void> {
    return apiRequest<void>(endpoints.lecheLiquidacionById(id), {
        method: "DELETE",
    });
}

// Conciliación
export async function fetchConciliacionLeche(
    query: ConciliacionQuery
): Promise<ConciliacionLeche> {
    const qs = buildQueryString(query);
    return apiRequest<ConciliacionLeche>(`${endpoints.lecheConciliacion}${qs}`);
}
