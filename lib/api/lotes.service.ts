import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type { Lote, CreateLoteDTO, UpdateLoteDTO } from "@/lib/types/business";

export type BulkAnimalsResponse = {
    assigned_count?: number;
    removed_count?: number;
    failed?: { animal_id: string; reason: string }[];
};

export type LotesQuery = {
    q?: string;
    finca_id?: string;
    activo?: boolean;
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

export async function fetchLoteAnimales(loteId: string): Promise<any[]> {
    return apiRequest<any[]>(`${endpoints.loteById(loteId)}/animales`);
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

export async function bulkAssignAnimales(
    loteId: string,
    animalIds: string[]
): Promise<BulkAnimalsResponse> {
    return apiRequest<BulkAnimalsResponse>(endpoints.loteBulkAssign(loteId), {
        method: "POST",
        body: { animal_ids: animalIds },
    });
}

export async function bulkRemoveAnimales(
    loteId: string,
    animalIds: string[]
): Promise<BulkAnimalsResponse> {
    return apiRequest<BulkAnimalsResponse>(endpoints.loteBulkRemove(loteId), {
        method: "POST",
        body: { animal_ids: animalIds },
    });
}
