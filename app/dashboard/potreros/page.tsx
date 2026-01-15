"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { Loader2, Pencil, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import NoPermission from "@/components/no-permission";
import { Tabs as PageTabs } from "@/components/ui/tabs"; // ✅ tu Tabs (por props tabs=[...]) SOLO lo usamos en la página principal

// Dynamic import para evitar SSR
const PotreroMapEditor = dynamic(
  () => import("@/components/potrero-map-editor"),
  { ssr: false }
);

import {
  fetchPotreros,
  createPotrero,
  updatePotrero,
  deletePotrero,
  fetchEstadosPotreros,
  fetchPotrerosMap,
  type EstadoPotrero,
} from "@/lib/api/potreros.service";
import { fetchLotes, createLote, deleteLote } from "@/lib/api/lotes.service";
import { fetchOcupaciones, createOcupacion, cerrarOcupacion } from "@/lib/api/ocupaciones.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import type { Potrero, Lote, Ocupacion, Finca } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

// Schemas
const potreroSchema = z.object({
  nombre: z.string().min(1, "Ingresa el nombre"),
  id_finca: z.string().optional(),
  area_hectareas: z.any().optional(),
  area_m2: z.any().optional(),
  geometry: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  capacidad_animales: z.any().optional(),
  tipo_pasto: z.string().optional(),
  estado: z.string().optional(),
  notas: z.string().optional(),
});

