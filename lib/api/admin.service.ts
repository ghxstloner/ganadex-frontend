"use client";

import { apiClient, type ApiRequestOptions } from "@/lib/api/request";
import { endpoints } from "@/lib/api/endpoints";
import type {
  RoleDTO,
  RolePermissionsResponse,
  RolesListResponse,
  UserAdminDTO,
  UsersListResponse,
} from "@/lib/types/admin";

export async function fetchUsers(
  options?: ApiRequestOptions
): Promise<UserAdminDTO[]> {
  const response = await apiClient<UsersListResponse>(
    endpoints.users,
    options
  );
  return response.usuarios ?? [];
}

export async function createUser(payload: {
  nombre: string;
  email: string;
  rol_id?: string | null;
}): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.users, {
    method: "POST",
    body: payload,
  });
}

export async function inviteUser(payload: {
  email: string;
  rol_id?: string | null;
}): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.inviteUser, {
    method: "POST",
    body: payload,
  });
}

export async function updateUser(
  id: string,
  payload: { nombre?: string; email?: string }
): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.userById(id), {
    method: "PATCH",
    body: payload,
  });
}

export async function changeUserRole(
  id: string,
  rolId: string
): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.userRole(id), {
    method: "POST",
    body: { rol_id: rolId },
  });
}

export async function activateUser(id: string): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.userActivate(id), {
    method: "POST",
  });
}

export async function deactivateUser(id: string): Promise<UserAdminDTO> {
  return apiClient<UserAdminDTO>(endpoints.userDeactivate(id), {
    method: "POST",
  });
}

export async function removeUser(id: string): Promise<void> {
  await apiClient<void>(endpoints.userById(id), {
    method: "DELETE",
  });
}

export async function fetchRoles(
  options?: ApiRequestOptions
): Promise<RoleDTO[]> {
  const response = await apiClient<RolesListResponse>(
    endpoints.roles,
    options
  );
  return response.roles ?? [];
}

export async function createRole(payload: {
  nombre: string;
  descripcion?: string | null;
}): Promise<RoleDTO> {
  return apiClient<RoleDTO>(endpoints.roles, {
    method: "POST",
    body: payload,
  });
}

export async function updateRole(
  id: string,
  payload: { nombre?: string; descripcion?: string | null }
): Promise<RoleDTO> {
  return apiClient<RoleDTO>(endpoints.roleById(id), {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchRolePermissions(
  id: string
): Promise<RolePermissionsResponse> {
  return apiClient<RolePermissionsResponse>(endpoints.rolePermissions(id));
}

export async function updateRolePermissions(
  id: string,
  permisos: string[]
): Promise<RoleDTO> {
  return apiClient<RoleDTO>(endpoints.rolePermissions(id), {
    method: "PUT",
    body: { permisos },
  });
}
