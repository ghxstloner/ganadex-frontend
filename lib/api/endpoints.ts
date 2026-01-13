export const endpoints = {
  // Auth
  me: "/me",

  // Admin - Users
  users: "/usuarios",
  inviteUser: "/usuarios/invite",
  userById: (id: string) => `/usuarios/${id}`,
  userRole: (id: string) => `/usuarios/${id}/rol`,
  userActivate: (id: string) => `/usuarios/${id}/activar`,
  userDeactivate: (id: string) => `/usuarios/${id}/desactivar`,

  // Admin - Roles
  roles: "/roles",
  roleById: (id: string) => `/roles/${id}`,
  rolePermissions: (id: string) => `/roles/${id}/permisos`,

  // Animales
  animales: "/animales",
  animalById: (id: string) => `/animales/${id}`,
  animalPerfil: (id: string) => `/animales/${id}/perfil`,
  animalIdentificaciones: (id: string) => `/animales/${id}/identificaciones`,
  animalFoto: (id: string) => `/animales/${id}/foto`,

  // Identificaciones
  identificacionById: (id: string) => `/identificaciones/${id}`,
  animalesBuscar: "/animales/buscar",
  animalesRazas: "/animales/razas",
  animalesColores: "/animales/colores-pelaje",

  // Movimientos
  movimientos: "/movimientos",
  movimientoById: (id: string) => `/movimientos/${id}`,

  // Potreros
  potreros: "/potreros",
  potreroById: (id: string) => `/potreros/${id}`,
  potrerosEstados: "/potreros/estados/list",
  potrerosMap: "/potreros/map",

  // Lotes
  lotes: "/lotes",
  loteById: (id: string) => `/lotes/${id}`,

  // Ocupaciones
  ocupaciones: "/ocupaciones",
  ocupacionById: (id: string) => `/ocupaciones/${id}`,

  // Reproducción
  reproduccionEventos: "/reproduccion/eventos",
  reproduccionEventoById: (id: string) => `/reproduccion/eventos/${id}`,
  reproduccionSemaforo: "/reproduccion/semaforo",

  // Salud
  saludEventos: "/salud/eventos",
  saludEventoById: (id: string) => `/salud/eventos/${id}`,
  saludRetiros: "/salud/retiros",
  saludRetiroById: (id: string) => `/salud/retiros/${id}`,
  saludAlertas: "/salud/alertas",
  saludAnimalRestricciones: (animalId: string) => `/salud/animal/${animalId}/restricciones`,

  // Leche
  lecheEntregas: "/leche/entregas",
  lecheEntregaById: (id: string) => `/leche/entregas/${id}`,
  lecheLiquidaciones: "/leche/liquidaciones",
  lecheLiquidacionById: (id: string) => `/leche/liquidaciones/${id}`,
  lecheConciliacion: "/leche/conciliacion",

  // Finanzas
  finanzasTransacciones: "/finanzas/transacciones",
  finanzasTransaccionById: (id: string) => `/finanzas/transacciones/${id}`,
  finanzasTransaccionAdjuntos: (id: string) => `/finanzas/transacciones/${id}/adjuntos`,
  finanzasAdjuntoById: (id: string) => `/finanzas/adjuntos/${id}`,
  finanzasCategorias: "/finanzas/categorias",
  finanzasCategoriaById: (id: string) => `/finanzas/categorias/${id}`,
  finanzasTipos: "/finanzas/tipos",
  finanzasTipoById: (id: string) => `/finanzas/tipos/${id}`,
  monedas: "/finanzas/monedas",

  // Auditorías
  auditorias: "/auditorias",
  auditoriaById: (id: string) => `/auditorias/${id}`,

  // Fincas (already existed in backend)
  fincas: "/fincas",
  fincaById: (id: string) => `/fincas/${id}`,
};
