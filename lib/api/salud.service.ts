import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    EventoSanitario,
    CreateEventoSanitarioDTO,
    UpdateEventoSanitarioDTO,
    RetiroSanitario,
    CreateRetiroSanitarioDTO,
    UpdateRetiroSanitarioDTO,
    AlertaSalud,
    RestriccionesAnimal,
} from "@/lib/types/business";

export type EventosSanitariosQuery = {
    q?: string;
    id_animal?: string;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
};

export type RetirosSanitariosQuery = {
    id_animal?: string;
    tipo?: string;
    activo?: boolean;
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

// Eventos Sanitarios
export async function fetchEventosSanitarios(
    query: EventosSanitariosQuery = {}
): Promise<PaginatedResponse<EventoSanitario>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<EventoSanitario>>(
        `${endpoints.saludEventos}${qs}`
    );
}

export async function fetchEventoSanitario(id: string): Promise<EventoSanitario> {
    return apiRequest<EventoSanitario>(endpoints.saludEventoById(id));
}

export async function createEventoSanitario(
    data: CreateEventoSanitarioDTO
): Promise<EventoSanitario> {
    return apiRequest<EventoSanitario>(endpoints.saludEventos, {
        method: "POST",
        body: data,
    });
}

export async function updateEventoSanitario(
    id: string,
    data: UpdateEventoSanitarioDTO
): Promise<EventoSanitario> {
    return apiRequest<EventoSanitario>(endpoints.saludEventoById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteEventoSanitario(id: string): Promise<void> {
    return apiRequest<void>(endpoints.saludEventoById(id), {
        method: "DELETE",
    });
}

// Retiros Sanitarios
export async function fetchRetirosSanitarios(
    query: RetirosSanitariosQuery = {}
): Promise<PaginatedResponse<RetiroSanitario>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<RetiroSanitario>>(
        `${endpoints.saludRetiros}${qs}`
    );
}

export async function fetchRetiroSanitario(id: string): Promise<RetiroSanitario> {
    return apiRequest<RetiroSanitario>(endpoints.saludRetiroById(id));
}

export async function createRetiroSanitario(
    data: CreateRetiroSanitarioDTO
): Promise<RetiroSanitario> {
    return apiRequest<RetiroSanitario>(endpoints.saludRetiros, {
        method: "POST",
        body: data,
    });
}

export async function updateRetiroSanitario(
    id: string,
    data: UpdateRetiroSanitarioDTO
): Promise<RetiroSanitario> {
    return apiRequest<RetiroSanitario>(endpoints.saludRetiroById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteRetiroSanitario(id: string): Promise<void> {
    return apiRequest<void>(endpoints.saludRetiroById(id), {
        method: "DELETE",
    });
}

// Alertas
export async function fetchAlertasSalud(): Promise<AlertaSalud[]> {
    return apiRequest<AlertaSalud[]>(endpoints.saludAlertas);
}

// Restricciones Animal
export async function fetchRestriccionesAnimal(
    animalId: string
): Promise<RestriccionesAnimal> {
    return apiRequest<RestriccionesAnimal>(
        endpoints.saludAnimalRestricciones(animalId)
    );
}
