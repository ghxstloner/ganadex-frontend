"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileDown,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Badge } from "@/components/ui/badge";


import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";

import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NoPermission from "@/components/no-permission";

import {
  fetchMovimientos,
  createMovimiento,
  deleteMovimiento,
  fetchMotivosMovimiento,
  fetchAnimalUbicacionActual,
  exportMovimientosExcel,
  downloadMovimientosTemplate,
  importMovimientosExcel,
  type ImportMovimientosResult,
  type MovimientosQuery,
  type MotivoMovimiento,
} from "@/lib/api/movimientos.service";

import { fetchAnimales } from "@/lib/api/animales.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import { fetchLotes } from "@/lib/api/lotes.service";
import { fetchPotreros } from "@/lib/api/potreros.service";
import type {
  Movimiento,
  CreateMovimientoDTO,
  Animal,
  Finca,
  Lote,
  Potrero,
  UbicacionActual,
} from "@/lib/types/business";

import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const movimientoSchema = z.object({
  id_finca: z.string().min(1, "Selecciona una finca"),
  id_animal: z.string().min(1, "Selecciona un animal"),
  fecha_hora: z.string().min(1, "Ingresa la fecha y hora"),
  lote_origen_id: z.string().nullable().optional(),
  lote_destino_id: z.string().nullable().optional(),
  potrero_origen_id: z.string().nullable().optional(),
  potrero_destino_id: z.string().nullable().optional(),
  id_motivo_movimiento: z.string().nullable().optional(),
  observaciones: z.string().optional(),
});

type MovimientoForm = z.infer<typeof movimientoSchema>;


