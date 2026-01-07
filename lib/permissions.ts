import type { PermissionDefinition } from "@/lib/types/admin";

export const permissionDefinitions: PermissionDefinition[] = [
  // Usuarios
  { id: "usuarios.view", label: "Ver usuarios", module: "Usuarios" },
  { id: "usuarios.create", label: "Crear usuarios", module: "Usuarios" },
  { id: "usuarios.edit", label: "Editar usuarios", module: "Usuarios" },
  { id: "usuarios.deactivate", label: "Activar o desactivar", module: "Usuarios" },
  { id: "usuarios.remove", label: "Remover de empresa", module: "Usuarios" },

  // Roles
  { id: "roles.view", label: "Ver roles", module: "Roles" },
  { id: "roles.create", label: "Crear roles", module: "Roles" },
  { id: "roles.edit", label: "Editar roles", module: "Roles" },
  { id: "roles.assign", label: "Asignar permisos", module: "Roles" },

  // Animales
  { id: "animales.view", label: "Ver animales", module: "Animales" },
  { id: "animales.create", label: "Crear animales", module: "Animales" },
  { id: "animales.edit", label: "Editar animales", module: "Animales" },
  { id: "animales.delete", label: "Eliminar animales", module: "Animales" },

  // Movimientos
  { id: "movimientos.view", label: "Ver movimientos", module: "Movimientos" },
  { id: "movimientos.create", label: "Crear movimientos", module: "Movimientos" },
  { id: "movimientos.edit", label: "Editar movimientos", module: "Movimientos" },
  { id: "movimientos.delete", label: "Eliminar movimientos", module: "Movimientos" },

  // Potreros
  { id: "potreros.view", label: "Ver potreros", module: "Potreros" },
  { id: "potreros.create", label: "Crear potreros", module: "Potreros" },
  { id: "potreros.edit", label: "Editar potreros", module: "Potreros" },
  { id: "potreros.delete", label: "Eliminar potreros", module: "Potreros" },

  // Salud
  { id: "salud.view", label: "Ver salud", module: "Salud" },
  { id: "salud.create", label: "Crear eventos salud", module: "Salud" },
  { id: "salud.edit", label: "Editar eventos salud", module: "Salud" },
  { id: "salud.delete", label: "Eliminar eventos salud", module: "Salud" },

  // Reproducción
  { id: "reproduccion.view", label: "Ver reproducción", module: "Reproduccion" },
  { id: "reproduccion.create", label: "Crear eventos", module: "Reproduccion" },
  { id: "reproduccion.edit", label: "Editar eventos", module: "Reproduccion" },
  { id: "reproduccion.delete", label: "Eliminar eventos", module: "Reproduccion" },

  // Leche
  { id: "leche.view", label: "Ver leche", module: "Leche" },
  { id: "leche.create", label: "Crear entregas", module: "Leche" },
  { id: "leche.edit", label: "Editar entregas", module: "Leche" },
  { id: "leche.delete", label: "Eliminar entregas", module: "Leche" },

  // Finanzas
  { id: "finanzas.view", label: "Ver finanzas", module: "Finanzas" },
  { id: "finanzas.create", label: "Crear transacciones", module: "Finanzas" },
  { id: "finanzas.edit", label: "Editar transacciones", module: "Finanzas" },
  { id: "finanzas.delete", label: "Eliminar transacciones", module: "Finanzas" },

  // Auditorías
  { id: "auditorias.view", label: "Ver auditorías", module: "Auditorias" },
  { id: "auditorias.create", label: "Crear auditorías", module: "Auditorias" },
];

export const permissionModules = Array.from(
  new Set(permissionDefinitions.map((permission) => permission.module))
);
