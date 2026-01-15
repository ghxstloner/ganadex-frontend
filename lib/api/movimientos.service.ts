import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Movimiento,
    CreateMovimientoDTO,
    UpdateMovimientoDTO,
} from "@/lib/types/business";

export type MovimientosQuery = {
    q?: string;
    animal_id?: string;
    tipo?: string;
    motivo?: string;
    lote_id?: string;
    potrero_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
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

export async function fetchMovimientos(
    query: MovimientosQuery = {}
): Promise<PaginatedResponse<Movimiento>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Movimiento>>(`${endpoints.movimientos}${qs}`);
}

export async function fetchMovimiento(id: string): Promise<Movimiento> {
    return apiRequest<Movimiento>(endpoints.movimientoById(id));
}

export async function createMovimiento(data: CreateMovimientoDTO): Promise<Movimiento> {
    return apiRequest<Movimiento>(endpoints.movimientos, {
        method: "POST",
        body: data,
    });
}

export async function updateMovimiento(
    id: string,
    data: UpdateMovimientoDTO
): Promise<Movimiento> {
    return apiRequest<Movimiento>(endpoints.movimientoById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteMovimiento(id: string): Promise<void> {
    return apiRequest<void>(endpoints.movimientoById(id), {
        method: "DELETE",
    });
}

export type MotivoMovimiento = {
    id: string;
    codigo: string;
    nombre: string;
};

export async function fetchMotivosMovimiento(): Promise<MotivoMovimiento[]> {
    return apiRequest<MotivoMovimiento[]>(endpoints.movimientosMotivos);
}
