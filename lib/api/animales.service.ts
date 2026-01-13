import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Animal,
    AnimalPerfil,
    Identificacion,
    CreateAnimalDTO,
    UpdateAnimalDTO,
    Raza,
    ColorPelaje,
    AnimalBusqueda,
} from "@/lib/types/business";

export type AnimalesQuery = {
    q?: string;
    id_finca?: string;
    finca_id?: string;
    lote_id?: string;
    sexo?: string;
    id_raza?: string;
    id_color_pelaje?: string;
    categoria?: string;
    estado?: string;
    fecha_nacimiento_desde?: string;
    fecha_nacimiento_hasta?: string;
    con_padre?: boolean;
    con_madre?: boolean;
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

// Catálogos
export async function fetchRazas(): Promise<Raza[]> {
    return apiRequest<Raza[]>(`${endpoints.animales}/razas`);
}

export async function fetchColoresPelaje(): Promise<ColorPelaje[]> {
    return apiRequest<ColorPelaje[]>(`${endpoints.animales}/colores-pelaje`);
}

export async function buscarAnimales(
    query: string,
    sexo?: "M" | "F"
): Promise<AnimalBusqueda[]> {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (sexo) params.append("sexo", sexo);
    const qs = params.toString();
    return apiRequest<AnimalBusqueda[]>(
        `${endpoints.animales}/buscar${qs ? `?${qs}` : ""}`
    );
}

export type CreateRazaDTO = {
    codigo: string;
    nombre: string;
};

export type CreateColorDTO = {
    codigo: string;
    nombre: string;
};

export async function createRaza(data: CreateRazaDTO): Promise<Raza> {
    return apiRequest<Raza>(`${endpoints.animales}/razas`, {
        method: "POST",
        body: data,
    });
}

export async function createColor(data: CreateColorDTO): Promise<ColorPelaje> {
    return apiRequest<ColorPelaje>(`${endpoints.animales}/colores-pelaje`, {
        method: "POST",
        body: data,
    });
}

export async function uploadAnimalPhoto(
    animalId: string,
    file: File
): Promise<{ foto_url: string }> {
    const formData = new FormData();
    formData.append("foto", file);

    return apiRequest<{ foto_url: string }>(endpoints.animalFoto(animalId), {
        method: "POST",
        body: formData,
        headers: {}, // No set Content-Type, browser will set it with boundary
    });
}
