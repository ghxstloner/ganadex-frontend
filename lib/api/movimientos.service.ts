import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import { buildApiUrl } from "@/lib/api/client";
import { getToken, getStoredSession } from "@/lib/auth/storage";
import type {
    Movimiento,
    CreateMovimientoDTO,
    UpdateMovimientoDTO,
    UbicacionActual,
} from "@/lib/types/business";


export type MovimientosQuery = {
    q?: string;
    id_animal?: string;
    tipo?: string;
    motivo?: string;
    lote_id?: string;
    potrero_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
};

export type AnimalMovimientosQuery = {
    page?: number;
    limit?: number;
    desde?: string;
    hasta?: string;
    tipo?: string;
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

export async function fetchAnimalMovimientos(
    id_animal: string,
    query: AnimalMovimientosQuery = {}
): Promise<PaginatedResponse<Movimiento>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Movimiento>>(
        `${endpoints.animalMovimientos(id_animal)}${qs}`
    );
}

export type UbicacionActualResponse = {
    ubicacionActual: UbicacionActual | null;
};

export async function fetchAnimalUbicacionActual(
    id_animal: string
): Promise<UbicacionActualResponse> {
    return apiRequest<UbicacionActualResponse>(
        endpoints.animalUbicacionActual(id_animal)
    );
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

async function downloadBinary(path: string, filename: string) {
    const baseUrl = buildApiUrl(path);
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const session = getStoredSession();
    if (session?.empresa_activa_id) {
        headers["x-empresa-id"] = session.empresa_activa_id;
    }

    const response = await fetch(baseUrl, { headers });
    if (!response.ok) {
        throw new Error("No se pudo descargar el archivo");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function exportMovimientosExcel(query: MovimientosQuery = {}) {
    const qs = buildQueryString(query);
    await downloadBinary(`${endpoints.movimientosExport}${qs}`, "movimientos.xlsx");
}

export async function downloadMovimientosTemplate() {
    await downloadBinary(endpoints.movimientosTemplate, "movimientos_template.xlsx");
}

export type ImportMovimientosResult = {
    processed: number;
    created: number;
    errors: { row: number; message: string }[];
};

export async function importMovimientosExcel(file: File): Promise<ImportMovimientosResult> {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<ImportMovimientosResult>(endpoints.movimientosImport, {
        method: "POST",
        body: formData,
    });
}
