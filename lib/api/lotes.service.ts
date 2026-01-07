import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type { Lote, CreateLoteDTO, UpdateLoteDTO } from "@/lib/types/business";

export type LotesQuery = {
    q?: string;
    finca_id?: string;
    estado?: string;
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

export async function fetchLotes(
    query: LotesQuery = {}
): Promise<PaginatedResponse<Lote>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Lote>>(`${endpoints.lotes}${qs}`);
}

export async function fetchLote(id: string): Promise<Lote> {
    return apiRequest<Lote>(endpoints.loteById(id));
}

export async function createLote(data: CreateLoteDTO): Promise<Lote> {
    return apiRequest<Lote>(endpoints.lotes, {
        method: "POST",
        body: data,
    });
}

export async function updateLote(id: string, data: UpdateLoteDTO): Promise<Lote> {
    return apiRequest<Lote>(endpoints.loteById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteLote(id: string): Promise<void> {
    return apiRequest<void>(endpoints.loteById(id), {
        method: "DELETE",
    });
}