function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MovimientosPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "movimientos.view");
  const canCreate = hasPermission(session, "movimientos.create");
  const canDelete = hasPermission(session, "movimientos.delete");

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [potreros, setPotreros] = useState<Potrero[]>([]);
  const [motivos, setMotivos] = useState<MotivoMovimiento[]>([]);
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionActual | null>(null);
  const [ubicacionLoading, setUbicacionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const previousFincaIdRef = useRef<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);


  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportMovimientosResult | null>(null);
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);


  const form = useForm<MovimientoForm>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      id_finca: "",
      id_animal: "",
      fecha_hora: new Date().toISOString(),
      lote_origen_id: null,
      lote_destino_id: null,
      potrero_origen_id: null,
      potrero_destino_id: null,
      id_motivo_movimiento: null,
      observaciones: "",
    },
  });

  const watchedFincaId = form.watch("id_finca");
  const watchedAnimalId = form.watch("id_animal");
  const watchedFechaHora = form.watch("fecha_hora");
  const watchedLoteOrigenId = form.watch("lote_origen_id");
  const watchedLoteDestinoId = form.watch("lote_destino_id");
  const watchedPotreroOrigenId = form.watch("potrero_origen_id");
  const watchedPotreroDestinoId = form.watch("potrero_destino_id");

  const loadMovimientos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query: MovimientosQuery = {
        page,
        limit: 10,
      };
      const response = await fetchMovimientos(query);
      setMovimientos(response.items ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadAnimales = useCallback(async () => {
    try {
      const response = await fetchAnimales({ limit: 100, estado: "activo" });
      setAnimales(response.items ?? []);
    } catch {
      // Silent fail
    }
  }, []);

  const loadCatalogos = useCallback(async () => {
    try {
      const [fincasRes, lotesRes, potrerosRes, motivosRes] = await Promise.all([
        fetchFincas({ limit: 100 }),
        fetchLotes({ limit: 100 }),
        fetchPotreros({ limit: 100 }),
        fetchMotivosMovimiento(),
      ]);
      setFincas(fincasRes.items ?? []);
      setLotes(lotesRes.items ?? []);
      setPotreros(potrerosRes.items ?? []);
      setMotivos(motivosRes ?? []);
    } catch {
      // Silent fail
    }
  }, []);

  // Filtrar lotes y potreros por finca seleccionada
  const lotesFiltrados = useMemo(() => {
    if (!watchedFincaId) return [];
    return lotes.filter((l) => l.id_finca === watchedFincaId);
  }, [lotes, watchedFincaId]);

  const potrerosFiltrados = useMemo(() => {
    if (!watchedFincaId) return [];
    return potreros.filter((p) => p.id_finca === watchedFincaId);
  }, [potreros, watchedFincaId]);

  const animalesFiltrados = useMemo(() => {
    if (!watchedFincaId) return [];
    return animales.filter((a) => a.id_finca === watchedFincaId);
  }, [animales, watchedFincaId]);

  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  useEffect(() => {
    loadAnimales();
    loadCatalogos();
  }, [loadAnimales, loadCatalogos]);

  useEffect(() => {
    if (previousFincaIdRef.current && previousFincaIdRef.current !== watchedFincaId) {
      form.setValue("id_animal", "");
      form.setValue("lote_origen_id", null);
      form.setValue("lote_destino_id", null);
      form.setValue("potrero_origen_id", null);
      form.setValue("potrero_destino_id", null);
      setUbicacionActual(null);
    }
    previousFincaIdRef.current = watchedFincaId || null;
  }, [form, watchedFincaId]);

  useEffect(() => {
    if (!watchedAnimalId) {
      setUbicacionActual(null);
      setUbicacionLoading(false);
      form.setValue("lote_origen_id", null);
      form.setValue("lote_destino_id", null);
      form.setValue("potrero_origen_id", null);
      form.setValue("potrero_destino_id", null);
      return;
    }

    let isActive = true;
    setUbicacionLoading(true);

    fetchAnimalUbicacionActual(watchedAnimalId)
      .then((response) => {
        if (!isActive) return;
        const ubicacion = response.ubicacionActual ?? null;
        setUbicacionActual(ubicacion);
        form.setValue("lote_origen_id", ubicacion?.loteId ?? null);
        form.setValue("potrero_origen_id", ubicacion?.potreroId ?? null);
        form.setValue("lote_destino_id", ubicacion?.loteId ?? null);
        form.setValue("potrero_destino_id", ubicacion?.potreroId ?? null);
      })
      .catch(() => {
        if (!isActive) return;
        setUbicacionActual(null);
      })
      .finally(() => {
        if (!isActive) return;
        setUbicacionLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [form, watchedAnimalId]);

  const animalOptions = useMemo(
    () =>
      animalesFiltrados.map((a) => ({
        value: a.id,
        label: a.nombre || a.codigo || a.identificador_principal || a.id.slice(0, 8),
        description: a.identificador_principal || a.codigo || undefined,
      })),
    [animalesFiltrados]
  );

  const movimientoEstado = useMemo(() => {
    const hasSeleccionMinima = Boolean(watchedFincaId && watchedAnimalId);
    const hasUbicacion = Boolean(ubicacionActual);
    const loteOrigen = watchedLoteOrigenId ?? null;
    const loteDestino = watchedLoteDestinoId ?? null;
    const potreroOrigen = watchedPotreroOrigenId ?? null;
    const potreroDestino = watchedPotreroDestinoId ?? null;
    const ultimaFecha = ubicacionActual?.fechaMovimiento
      ? new Date(ubicacionActual.fechaMovimiento)
      : null;
    const fechaMovimiento = watchedFechaHora ? new Date(watchedFechaHora) : null;
    const fechaInvalida = Boolean(
      ultimaFecha && fechaMovimiento && fechaMovimiento < ultimaFecha
    );
    const ingresoInicialInvalido = !hasUbicacion && (loteOrigen || potreroOrigen);
    const destinoNinguno = !loteDestino && !potreroDestino;
    const noChange = loteOrigen === loteDestino && potreroOrigen === potreroDestino;
    const origenMismatch =
      hasUbicacion &&
      (loteOrigen !== (ubicacionActual?.loteId ?? null) ||
        potreroOrigen !== (ubicacionActual?.potreroId ?? null));

    return {
      hasSeleccionMinima,
      hasUbicacion,
      origenMismatch,
      fechaInvalida,
      ingresoInicialInvalido,
      destinoNinguno,
      noChange,
    };
  }, [
    ubicacionActual,
    watchedFincaId,
    watchedAnimalId,
    watchedLoteOrigenId,
    watchedLoteDestinoId,
    watchedPotreroOrigenId,
    watchedPotreroDestinoId,
    watchedFechaHora,
  ]);

  const mensajeBloqueo = useMemo(() => {
    if (!movimientoEstado.hasSeleccionMinima) return null;
    if (movimientoEstado.fechaInvalida) {
      return "La fecha del movimiento es anterior al último movimiento registrado.";
    }
    if (movimientoEstado.ingresoInicialInvalido) {
      return "El animal no tiene ubicación previa; el origen debe ser Ninguno.";
    }
    if (movimientoEstado.noChange) {
      return "No hay ningún cambio que registrar.";
    }
    return null;
  }, [movimientoEstado]);

  const mensajeAdvertencia = useMemo(() => {
    if (!movimientoEstado.hasSeleccionMinima) return null;
    if (movimientoEstado.origenMismatch) {
      return "El origen no coincide con la ubicación registrada. Se exige motivo y observaciones.";
    }
    if (movimientoEstado.destinoNinguno && movimientoEstado.hasUbicacion) {
      return "Salida definitiva: el animal quedará sin ubicación activa.";
    }
    return null;
  }, [movimientoEstado]);

  const ubicacionResumen = useMemo(() => {
    if (!ubicacionActual) return null;
    const destino =
      ubicacionActual.potreroNombre ?? ubicacionActual.loteNombre ?? "Sin destino";
    const fincaNombre = ubicacionActual.fincaNombre ?? "Finca sin nombre";
    return `${destino} · ${fincaNombre}`;
  }, [ubicacionActual]);

  const openCreate = () => {
    form.reset({
      id_finca: "",
      id_animal: "",
      fecha_hora: new Date().toISOString(),
      lote_origen_id: null,
      lote_destino_id: null,
      potrero_origen_id: null,
      potrero_destino_id: null,
      id_motivo_movimiento: null,
      observaciones: "",
    });
    setUbicacionActual(null);
    setUbicacionLoading(false);
    previousFincaIdRef.current = null;
    setCreateOpen(true);
  };

  const openDelete = (mov: Movimiento) => {
    setSelectedMovimiento(mov);
    setDeleteOpen(true);
  };

  const validarMovimiento = (values: MovimientoForm) => {
    if (mensajeBloqueo) {
      if (movimientoEstado.fechaInvalida) {
        form.setError("fecha_hora", {
          message: "La fecha es anterior al último movimiento registrado.",
        });
      }
      if (movimientoEstado.ingresoInicialInvalido) {
        form.setError("lote_origen_id", {
          message: "El origen debe ser Ninguno para el primer movimiento.",
        });
      }
      return mensajeBloqueo;
    }

    const requiereMotivo =
      (movimientoEstado.destinoNinguno && movimientoEstado.hasUbicacion) ||
      movimientoEstado.origenMismatch;
    if (requiereMotivo && !values.id_motivo_movimiento) {
      form.setError("id_motivo_movimiento", {
        message: "Selecciona un motivo.",
      });
      return movimientoEstado.origenMismatch
        ? "El origen no coincide con la ubicación registrada."
        : "Indica un motivo para registrar la salida definitiva.";
    }

    if (movimientoEstado.origenMismatch && !values.observaciones?.trim()) {
      form.setError("observaciones", {
        message: "Agrega una observación para la corrección.",
      });
      return "El origen no coincide con la ubicación registrada.";
    }

    return null;
  };

  const handleCreate = async (values: MovimientoForm) => {
    const validationMessage = validarMovimiento(values);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateMovimientoDTO = {
        id_finca: values.id_finca,
        fecha_hora: values.fecha_hora,
        id_animal: values.id_animal,
        lote_origen_id: values.lote_origen_id ?? null,
        lote_destino_id: values.lote_destino_id ?? null,
        potrero_origen_id: values.potrero_origen_id ?? null,
        potrero_destino_id: values.potrero_destino_id ?? null,
        id_motivo_movimiento: values.id_motivo_movimiento ?? undefined,
        observaciones: values.observaciones || undefined,
      };
      const created = await createMovimiento(dto);
      setMovimientos((prev) => [created, ...prev]);
      toast.success("Movimiento registrado");
      setCreateOpen(false);
      await loadMovimientos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al registrar movimiento";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async () => {
    if (!selectedMovimiento) return;
    setSubmitting(true);
    try {
      await deleteMovimiento(selectedMovimiento.id);
      setMovimientos((prev) => prev.filter((m) => m.id !== selectedMovimiento.id));
      toast.success("Movimiento eliminado");
      setDeleteOpen(false);
    } catch {
      // Error toasted
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPage(1);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportMovimientosExcel();
      toast.success("Exportacion iniciada");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo exportar a Excel";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadMovimientosTemplate();
      toast.success("Plantilla descargada");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo descargar la plantilla";
      toast.error(message);
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportResult(null);
    setImportErrors([]);
  };

  const handleImportFile = (file: File | null) => {
    resetImportState();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Solo se permiten archivos .xlsx");
      return;
    }
    setImportFile(file);
    setConfirmImportOpen(true);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleFileDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    setImportErrors([]);
    try {
      const result = await importMovimientosExcel(importFile);
      setImportResult(result);
      setImportErrors(result.errors ?? []);
      toast.success("Importacion completada");
      await loadMovimientos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo importar el archivo";
      toast.error(message);
    } finally {
      setImporting(false);
      setConfirmImportOpen(false);
    }
  };


  const hasFilters = search;

  const columns: DataTableColumn<Movimiento>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (mov) => (
        <span className="font-medium">{formatDate(mov.fecha_hora)}</span>
      ),
    },
    {
      key: "animal",
      header: "Animal",
      render: (mov) => (
        <div>
          <p className="font-medium text-foreground">
            {mov.animal_nombre || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "origen",
      header: "Origen",
      render: (mov) => (
        <span className="text-sm">
          {mov.potrero_origen_nombre || mov.lote_origen_nombre || "—"}
        </span>
      ),
    },
    {
      key: "destino",
      header: "Destino",
      render: (mov) => (
        <span className="text-sm">
          {mov.potrero_destino_nombre || mov.lote_destino_nombre || "—"}
        </span>
      ),
    },
    {
      key: "motivo",
      header: "Motivo",
      render: (mov) => (
        <span className="text-muted-foreground">{mov.motivo_nombre ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (mov) =>
        canDelete ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openDelete(mov)}
            aria-label="Eliminar movimiento"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ];


  if (!canView) {
    return <NoPermission />;
  }

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Inventario"
          title="Movimientos"
          description="Registra y consulta los movimientos de animales."
          actions={
            <>
              <Button
                variant="secondary"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Exportar a Excel
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileUp className="h-4 w-4" />
                Descargar plantilla
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <UploadCloud className="h-4 w-4" />
                Importar Excel
              </Button>
              {canCreate && (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Nuevo movimiento
                </Button>
              )}
            </>
          }
        />


        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5">
            <FiltersBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Buscar..."
              showClear={!!hasFilters}
              onClear={clearFilters}
            />

            <DataTable
              columns={columns}
              data={movimientos}
              keyExtractor={(m) => m.id}
              loading={loading}
              error={error}
              onRetry={loadMovimientos}
              emptyState={{
                title: "Sin movimientos",
                description: "Registra el primer movimiento.",
                action: canCreate
                  ? { label: "Nuevo movimiento", onClick: openCreate }
                  : undefined,
              }}
            />

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Nuevo movimiento"
          description="Registra un movimiento de animal."
        >
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreate)}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Finca *</label>
              <Controller
                name="id_finca"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar finca" />
                    </SelectTrigger>
                    <SelectContent>
                      {fincas.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.id_finca && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.id_finca.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Animal *</label>
              <Controller
                name="id_animal"
                control={form.control}
                render={({ field }) => (
                    <Autocomplete
                      value={field.value}
                      onChange={field.onChange}
                      options={animalOptions}
                      placeholder="Seleccionar animal"
                      searchPlaceholder="Buscar por nombre o identificacion"
                      emptyText="No se encontraron animales."
                      disabled={!watchedFincaId}
                    />
                )}
              />
              {form.formState.errors.id_animal && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.id_animal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha y hora *</label>
              <Controller
                name="fecha_hora"
                control={form.control}
                render={({ field }) => {
                  // Convertir ISO string a formato datetime-local (YYYY-MM-DDTHH:mm)
                  const getLocalDateTime = (isoString: string) => {
                    if (!isoString) return "";
                    try {
                      const date = new Date(isoString);
                      // Ajustar a zona horaria local
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(2, "0");
                      return `${year}-${month}-${day}T${hours}:${minutes}`;
                    } catch {
                      return "";
                    }
                  };

                  // Convertir datetime-local a ISO string
                  const toISOString = (localDateTime: string) => {
                    if (!localDateTime) return "";
                    try {
                      const date = new Date(localDateTime);
                      return date.toISOString();
                    } catch {
                      return "";
                    }
                  };

                  return (
                    <Input
                      type="datetime-local"
                      value={getLocalDateTime(field.value)}
                      onChange={(e) => {
                        const isoString = toISOString(e.target.value);
                        field.onChange(isoString);
                      }}
                    />
                  );
                }}
              />
              {form.formState.errors.fecha_hora && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fecha_hora.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lote origen</label>
                <Controller
                  name="lote_origen_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      disabled={!watchedFincaId || !watchedAnimalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {lotesFiltrados.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lote destino</label>
                <Controller
                  name="lote_destino_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      disabled={!watchedFincaId || !watchedAnimalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {lotesFiltrados.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Potrero origen</label>
                <Controller
                  name="potrero_origen_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      disabled={!watchedFincaId || !watchedAnimalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {potrerosFiltrados.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Potrero destino</label>
                <Controller
                  name="potrero_destino_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      disabled={!watchedFincaId || !watchedAnimalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {potrerosFiltrados.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Controller
                name="id_motivo_movimiento"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ninguno</SelectItem>
                      {motivos.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.id_motivo_movimiento && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.id_motivo_movimiento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea
                {...form.register("observaciones")}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Observaciones adicionales..."
              />
              {form.formState.errors.observaciones && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.observaciones.message}
                </p>
              )}
            </div>

            {ubicacionLoading && watchedAnimalId && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Cargando ubicación actual del animal...
              </div>
            )}

            {ubicacionResumen && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Ubicación registrada:
                </span>{" "}
                {ubicacionResumen}
              </div>
            )}

            {mensajeAdvertencia && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {mensajeAdvertencia}
              </div>
            )}

            {mensajeBloqueo && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {mensajeBloqueo}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || ubicacionLoading || Boolean(mensajeBloqueo)}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={importOpen}
          onClose={() => {
            setImportOpen(false);
            resetImportState();
          }}
          title="Importar movimientos"
          description="Este proceso movera animales a nuevos lotes y cambiara su ubicacion actual."
        >
          <div className="space-y-4">
            <div
              className={`rounded-lg border border-dashed p-4 transition ${
                dragActive
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/40"
              }`}
              onDrop={handleFileDrop}
              onDragEnter={handleFileDrag}
              onDragOver={handleFileDrag}
              onDragLeave={handleFileDrag}
            >
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-transparent p-4 text-center transition hover:border-primary/40">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Arrastra un archivo .xlsx o haz clic para seleccionar
                </span>
                <span className="text-xs text-muted-foreground">
                  Solo se aceptan archivos Excel (.xlsx)
                </span>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) =>
                    handleImportFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            {importFile && (
              <div className="rounded-md border border-border bg-background p-3 text-sm">
                <p className="font-medium">Archivo seleccionado</p>
                <p className="text-muted-foreground">{importFile.name}</p>
              </div>
            )}

            {importResult && (
              <div className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Filas procesadas</p>
                  <p className="text-lg font-semibold">
                    {importResult.processed}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exitosas</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {importResult.created}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fallidas</p>
                  <p className="text-lg font-semibold text-destructive">
                    {importResult.errors.length}
                  </p>
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Errores por fila</p>
                <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-border bg-background p-3 text-xs">
                  {importErrors.map((err) => (
                    <div key={`${err.row}-${err.message}`} className="flex gap-2">
                      <Badge variant="outline">Fila {err.row}</Badge>
                      <span className="text-muted-foreground">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Antes de importar</p>
              <p className="text-xs">
                Este archivo cambiara la ubicacion actual de los animales
                incluidos. Asegurate de usar la plantilla oficial.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setImportOpen(false);
                  resetImportState();
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={confirmImportOpen}
          onClose={() => setConfirmImportOpen(false)}
          onConfirm={confirmImport}
          title="Confirmar importacion"
          description="Esto cambiara la ubicacion actual de los animales. Deseas continuar?"
          confirmLabel={importing ? "Importando..." : "Importar"}
          loading={importing}
        />

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar movimiento"
          description="¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          loading={submitting}
        />
      </div>
    </MotionFadeSlide>
  );
}
