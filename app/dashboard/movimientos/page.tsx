"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FiltersBar, SelectFilter } from "@/components/ui/filters-bar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";
import { DatePicker } from "@/components/ui/date-picker";
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
  type MovimientosQuery,
  type MotivoMovimiento,
} from "@/lib/api/movimientos.service";
import { fetchAnimales } from "@/lib/api/animales.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import { fetchLotes } from "@/lib/api/lotes.service";
import { fetchPotreros } from "@/lib/api/potreros.service";
import type { Movimiento, CreateMovimientoDTO, Animal, Finca, Lote, Potrero } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const movimientoSchema = z.object({
  id_finca: z.string().min(1, "Selecciona una finca"),
  id_animal: z.string().min(1, "Selecciona un animal"),
  fecha_hora: z.string().min(1, "Ingresa la fecha y hora"),
  lote_origen_id: z.string().optional(),
  lote_destino_id: z.string().optional(),
  potrero_origen_id: z.string().optional(),
  potrero_destino_id: z.string().optional(),
  id_motivo_movimiento: z.string().optional(),
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MovimientoForm>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      id_finca: "",
      id_animal: "",
      fecha_hora: new Date().toISOString(),
      lote_origen_id: "",
      lote_destino_id: "",
      potrero_origen_id: "",
      potrero_destino_id: "",
      id_motivo_movimiento: "",
      observaciones: "",
    },
  });

  const watchedFincaId = form.watch("id_finca");
  const watchedAnimalId = form.watch("id_animal");

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

  // Obtener finca del animal seleccionado
  const animalSeleccionado = useMemo(() => {
    if (!watchedAnimalId) return null;
    return animales.find((a) => a.id === watchedAnimalId);
  }, [animales, watchedAnimalId]);

  // Auto-seleccionar finca cuando se selecciona un animal
  useEffect(() => {
    if (animalSeleccionado?.id_finca && !form.getValues("id_finca")) {
      form.setValue("id_finca", animalSeleccionado.id_finca);
    }
  }, [animalSeleccionado, form]);

  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  useEffect(() => {
    loadAnimales();
    loadCatalogos();
  }, [loadAnimales, loadCatalogos]);

  const animalOptions = useMemo(
    () =>
      animales.map((a) => ({
        value: a.id,
        label: a.nombre || a.codigo || a.id.slice(0, 8),
      })),
    [animales]
  );

  const openCreate = () => {
    form.reset({
      id_finca: "",
      id_animal: "",
      fecha_hora: new Date().toISOString(),
      lote_origen_id: "",
      lote_destino_id: "",
      potrero_origen_id: "",
      potrero_destino_id: "",
      id_motivo_movimiento: "",
      observaciones: "",
    });
    setCreateOpen(true);
  };

  const openDelete = (mov: Movimiento) => {
    setSelectedMovimiento(mov);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: MovimientoForm) => {
    setSubmitting(true);
    try {
      const dto: CreateMovimientoDTO = {
        id_finca: values.id_finca,
        fecha_hora: values.fecha_hora,
        id_animal: values.id_animal,
        lote_origen_id: values.lote_origen_id || undefined,
        lote_destino_id: values.lote_destino_id || undefined,
        potrero_origen_id: values.potrero_origen_id || undefined,
        potrero_destino_id: values.potrero_destino_id || undefined,
        id_motivo_movimiento: values.id_motivo_movimiento || undefined,
        observaciones: values.observaciones || undefined,
      };
      const created = await createMovimiento(dto);
      setMovimientos((prev) => [created, ...prev]);
      toast.success("Movimiento registrado");
      setCreateOpen(false);
      await loadMovimientos();
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar movimiento");
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
          <DropdownMenu
            items={[
              {
                label: "Eliminar",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => openDelete(mov),
                variant: "danger",
              },
            ]}
          />
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
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo movimiento
              </Button>
            ) : undefined
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animalOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
                      disabled={!watchedFincaId}
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
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
                      disabled={!watchedFincaId}
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
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
                      disabled={!watchedFincaId}
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
                      value={field.value || "__none__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? undefined : value)
                      }
                      disabled={!watchedFincaId}
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
                    value={field.value || "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? undefined : value)
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea
                {...form.register("observaciones")}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

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
