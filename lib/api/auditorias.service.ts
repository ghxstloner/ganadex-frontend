import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
    Auditoria,
    AuditoriaDetalle,
    CreateAuditoriaDTO,
    UpdateAuditoriaDTO,
} from "@/lib/types/business";

export type AuditoriasQuery = {
    q?: string;
    tipo?: string;
    estado?: string;
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

export async function fetchAuditorias(
    query: AuditoriasQuery = {}
): Promise<PaginatedResponse<Auditoria>> {
    const qs = buildQueryString(query);
    return apiRequest<PaginatedResponse<Auditoria>>(`${endpoints.auditorias}${qs}`);
}

export async function fetchAuditoria(id: string): Promise<AuditoriaDetalle> {
    return apiRequest<AuditoriaDetalle>(endpoints.auditoriaById(id));
}

export async function createAuditoria(data: CreateAuditoriaDTO): Promise<Auditoria> {
    return apiRequest<Auditoria>(endpoints.auditorias, {
        method: "POST",
        body: data,
    });
}

export async function updateAuditoria(
    id: string,
    data: UpdateAuditoriaDTO
): Promise<Auditoria> {
    return apiRequest<Auditoria>(endpoints.auditoriaById(id), {
        method: "PATCH",
        body: data,
    });
}

export async function deleteAuditoria(id: string): Promise<void> {
    return apiRequest<void>(endpoints.auditoriaById(id), {
        method: "DELETE",
    });
}
