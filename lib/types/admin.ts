export type PermissionModule =
  | "Usuarios"
  | "Roles"
  | "Animales"
  | "Finanzas"
  | "Salud"
  | "Leche"
  | "Reproduccion"
  | "Movimientos"
  | "Potreros"
  | "Auditorias";

export type PermissionDefinition = {
  id: string;
  label: string;
  module: PermissionModule;
};

export type RoleDTO = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  permisos?: string[];
};

export type UserStatus = "activo" | "inactivo";

export type UserAdminDTO = {
  id: string;
  nombre: string;
  email: string;
  estado: UserStatus;
  rol_id?: string | null;
  rol_nombre?: string | null;
};

export type UsersListResponse = {
  usuarios: UserAdminDTO[];
};

export type RolesListResponse = {
  roles: RoleDTO[];
};

export type RolePermissionsResponse = {
  permisos: string[];
};
