import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    EventoReproductivo,
    CreateEventoReproductivoDTO,
    UpdateEventoReproductivoDTO,
    SemaforoRow,
} from "@/lib/types/business";

export type ReproduccionEventosQuery = {
    q?: string;
    animal_id?: string;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
};

export type SemaforoQuery = {
    finca_id?: string;
    lote_id?: string;
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

// Eventos
export async function fetchEventosReproductivos(
    query: ReproduccionEventosQuery = {}
): Promise<PaginatedResponse<EventoReproductivo>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<EventoReproductivo>>(
        `${endpoints.reproduccionEventos}${qs}`
    );
}

export async function fetchEventoReproductivo(id: string): Promise<EventoReproductivo> {
    return apiRequest<EventoReproductivo>(endpoints.reproduccionEventoById(id));
}

export async function createEventoReproductivo(
    data: CreateEventoReproductivoDTO
): Promise<EventoReproductivo> {
    return apiRequest<EventoReproductivo>(endpoints.reproduccionEventos, {
        method: "POST",
        body: data,
    });
}

export async function updateEventoReproductivo(
    id: string,
    data: UpdateEventoReproductivoDTO
): Promise<EventoReproductivo> {
    return apiRequest<EventoReproductivo>(endpoints.reproduccionEventoById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteEventoReproductivo(id: string): Promise<void> {
    return apiRequest<void>(endpoints.reproduccionEventoById(id), {
        method: "DELETE",
    });
}

// Semáforo
export async function fetchSemaforo(
    query: SemaforoQuery = {}
): Promise<PaginatedResponse<SemaforoRow>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<SemaforoRow>>(
        `${endpoints.reproduccionSemaforo}${qs}`
    );
}
