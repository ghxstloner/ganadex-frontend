import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type { Finca } from "@/lib/types/business";

export type FincasQuery = {
    q?: string;
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

export async function fetchFincas(
    query: FincasQuery = {}
): Promise<PaginatedResponse<Finca>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Finca>>(`${endpoints.fincas}${qs}`);
}

export async function fetchFinca(id: string): Promise<Finca> {
    return apiRequest<Finca>(endpoints.fincaById(id));
}
