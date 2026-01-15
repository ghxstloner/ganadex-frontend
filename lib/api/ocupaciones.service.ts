import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Ocupacion,
    CreateOcupacionDTO,
    CloseOcupacionDTO,
    OcupacionResumen,
} from "@/lib/types/business";

export type OcupacionesQuery = {
    id_finca?: string;
    id_potrero?: string;
    id_lote?: string;
    activo?: boolean;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
};

export type OcupacionResumenQuery = {
    id_finca?: string;
    search?: string;
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

export async function cerrarOcupacion(
    id: string,
    data: CloseOcupacionDTO
): Promise<Ocupacion> {
    return apiRequest<Ocupacion>(`${endpoints.ocupaciones}/${id}/cerrar`, {
        method: "PATCH",
        body: data,
    });
}

export async function fetchResumenActual(
    query: OcupacionResumenQuery = {}
): Promise<OcupacionResumen> {
    const qs = buildQueryString(query);
    return apiRequest<OcupacionResumen>(`${endpoints.ocupaciones}/resumen-actual${qs}`);
}
