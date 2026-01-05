"use client";

import { apiClient } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type { EmpresaDTO, UserDTO } from "@/lib/types/auth";

export type MeResponse = {
  user?: UserDTO;
  empresas?: EmpresaDTO[];
  empresa_activa_id?: string | null;
  permisos?: string[];
};

export async function fetchMe(): Promise<MeResponse> {
  return apiClient<MeResponse>(endpoints.me, { toastOnError: false });
}
