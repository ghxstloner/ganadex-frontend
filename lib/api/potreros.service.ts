import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Potrero,
    CreatePotreroDTO,
    UpdatePotreroDTO,
} from "@/lib/types/business";

export type PotrerosQuery = {
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

export async function fetchPotreros(
    query: PotrerosQuery = {}
): Promise<PaginatedResponse<Potrero>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Potrero>>(`${endpoints.potreros}${qs}`);
}

export async function fetchPotrero(id: string): Promise<Potrero> {
    return apiRequest<Potrero>(endpoints.potreroById(id));
}

export async function createPotrero(data: CreatePotreroDTO): Promise<Potrero> {
    return apiRequest<Potrero>(endpoints.potreros, {
        method: "POST",
        body: data,
    });
}

export async function updatePotrero(
    id: string,
    data: UpdatePotreroDTO
): Promise<Potrero> {
    return apiRequest<Potrero>(endpoints.potreroById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deletePotrero(id: string): Promise<void> {
    return apiRequest<void>(endpoints.potreroById(id), {
        method: "DELETE",
    });
}
