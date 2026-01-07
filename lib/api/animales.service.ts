import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Animal,
    AnimalPerfil,
    Identificacion,
    CreateAnimalDTO,
    UpdateAnimalDTO,
} from "@/lib/types/business";

export type AnimalesQuery = {
    q?: string;
    finca_id?: string;
    lote_id?: string;
    sexo?: string;
    categoria?: string;
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

export async function fetchAnimales(
    query: AnimalesQuery = {}
): Promise<PaginatedResponse<Animal>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Animal>>(`${endpoints.animales}${qs}`);
}

export async function fetchAnimal(id: string): Promise<Animal> {
    return apiRequest<Animal>(endpoints.animalById(id));
}

export async function fetchAnimalPerfil(id: string): Promise<AnimalPerfil> {
    return apiRequest<AnimalPerfil>(endpoints.animalPerfil(id));
}

export async function createAnimal(data: CreateAnimalDTO): Promise<Animal> {
    return apiRequest<Animal>(endpoints.animales, {
        method: "POST",
        body: data,
    });
}

export async function updateAnimal(
    id: string,
    data: UpdateAnimalDTO
): Promise<Animal> {
    return apiRequest<Animal>(endpoints.animalById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteAnimal(id: string): Promise<void> {
    return apiRequest<void>(endpoints.animalById(id), {
        method: "DELETE",
    });
}

// Identificaciones
export async function fetchAnimalIdentificaciones(
    animalId: string
): Promise<Identificacion[]> {
    return apiRequest<Identificacion[]>(endpoints.animalIdentificaciones(animalId));
}

export async function createIdentificacion(
    animalId: string,
    data: Omit<Identificacion, "id" | "animal_id">
): Promise<Identificacion> {
    return apiRequest<Identificacion>(endpoints.animalIdentificaciones(animalId), {
        method: "POST",
        body: data,
    });
}

export async function updateIdentificacion(
    id: string,
    data: Partial<Omit<Identificacion, "id" | "animal_id">>
): Promise<Identificacion> {
    return apiRequest<Identificacion>(endpoints.identificacionById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteIdentificacion(id: string): Promise<void> {
    return apiRequest<void>(endpoints.identificacionById(id), {
        method: "DELETE",
    });
}
