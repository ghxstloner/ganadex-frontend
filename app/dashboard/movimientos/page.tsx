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
import NoPermission from "@/components/no-permission";

import {
  fetchMovimientos,
  createMovimiento,
  deleteMovimiento,
  type MovimientosQuery,
} from "@/lib/api/movimientos.service";
import { fetchAnimales } from "@/lib/api/animales.service";
import type { Movimiento, CreateMovimientoDTO, Animal } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const movimientoSchema = z.object({
  animal_id: z.string().min(1, "Selecciona un animal"),
  tipo: z.string().min(1, "Selecciona un tipo"),
  motivo: z.string().optional(),
  fecha: z.string().min(1, "Ingresa la fecha"),
  notas: z.string().optional(),
});

type MovimientoForm = z.infer<typeof movimientoSchema>;

const tipoOptions = [
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "traslado", label: "Traslado" },
  { value: "venta", label: "Venta" },
  { value: "muerte", label: "Muerte" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTipoBadgeVariant(tipo: string) {
  switch (tipo) {
    case "entrada":
      return "success";
    case "salida":
      return "warning";
    case "venta":
      return "info";
    case "muerte":
      return "danger";
    default:
      return "muted";
  }
}

export default function MovimientosPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "movimientos.view");
  const canCreate = hasPermission(session, "movimientos.create");
  const canDelete = hasPermission(session, "movimientos.delete");

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MovimientoForm>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      animal_id: "",
      tipo: "",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      notas: "",
    },
  });

  const loadMovimientos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query: MovimientosQuery = {
        page,
        limit: 10,
        tipo: tipoFilter || undefined,
      };
      const response = await fetchMovimientos(query);
      setMovimientos(response.items ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, tipoFilter]);

  const loadAnimales = useCallback(async () => {
    try {
      const response = await fetchAnimales({ limit: 100, estado: "activo" });
      setAnimales(response.items ?? []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  useEffect(() => {
    loadAnimales();
  }, [loadAnimales]);

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
      animal_id: "",
      tipo: "",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      notas: "",
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
        animal_id: values.animal_id,
        tipo: values.tipo,
        motivo: values.motivo || undefined,
        fecha: values.fecha,
        notas: values.notas || undefined,
      };
      const created = await createMovimiento(dto);
      setMovimientos((prev) => [created, ...prev]);
      toast.success("Movimiento registrado");
      setCreateOpen(false);
    } catch {
      // Error toasted
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
    setTipoFilter("");
    setPage(1);
  };

  const hasFilters = search || tipoFilter;

  const columns: DataTableColumn<Movimiento>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (mov) => (
        <span className="font-medium">{formatDate(mov.fecha)}</span>
      ),
    },
    {
      key: "animal",
      header: "Animal",
      render: (mov) => (
        <div>
          <p className="font-medium text-foreground">
            {mov.animal_nombre || mov.animal_codigo || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (mov) => (
        <Badge variant={getTipoBadgeVariant(mov.tipo)}>{mov.tipo}</Badge>
      ),
    },
    {
      key: "motivo",
      header: "Motivo",
      render: (mov) => (
        <span className="text-muted-foreground">{mov.motivo ?? "—"}</span>
      ),
    },
    {
      key: "destino",
      header: "Destino",
      render: (mov) => (
        <span className="text-sm">
          {mov.destino_potrero_nombre || mov.destino_lote_nombre || "—"}
        </span>
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
            >
              <SelectFilter
                value={tipoFilter}
                onChange={(v) => {
                  setTipoFilter(v);
                  setPage(1);
                }}
                options={tipoOptions}
                placeholder="Tipo"
              />
            </FiltersBar>

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
              <label className="text-sm font-medium">Animal *</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                {...form.register("animal_id")}
              >
                <option value="">Seleccionar animal</option>
                {animalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.animal_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.animal_id.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("tipo")}
                >
                  <option value="">Seleccionar</option>
                  {tipoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha *</label>
                <Controller
                  name="fecha"
                  control={form.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar fecha"
                    />
                  )}
                />
                {form.formState.errors.fecha && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fecha.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input {...form.register("motivo")} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input {...form.register("notas")} placeholder="Opcional" />
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
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
