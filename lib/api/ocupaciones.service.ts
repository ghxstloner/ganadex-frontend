import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Ocupacion,
    CreateOcupacionDTO,
    UpdateOcupacionDTO,
} from "@/lib/types/business";

export type OcupacionesQuery = {
    potrero_id?: string;
    lote_id?: string;
    animal_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    activa?: boolean;
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

export async function fetchOcupaciones(
    query: OcupacionesQuery = {}
): Promise<PaginatedResponse<Ocupacion>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Ocupacion>>(`${endpoints.ocupaciones}${qs}`);
}

export async function fetchOcupacion(id: string): Promise<Ocupacion> {
    return apiRequest<Ocupacion>(endpoints.ocupacionById(id));
}

export async function createOcupacion(data: CreateOcupacionDTO): Promise<Ocupacion> {
    return apiRequest<Ocupacion>(endpoints.ocupaciones, {
        method: "POST",
        body: data,
    });
}

export async function updateOcupacion(
    id: string,
    data: UpdateOcupacionDTO
): Promise<Ocupacion> {
    return apiRequest<Ocupacion>(endpoints.ocupacionById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteOcupacion(id: string): Promise<void> {
    return apiRequest<void>(endpoints.ocupacionById(id), {
        method: "DELETE",
    });
}
