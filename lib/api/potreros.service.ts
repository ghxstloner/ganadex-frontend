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

export type PotreroMapItem = {
    id: string;
    nombre: string;
    geometry: Array<{ lat: number; lng: number }> | null;
};
  
  export type PotrerosMapResponse = {
    items: PotreroMapItem[];
    meta: { limit: number };
};
  
export type PotrerosMapQuery = {
    id_finca?: string;
    q?: string;
    limit?: number; // hasta 500 (backend)
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

type PotreroFormPayload = Partial<CreatePotreroDTO> & {
    geometry?: Array<{ lat: number; lng: number }> | null;
    estado?: string;
    capacidad_animales?: number | string | null;
    area_hectareas?: number | string | null;
    area_m2?: number | string | null;
    notas?: string | null;
    tipo_pasto?: string | null;
    id_finca?: string | null;
    id_tipo_potrero?: string | null;
};

function normalizePotreroBody(data: PotreroFormPayload) {
    const body: Record<string, unknown> = {};


    // id_finca es requerido por el backend
    if (data?.id_finca && data.id_finca !== "" && data.id_finca !== "__none__") {
        body.id_finca = String(data.id_finca);
    }

    if (data?.nombre && data.nombre !== "") {
        body.nombre = String(data.nombre);
    }

    if (data?.area_hectareas !== undefined && data?.area_hectareas !== null) {
        body.area_hectareas = String(data.area_hectareas);
    }

    if (data?.area_m2 !== undefined && data?.area_m2 !== null) {
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

    if (data?.capacidad_animales !== undefined && data?.capacidad_animales !== null) {
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

export async function fetchPotrerosMap(
    query: PotrerosMapQuery = {}
  ): Promise<PotrerosMapResponse> {
    const qs = buildQueryString(query);
    return apiRequest<PotrerosMapResponse>(`${endpoints.potrerosMap}${qs}`);
}
  