const loteSchema = z.object({
  id_finca: z.string().min(1, "Selecciona una finca"),
  nombre: z.string().min(1, "Ingresa el nombre"),
  descripcion: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const ocupacionSchema = z.object({
  potrero_id: z.string().min(1, "Selecciona un potrero"),
  lote_id: z.string().optional(),
  fecha_inicio: z.string().min(1, "Ingresa fecha inicio"),
  fecha_fin: z.string().optional(),
  cantidad_animales: z.any().optional(),
});

type PotreroForm = z.infer<typeof potreroSchema>;
type LoteForm = z.infer<typeof loteSchema>;
type OcupacionForm = z.infer<typeof ocupacionSchema>;

function getEstadoBadgeVariant(estado: string) {
  switch (estado) {
    case "disponible":
      return "success";
    case "ocupado":
      return "warning";
    case "mantenimiento":
      return "info";
    default:
      return "muted";
  }
}

type ModalType = "create" | "edit" | "view" | null;

// ========== POTREROS TAB ==========
function PotrerosTab({ fincas }: { fincas: Finca[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "potreros.create");
  const canEdit = hasPermission(session, "potreros.edit");
  const canDelete = hasPermission(session, "potreros.delete");

  const [potreros, setPotreros] = useState<Potrero[]>([]);
  const [estadosPotreros, setEstadosPotreros] = useState<EstadoPotrero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalTab, setModalTab] = useState<"datos" | "mapa">("datos"); // ✅ tabs internas del modal (simple)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Potrero | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Contexto del mapa (NO cargar 1000; solo cuando estás en tab "mapa")
  const [mapContext, setMapContext] = useState<Array<{ id: string; nombre: string; geometry?: Array<{ lat: number; lng: number }> }>>([]);
  const [mapContextLoading, setMapContextLoading] = useState(false);

  const form = useForm<PotreroForm>({
    resolver: zodResolver(potreroSchema),
    defaultValues: { nombre: "", estado: "" },
  });

  const watchedFincaId = form.watch("id_finca");
  const watchedGeometry = form.watch("geometry");

  useEffect(() => {
    const loadEstados = async () => {
      try {
        const estados = await fetchEstadosPotreros();
        setEstadosPotreros(estados);
      } catch (err) {
        console.error("Error cargando estados de potreros:", err);
      }
    };
    loadEstados();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchPotreros({ page, limit: 10, q: search || undefined });
      setPotreros(res.items ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Cargar contexto del mapa SOLO cuando el modal está abierto y estás en "mapa"
  // y preferiblemente filtrado por finca para no traer data innecesaria.
  const loadMapContext = useCallback(async () => {
    if (!modalOpen) return;
    if (modalTab !== "mapa") return;
  
    setMapContextLoading(true);
    try {
      // ✅ Nuevo endpoint liviano: /potreros/map
      // Trae SOLO { id, nombre, geometry } y permite limit hasta 500 (según el DTO)
      const res = await fetchPotrerosMap({
        id_finca: watchedFincaId || undefined,
        limit: 300, // 👈 ajusta a gusto (ej. 200-400). Nunca más de lo que definas en backend.
      });
  
      const items = (res.items ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        geometry: p.geometry ?? undefined, // ✅ convertir null -> undefined para tu PotreroMapEditor
      }));
  
      setMapContext(items);
    } catch (err) {
      console.error("Error cargando contexto del mapa:", err);
      setMapContext([]);
    } finally {
      setMapContextLoading(false);
    }
  }, [modalOpen, modalTab, watchedFincaId]);
  

  useEffect(() => {
    loadMapContext();
  }, [loadMapContext]);

  const openCreate = () => {
    form.reset({
      nombre: "",
      estado: estadosPotreros.length > 0 ? estadosPotreros[0].codigo : "",
      id_finca: "",
      area_hectareas: undefined,
      area_m2: undefined,
      geometry: undefined,
      capacidad_animales: undefined,
      tipo_pasto: "",
      notas: "",
    });
    setSelected(null);
    setModalType("create");
    setModalTab("datos");
    setModalOpen(true);
  };

  const openEdit = (p: Potrero) => {
    setSelected(p);
    form.reset({
      nombre: p.nombre,
      id_finca: p.id_finca ?? "",
      area_hectareas: p.area_hectareas ? Math.round(p.area_hectareas * 100) / 100 : undefined,
      area_m2: p.area_m2 ?? undefined,
      geometry: p.geometry ?? undefined,
      capacidad_animales: p.capacidad_animales ?? undefined,
      tipo_pasto: p.tipo_pasto ?? "",
      estado: p.estado ?? "",
      notas: p.notas ?? "",
    });
    setModalType("edit");
    setModalTab("datos");
    setModalOpen(true);
  };

  const openView = (p: Potrero) => {
    setSelected(p);
    form.reset({
      nombre: p.nombre,
      id_finca: p.id_finca ?? "",
      area_hectareas: p.area_hectareas ? Math.round(p.area_hectareas * 100) / 100 : undefined,
      area_m2: p.area_m2 ?? undefined,
      geometry: p.geometry ?? undefined,
      capacidad_animales: p.capacidad_animales ?? undefined,
      tipo_pasto: p.tipo_pasto ?? "",
      estado: p.estado ?? "",
      notas: p.notas ?? "",
    });
    setModalType("view");
    setModalTab("datos");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelected(null);
    setModalTab("datos");
  };

  const handleMapEditorComplete = (
    geometry: Array<{ lat: number; lng: number }>,
    areaM2: number,
    areaHa: number
  ) => {
    const roundedAreaHa = Math.round(areaHa * 100) / 100; // Redondear a 2 decimales
    form.setValue("geometry", geometry, { shouldDirty: true, shouldValidate: false });
    form.setValue("area_m2", areaM2, { shouldDirty: true, shouldValidate: false });
    form.setValue("area_hectareas", roundedAreaHa, { shouldDirty: true, shouldValidate: false });

    toast.success(`Polígono guardado. Área: ${roundedAreaHa.toFixed(2)} ha`);
  };

  const openDelete = (p: Potrero) => {
    setSelected(p);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: PotreroForm) => {
    setSubmitting(true);
    try {
      const created = await createPotrero(values);
      toast.success("Potrero creado");
      closeModal();

      // ✅ recargar página actual (mantiene paginación y filtros)
      await loadData();

      // si estás viendo mapa, refresca contexto
      if (modalTab === "mapa") {
        await loadMapContext();
      }
    } catch {
      // tu apiRequest probablemente ya lanza toast/handler global
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: PotreroForm) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await updatePotrero(selected.id, values);
      toast.success("Potrero actualizado");
      closeModal();

      // ✅ actualiza lista visible sin romper paginación (o recarga)
      setPotreros((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      // refrescar contexto mapa (si aplica)
      await loadMapContext();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deletePotrero(selected.id);
      toast.success("Potrero eliminado");
      setDeleteOpen(false);

      // ✅ recarga página (por si cambió totalPages)
      await loadData();

      // refrescar contexto mapa
      await loadMapContext();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const isView = modalType === "view";
  const isCreate = modalType === "create";
  const isEdit = modalType === "edit";

  const modalTitle =
    modalType === "create"
      ? "Nuevo potrero"
      : modalType === "edit"
      ? "Editar potrero"
      : modalType === "view"
      ? "Ver potrero"
      : "";

  // ✅ polygons vecinos: excluye el actual (en edit/view) y filtra los que sí traen geometry
  const existingPolygons = useMemo(() => {
    const selectedId = selected?.id;
    return mapContext
      .filter((p) => !!p.geometry && p.geometry.length >= 3)
      .filter((p) => (isCreate ? true : p.id !== selectedId));
  }, [mapContext, selected?.id, isCreate]);

  const columns: DataTableColumn<Potrero>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (p) => <span className="font-medium">{p.nombre}</span>,
    },
    {
      key: "finca",
      header: "Finca",
      render: (p) => p.finca_nombre ?? "—",
    },
    {
      key: "area",
      header: "Área (ha)",
      render: (p) => p.area_hectareas ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (p) =>
        p.estado ? (
          <Badge variant={getEstadoBadgeVariant(p.estado)}>{p.estado}</Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      header: "Creado",
      render: (p) => p.created_at ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(p.created_at), "MMM d, yyyy", { locale: es })}
        </span>
      ) : "—",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <DropdownMenu
          collisionPadding={10}
          items={[
            { label: "Ver", icon: <Eye className="h-4 w-4" />, onClick: () => openView(p) },
            ...(canEdit
              ? [{ label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(p) }]
              : []),
            ...(canDelete
              ? [{
                  label: "Eliminar",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => openDelete(p),
                  variant: "danger" as const,
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <FiltersBar
          search={search}
          onSearchChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          searchPlaceholder="Buscar potrero..."
        />
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo potrero
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <DataTable
          columns={columns}
          data={potreros}
          keyExtractor={(p) => p.id}
          loading={loading}
          error={error}
          onRetry={loadData}
          emptyState={{ title: "Sin potreros" }}
        />
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ✅ Modal unificado */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={modalTitle}
        className="max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* ✅ Tabs internas simples (NO usar tu Tabs compound) */}
        <div className="flex items-center gap-2 border-b pb-3">
          <Button
            type="button"
            variant={modalTab === "datos" ? "default" : "outline"}
            size="sm"
            onClick={() => setModalTab("datos")}
          >
            Datos
          </Button>
          <Button
            type="button"
            variant={modalTab === "mapa" ? "default" : "outline"}
            size="sm"
            onClick={() => setModalTab("mapa")}
          >
            Mapa
          </Button>

          <div className="ml-auto text-xs text-muted-foreground">
            {modalTab === "mapa" && mapContextLoading ? "Cargando contexto del mapa..." : ""}
          </div>
        </div>

        {modalTab === "datos" && (
          <div className="pt-4">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(isCreate ? handleCreate : handleEdit)}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input {...form.register("nombre")} disabled={isView} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Finca</label>
                  <Controller
                    name="id_finca"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(value) =>
                          field.onChange(value === "__none__" ? undefined : value)
                        }
                        disabled={isView}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Ninguna</SelectItem>
                          {fincas.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Controller
                    name="estado"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={isView}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosPotreros.map((estado) => (
                            <SelectItem key={estado.codigo} value={estado.codigo}>
                              {estado.nombre}
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
                  <label className="text-sm font-medium">Área (ha)</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("area_hectareas")}
                    disabled={isView}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacidad animales</label>
                  <Input type="number" {...form.register("capacidad_animales")} disabled={isView} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  {...form.register("notas")}
                  disabled={isView}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Notas adicionales..."
                />
              </div>

              {!isView && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCreate ? "Crear" : "Guardar"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}

        {modalTab === "mapa" && (
          <div className="pt-4">
            <PotreroMapEditor
              initialGeometry={watchedGeometry}
              onPolygonComplete={handleMapEditorComplete}
              onClose={() => setModalTab("datos")} // vuelve a "Datos"
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
              existingPolygons={existingPolygons}
              readOnly={isView}
            />

            {!isView && (
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalTab("datos")}>
                  Volver a datos
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar potrero"
        description={`¿Eliminar "${selected?.nombre}"?`}
        loading={submitting}
      />
    </div>
  );
}

// ========== LOTES TAB ==========
function LotesTab({ fincas }: { fincas: Finca[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "potreros.create");
  const canDelete = hasPermission(session, "potreros.delete");

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Lote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoteForm>({
    resolver: zodResolver(loteSchema),
    defaultValues: { nombre: "" },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchLotes({ page, limit: 10 });
      setLotes(res.items ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    form.reset({ id_finca: "", nombre: "", descripcion: "", activo: true });
    setCreateOpen(true);
  };

  const openDelete = (l: Lote) => {
    setSelected(l);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: LoteForm) => {
    setSubmitting(true);
    try {
      const created = await createLote({
        id_finca: values.id_finca,
        nombre: values.nombre,
        descripcion: values.descripcion || undefined,
        activo: values.activo ?? true,
      });
      setLotes((prev) => [created, ...prev]);
      toast.success("Lote creado");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al crear lote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteLote(selected.id);
      setLotes((prev) => prev.filter((l) => l.id !== selected.id));
      toast.success("Lote eliminado");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<Lote>[] = [
    { key: "nombre", header: "Nombre", render: (l) => <span className="font-medium">{l.nombre}</span> },
    { key: "finca", header: "Finca", render: (l) => l.finca_nombre ?? "—" },
    { key: "descripcion", header: "Descripción", render: (l) => l.descripcion ?? "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) =>
        canDelete ? (
          <DropdownMenu
            items={[
              { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(l), variant: "danger" },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo lote
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={lotes}
        keyExtractor={(l) => l.id}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{ title: "Sin lotes" }}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo lote">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...form.register("nombre")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Finca *</label>
            <Controller
              name="id_finca"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
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
              <p className="text-sm text-destructive">
                {form.formState.errors.id_finca.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              {...form.register("descripcion")}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Descripción del lote..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
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
        title="Eliminar lote"
        description={`¿Eliminar "${selected?.nombre}"?`}
        loading={submitting}
      />
    </div>
  );
}

// ========== OCUPACIONES TAB ==========
function OcupacionesTab({ potreros, lotes }: { potreros: Potrero[]; lotes: Lote[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "potreros.create");
  const canDelete = hasPermission(session, "potreros.delete");

  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Ocupacion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OcupacionForm>({
    resolver: zodResolver(ocupacionSchema),
    defaultValues: { potrero_id: "", fecha_inicio: new Date().toISOString().split("T")[0] },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchOcupaciones({ page, limit: 10 });
      setOcupaciones(res.items ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    form.reset({ potrero_id: "", fecha_inicio: new Date().toISOString().split("T")[0] });
    setCreateOpen(true);
  };

  const openDelete = (o: Ocupacion) => {
    setSelected(o);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: OcupacionForm) => {
    setSubmitting(true);
    try {
      const created = await createOcupacion({
        potrero_id: values.potrero_id,
        lote_id: values.lote_id || undefined,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin || undefined,
        cantidad_animales: values.cantidad_animales,
      });
      setOcupaciones((prev) => [created, ...prev]);
      toast.success("Ocupación registrada");
      setCreateOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      // Cerrar ocupación en lugar de eliminar
      await cerrarOcupacion(selected.id, {
        fecha_fin: new Date().toISOString().split("T")[0],
      });
      setOcupaciones((prev) => prev.filter((o) => o.id !== selected.id));
      toast.success("Ocupación cerrada");
      setDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Error al cerrar ocupación");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

  const columns: DataTableColumn<Ocupacion>[] = [
    { key: "potrero", header: "Potrero", render: (o) => <span className="font-medium">{o.potrero_nombre ?? "—"}</span> },
    { key: "lote", header: "Lote", render: (o) => o.lote_nombre ?? "—" },
    { key: "inicio", header: "Inicio", render: (o) => formatDate(o.fecha_inicio) },
    {
      key: "fin",
      header: "Fin",
      render: (o) => (o.fecha_fin ? formatDate(o.fecha_fin) : <Badge variant="success">Activa</Badge>),
    },
    { key: "cantidad", header: "Animales", render: (o) => o.cantidad_animales ?? "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (o) =>
        canDelete ? (
          <DropdownMenu
            items={[
              { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(o), variant: "danger" },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva ocupación
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={ocupaciones}
        keyExtractor={(o) => o.id}
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyState={{ title: "Sin ocupaciones" }}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva ocupación">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Potrero *</label>
            <Controller
              name="potrero_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {potreros.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.potrero_id && (
              <p className="text-sm text-red-500">{form.formState.errors.potrero_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lote</label>
            <Controller
              name="lote_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguno</SelectItem>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha inicio *</label>
              <Controller
                name="fecha_inicio"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha inicio"
                  />
                )}
              />
              {form.formState.errors.fecha_inicio && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fecha_inicio.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha fin</label>
              <Controller
                name="fecha_fin"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha fin"
                  />
                )}
              />
              {form.formState.errors.fecha_fin && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fecha_fin.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad animales</label>
            <Input type="number" {...form.register("cantidad_animales")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
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
        title="Eliminar ocupación"
        loading={submitting}
      />
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function PotrerosPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "potreros.view");

  const [fincas, setFincas] = useState<Finca[]>([]);
  const [potreros, setPotreros] = useState<Potrero[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);

  useEffect(() => {
    fetchFincas({ limit: 100 }).then((r) => setFincas(r.items ?? [])).catch(() => {});
    fetchPotreros({ limit: 100 }).then((r) => setPotreros(r.items ?? [])).catch(() => {});
    fetchLotes({ limit: 100 }).then((r) => setLotes(r.items ?? [])).catch(() => {});
  }, []);

  if (!canView) return <NoPermission />;

  const tabs = [
    { id: "potreros", label: "Potreros", content: <PotrerosTab fincas={fincas} /> },
    { id: "lotes", label: "Lotes", content: <LotesTab fincas={fincas} /> },
    { id: "ocupaciones", label: "Ocupación", content: <OcupacionesTab potreros={potreros} lotes={lotes} /> },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Infraestructura"
          title="Potreros"
          description="Gestiona potreros, lotes y ocupaciones."
        />
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <PageTabs tabs={tabs} defaultTab="potreros" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
