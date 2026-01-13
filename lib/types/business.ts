// ====================
// Common Types
// ====================

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type ListResponse<T> = {
    items: T[];
    meta?: PaginationMeta;
};

// ====================
// Animales
// ====================

export type Animal = {
    id: string;
    codigo?: string | null;
    nombre?: string | null;
    sexo: "M" | "F" | "macho" | "hembra";
    categoria?: string | null;
    estado?: string | null;
    fecha_nacimiento?: string | null;
    fecha_nacimiento_estimada?: boolean;
    peso_actual?: number | null;
    id_raza?: string | null;
    raza_nombre?: string | null;
    id_color_pelaje?: string | null;
    color_pelaje_nombre?: string | null;
    finca_id?: string | null;
    id_finca?: string | null;
    finca_nombre?: string | null;
    lote_id?: string | null;
    lote_nombre?: string | null;
    potrero_id?: string | null;
    potrero_nombre?: string | null;
    madre_id?: string | null;
    madre_nombre?: string | null;
    padre_id?: string | null;
    padre_nombre?: string | null;
    foto_url?: string | null;
    identificador_principal?: string | null;
    notas?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type AnimalPerfil = Animal & {
    estado_actual?: {
        id: string;
        codigo: string;
        nombre: string;
        desde: string;
        hasta?: string | null;
    } | null;
    categoria_actual?: {
        id: string;
        codigo: string;
        nombre: string;
        desde: string;
        hasta?: string | null;
    } | null;
    identificaciones: Identificacion[];
    historial_estados?: HistorialEstado[];
    historial_categorias?: HistorialCategoria[];
    eventos_sanitarios_recientes?: Array<{
        id: string;
        fecha: string;
        enfermedad?: string | null;
        descripcion?: string | null;
    }>;
    eventos_reproductivos_recientes?: Array<{
        id: string;
        fecha: string;
        tipo: string;
        detalles?: string | null;
    }>;
    movimientos_recientes?: Array<{
        id: string;
        fecha_hora: string;
        motivo?: string | null;
        potrero_destino?: string | null;
        lote_destino?: string | null;
    }>;
    ultimos_movimientos?: Movimiento[];
    ultimos_eventos_salud?: EventoSanitario[];
    ultimos_eventos_reproduccion?: EventoReproductivo[];
    retiro_activo?: RetiroSanitario | null;
    edad_meses?: number | null;
};

export type HistorialEstado = {
    id: string;
    estado_id: string;
    estado_codigo: string;
    estado_nombre: string;
    fecha_inicio: string;
    fecha_fin?: string | null;
    motivo?: string | null;
};

export type HistorialCategoria = {
    id: string;
    categoria_id: string;
    categoria_codigo: string;
    categoria_nombre: string;
    fecha_inicio: string;
    fecha_fin?: string | null;
    observaciones?: string | null;
};

export type Identificacion = {
    id: string;
    animal_id?: string;
    tipo: string;
    tipo_id?: string;
    valor: string;
    activo: boolean;
    fecha_asignacion: string;
    observaciones?: string | null;
    es_principal?: boolean;
    fecha_registro?: string | null;
    notas?: string | null;
};

export type CreateAnimalDTO = {
    nombre?: string;
    sexo: "M" | "F";
    fecha_nacimiento?: string;
    fecha_nacimiento_estimada?: boolean;
    id_raza?: string;
    id_color_pelaje?: string;
    id_finca: string;
    padre_id?: string;
    madre_id?: string;
    notas?: string;
};

export type UpdateAnimalDTO = Partial<CreateAnimalDTO>;

// ====================
// Movimientos
// ====================

export type Movimiento = {
    id: string;
    animal_id: string;
    animal_nombre?: string | null;
    animal_codigo?: string | null;
    tipo: string;
    motivo?: string | null;
    fecha: string;
    origen_lote_id?: string | null;
    origen_lote_nombre?: string | null;
    origen_potrero_id?: string | null;
    origen_potrero_nombre?: string | null;
    destino_lote_id?: string | null;
    destino_lote_nombre?: string | null;
    destino_potrero_id?: string | null;
    destino_potrero_nombre?: string | null;
    peso?: number | null;
    valor?: number | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateMovimientoDTO = {
    animal_id: string;
    tipo: string;
    motivo?: string;
    fecha: string;
    origen_lote_id?: string;
    origen_potrero_id?: string;
    destino_lote_id?: string;
    destino_potrero_id?: string;
    peso?: number;
    valor?: number;
    notas?: string;
};

export type UpdateMovimientoDTO = Partial<CreateMovimientoDTO>;

// ====================
// Potreros
// ====================

export type Potrero = {
    id: string;
    nombre: string;
    id_finca?: string | null;
    finca_nombre?: string | null;
    area_hectareas?: number | null;
    area_m2?: number | null;
    geometry?: Array<{ lat: number; lng: number }> | null;
    capacidad_animales?: number | null;
    tipo_pasto?: string | null;
    estado: "disponible" | "ocupado" | "mantenimiento" | "inactivo";
    notas?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type CreatePotreroDTO = {
    nombre: string;
    id_finca?: string;
    area_hectareas?: number;
    area_m2?: number;
    geometry?: Array<{ lat: number; lng: number }>;
    capacidad_animales?: number;
    tipo_pasto?: string;
    estado?: string;
    notas?: string;
};

export type UpdatePotreroDTO = Partial<CreatePotreroDTO>;

// ====================
// Lotes
// ====================

export type Lote = {
    id: string;
    nombre: string;
    finca_id?: string | null;
    finca_nombre?: string | null;
    descripcion?: string | null;
    proposito?: string | null;
    cantidad_animales?: number | null;
    estado: "activo" | "inactivo";
    created_at?: string;
    updated_at?: string;
};

export type CreateLoteDTO = {
    nombre: string;
    finca_id?: string;
    descripcion?: string;
    proposito?: string;
    estado?: string;
};

export type UpdateLoteDTO = Partial<CreateLoteDTO>;

// ====================
// Ocupaciones
// ====================

export type Ocupacion = {
    id: string;
    potrero_id: string;
    potrero_nombre?: string | null;
    lote_id?: string | null;
    lote_nombre?: string | null;
    animal_id?: string | null;
    animal_nombre?: string | null;
    fecha_inicio: string;
    fecha_fin?: string | null;
    cantidad_animales?: number | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateOcupacionDTO = {
    potrero_id: string;
    lote_id?: string;
    animal_id?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    cantidad_animales?: number;
    notas?: string;
};

export type UpdateOcupacionDTO = Partial<CreateOcupacionDTO>;

// ====================
// Reproducción
// ====================

export type EventoReproductivo = {
    id: string;
    animal_id: string;
    animal_nombre?: string | null;
    animal_codigo?: string | null;
    tipo: string;
    fecha: string;
    resultado?: string | null;
    toro_id?: string | null;
    toro_nombre?: string | null;
    inseminador?: string | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateEventoReproductivoDTO = {
    animal_id: string;
    tipo: string;
    fecha: string;
    resultado?: string;
    toro_id?: string;
    inseminador?: string;
    notas?: string;
};

export type UpdateEventoReproductivoDTO = Partial<CreateEventoReproductivoDTO>;

export type SemaforoRow = {
    animal_id: string;
    animal_nombre?: string | null;
    animal_codigo?: string | null;
    estado: "verde" | "amarillo" | "rojo";
    dias_abiertos?: number | null;
    ultimo_evento?: string | null;
    fecha_ultimo_evento?: string | null;
    proxima_accion?: string | null;
    fecha_proxima?: string | null;
};

// ====================
// Salud
// ====================

export type EventoSanitario = {
    id: string;
    animal_id: string;
    animal_nombre?: string | null;
    animal_codigo?: string | null;
    tipo: string;
    fecha: string;
    diagnostico?: string | null;
    tratamiento?: string | null;
    medicamentos?: string | null;
    dosis?: string | null;
    veterinario?: string | null;
    costo?: number | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateEventoSanitarioDTO = {
    animal_id: string;
    tipo: string;
    fecha: string;
    diagnostico?: string;
    tratamiento?: string;
    medicamentos?: string;
    dosis?: string;
    veterinario?: string;
    costo?: number;
    notas?: string;
};

export type UpdateEventoSanitarioDTO = Partial<CreateEventoSanitarioDTO>;

export type RetiroSanitario = {
    id: string;
    animal_id: string;
    animal_nombre?: string | null;
    animal_codigo?: string | null;
    motivo: string;
    tipo: "carne" | "leche" | "ambos";
    fecha_inicio: string;
    fecha_fin: string;
    dias_retiro: number;
    medicamento?: string | null;
    activo: boolean;
    notas?: string | null;
    created_at?: string;
};

export type CreateRetiroSanitarioDTO = {
    animal_id: string;
    motivo: string;
    tipo: "carne" | "leche" | "ambos";
    fecha_inicio: string;
    fecha_fin: string;
    dias_retiro: number;
    medicamento?: string;
    notas?: string;
};

export type UpdateRetiroSanitarioDTO = Partial<CreateRetiroSanitarioDTO>;

export type AlertaSalud = {
    id: string;
    tipo: "retiro_activo" | "vacuna_pendiente" | "tratamiento_pendiente" | "revision";
    titulo: string;
    descripcion: string;
    animal_id?: string | null;
    animal_nombre?: string | null;
    fecha_alerta?: string | null;
    prioridad: "alta" | "media" | "baja";
};

export type RestriccionesAnimal = {
    animal_id: string;
    tiene_retiro_activo: boolean;
    retiro_activo?: RetiroSanitario | null;
    restricciones: string[];
};

// ====================
// Leche
// ====================

export type EntregaLeche = {
    id: string;
    fecha: string;
    cantidad_litros: number;
    calidad?: string | null;
    temperatura?: number | null;
    acidez?: number | null;
    grasa?: number | null;
    proteina?: number | null;
    precio_litro?: number | null;
    total?: number | null;
    proveedor_id?: string | null;
    proveedor_nombre?: string | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateEntregaLecheDTO = {
    fecha: string;
    cantidad_litros: number;
    calidad?: string;
    temperatura?: number;
    acidez?: number;
    grasa?: number;
    proteina?: number;
    precio_litro?: number;
    proveedor_id?: string;
    notas?: string;
};

export type UpdateEntregaLecheDTO = Partial<CreateEntregaLecheDTO>;

export type LiquidacionLeche = {
    id: string;
    periodo_inicio: string;
    periodo_fin: string;
    total_litros: number;
    precio_promedio: number;
    bonificaciones?: number | null;
    deducciones?: number | null;
    total_pagar: number;
    estado: "pendiente" | "pagada" | "anulada";
    fecha_pago?: string | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateLiquidacionLecheDTO = {
    periodo_inicio: string;
    periodo_fin: string;
    total_litros: number;
    precio_promedio: number;
    bonificaciones?: number;
    deducciones?: number;
    total_pagar: number;
    estado?: string;
    fecha_pago?: string;
    notas?: string;
};

export type UpdateLiquidacionLecheDTO = Partial<CreateLiquidacionLecheDTO>;

export type ConciliacionLeche = {
    periodo_inicio: string;
    periodo_fin: string;
    total_entregas: number;
    total_litros_entregados: number;
    total_liquidaciones: number;
    total_litros_liquidados: number;
    diferencia_litros: number;
    total_facturado: number;
    total_pagado: number;
    diferencia_valor: number;
};

// ====================
// Finanzas
// ====================

export type TransaccionFinanciera = {
    id: string;
    tipo: "ingreso" | "gasto";
    categoria_id?: string | null;
    categoria_nombre?: string | null;
    subcategoria?: string | null;
    descripcion: string;
    monto: number;
    moneda_id?: string | null;
    moneda_codigo?: string | null;
    fecha: string;
    referencia?: string | null;
    cuenta?: string | null;
    comprobante?: string | null;
    notas?: string | null;
    tiene_adjuntos?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type CreateTransaccionDTO = {
    tipo: "ingreso" | "gasto";
    categoria_id?: string;
    subcategoria?: string;
    descripcion: string;
    monto: number;
    moneda_id?: string;
    fecha: string;
    referencia?: string;
    cuenta?: string;
    comprobante?: string;
    notas?: string;
};

export type UpdateTransaccionDTO = Partial<CreateTransaccionDTO>;

export type CategoriaFinanciera = {
    id: string;
    nombre: string;
    tipo: "ingreso" | "gasto";
    descripcion?: string | null;
    es_global: boolean;
    color?: string | null;
    icono?: string | null;
};

export type CreateCategoriaDTO = {
    nombre: string;
    tipo: "ingreso" | "gasto";
    descripcion?: string;
    color?: string;
    icono?: string;
};

export type UpdateCategoriaDTO = Partial<CreateCategoriaDTO>;

export type TipoTransaccion = {
    id: string;
    nombre: string;
    descripcion?: string | null;
};

export type Moneda = {
    id: string;
    iso_alpha3: string;
    nombre: string;
    simbolo: string | null;
    decimales: number;
    activo: boolean;
};

export type Adjunto = {
    id: string;
    transaccion_id: string;
    nombre: string;
    tipo_archivo: string;
    tamano_bytes: number;
    url: string;
    created_at?: string;
};

// ====================
// Auditorías
// ====================

export type Auditoria = {
    id: string;
    tipo: string;
    titulo: string;
    descripcion?: string | null;
    fecha: string;
    auditor?: string | null;
    estado: "pendiente" | "en_progreso" | "completada" | "cancelada";
    resultado?: string | null;
    notas?: string | null;
    created_at?: string;
};

export type CreateAuditoriaDTO = {
    tipo: string;
    titulo: string;
    descripcion?: string;
    fecha: string;
    auditor?: string;
    estado?: string;
    notas?: string;
};

export type UpdateAuditoriaDTO = Partial<CreateAuditoriaDTO>;

export type AuditoriaDetalle = Auditoria & {
    items: AuditoriaItem[];
};

export type AuditoriaItem = {
    id: string;
    auditoria_id: string;
    descripcion: string;
    resultado: "conforme" | "no_conforme" | "observacion" | "pendiente";
    evidencia?: string | null;
    accion_correctiva?: string | null;
    notas?: string | null;
};

// ====================
// Fincas (for dropdowns)
// ====================

export type Finca = {
    id: string;
    nombre: string;
    ubicacion?: string | null;
    area_hectareas?: number | null;
};

export type Raza = {
    id: string;
    codigo: string;
    nombre: string;
    es_global?: boolean;
};

export type ColorPelaje = {
    id: string;
    codigo: string;
    nombre: string;
};

export type TipoIdentificacion = {
    id: string;
    codigo: string;
    nombre: string;
    es_global?: boolean;
};

export type AnimalBusqueda = {
    id: string;
    nombre: string;
    sexo: "M" | "F";
    identificacion?: string | null;
};
