export const endpoints = {
  me: "/me",
  users: "/usuarios",
  inviteUser: "/usuarios/invite",
  userById: (id: string) => `/usuarios/${id}`,
  userRole: (id: string) => `/usuarios/${id}/rol`,
  userActivate: (id: string) => `/usuarios/${id}/activar`,
  userDeactivate: (id: string) => `/usuarios/${id}/desactivar`,
  roles: "/roles",
  roleById: (id: string) => `/roles/${id}`,
  rolePermissions: (id: string) => `/roles/${id}/permisos`,
};
