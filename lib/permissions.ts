import type { PermissionDefinition } from "@/lib/types/admin";

export const permissionDefinitions: PermissionDefinition[] = [
  { id: "usuarios.view", label: "Ver usuarios", module: "Usuarios" },
  { id: "usuarios.create", label: "Crear usuarios", module: "Usuarios" },
  { id: "usuarios.edit", label: "Editar usuarios", module: "Usuarios" },
  { id: "usuarios.deactivate", label: "Activar o desactivar", module: "Usuarios" },
  { id: "usuarios.remove", label: "Remover de empresa", module: "Usuarios" },
  { id: "roles.view", label: "Ver roles", module: "Roles" },
  { id: "roles.create", label: "Crear roles", module: "Roles" },
  { id: "roles.edit", label: "Editar roles", module: "Roles" },
  { id: "roles.assign", label: "Asignar permisos", module: "Roles" },
  { id: "animales.view", label: "Ver animales", module: "Animales" },
  { id: "animales.edit", label: "Editar animales", module: "Animales" },
  { id: "finanzas.view", label: "Ver finanzas", module: "Finanzas" },
  { id: "finanzas.edit", label: "Editar finanzas", module: "Finanzas" },
  { id: "salud.view", label: "Ver salud", module: "Salud" },
  { id: "leche.view", label: "Ver leche", module: "Leche" },
  { id: "reproduccion.view", label: "Ver reproduccion", module: "Reproduccion" },
  { id: "movimientos.view", label: "Ver movimientos", module: "Movimientos" },
  { id: "potreros.view", label: "Ver potreros", module: "Potreros" },
];

export const permissionModules = Array.from(
  new Set(permissionDefinitions.map((permission) => permission.module))
);
