import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Potrero,
    CreatePotreroDTO,
    UpdatePotreroDTO,
} from "@/lib/types/business";

export type PotrerosQuery = {
    q?: string;
    id_finca?: string;
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

function normalizePotreroBody(data: any) {
    const body: Record<string, any> = {};

    // id_finca es requerido por el backend
    if (data?.id_finca && data.id_finca !== "" && data.id_finca !== "__none__") {
        body.id_finca = String(data.id_finca);
    }

    if (data?.nombre && data.nombre !== "") {
        body.nombre = String(data.nombre);
    }

    if (data?.area_hectareas !== undefined && data?.area_hectareas !== null && data?.area_hectareas !== "") {
        body.area_hectareas = String(data.area_hectareas);
    }

    if (data?.area_m2 !== undefined && data?.area_m2 !== null && data?.area_m2 !== "") {
        body.area_m2 = String(data.area_m2);
    }

    if (data?.geometry && Array.isArray(data.geometry) && data.geometry.length > 0) {
        body.geometry = data.geometry;
    }

    if (data?.id_tipo_potrero && data.id_tipo_potrero !== "" && data.id_tipo_potrero !== "__none__") {
        body.id_tipo_potrero = String(data.id_tipo_potrero);
    }

    // Solo enviar estado como string, el backend lo resuelve a id_estado_potrero
    // NO enviar id_estado_potrero desde el frontend
    if (data?.estado && data.estado !== "" && data.estado !== "__none__") {
        body.estado = String(data.estado);
    }

    if (data?.capacidad_animales !== undefined && data?.capacidad_animales !== null && data?.capacidad_animales !== "") {
        body.capacidad_animales = String(data.capacidad_animales);
    }

    if (data?.notas && data.notas !== "") {
        body.notas = String(data.notas);
    }

    // NO enviar tipo_pasto - no está en el DTO del backend
    // NO enviar id_estado_potrero - el backend lo resuelve desde estado

    return body;
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
    const body = normalizePotreroBody(data);

    // Validar que id_finca esté presente (requerido por el backend)
    if (!body.id_finca) {
        throw new Error("id_finca es requerido para crear un potrero");
    }

    if (!body.nombre) {
        throw new Error("nombre es requerido para crear un potrero");
    }

    return apiRequest<Potrero>(endpoints.potreros, {
        method: "POST",
        body,
    });
}

export async function updatePotrero(
    id: string,
    data: UpdatePotreroDTO
): Promise<Potrero> {
    const body = normalizePotreroBody(data);

    return apiRequest<Potrero>(endpoints.potreroById(id), {
        method: "PATCH",
        body,
    });
}

export async function deletePotrero(id: string): Promise<void> {
    return apiRequest<void>(endpoints.potreroById(id), {
        method: "DELETE",
    });
}

export type EstadoPotrero = {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
};

export async function fetchEstadosPotreros(): Promise<EstadoPotrero[]> {
    return apiRequest<EstadoPotrero[]>(endpoints.potrerosEstados);
}
