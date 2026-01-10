"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Tabs } from "@/components/ui/tabs";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NoPermission from "@/components/no-permission";

import {
  fetchPotreros,
  createPotrero,
  updatePotrero,
  deletePotrero,
  fetchEstadosPotreros,
  type EstadoPotrero,
} from "@/lib/api/potreros.service";
import { fetchLotes, createLote, updateLote, deleteLote } from "@/lib/api/lotes.service";
import {
  fetchOcupaciones,
  createOcupacion,
  deleteOcupacion,
} from "@/lib/api/ocupaciones.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import type { Potrero, Lote, Ocupacion, Finca } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

// Schemas
const potreroSchema = z.object({
  nombre: z.string().min(1, "Ingresa el nombre"),
  id_finca: z.string().optional(),
  area_hectareas: z.any().optional(),
  capacidad_animales: z.any().optional(),
  tipo_pasto: z.string().optional(),
  estado: z.string().optional(),
  notas: z.string().optional(),
});

const loteSchema = z.object({
  nombre: z.string().min(1, "Ingresa el nombre"),
  finca_id: z.string().optional(),
  descripcion: z.string().optional(),
  proposito: z.string().optional(),
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Potrero | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PotreroForm>({
    resolver: zodResolver(potreroSchema),
    defaultValues: { nombre: "", estado: "" },
  });

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

  const openCreate = () => {
    form.reset({ 
      nombre: "", 
      estado: estadosPotreros.length > 0 ? estadosPotreros[0].codigo : "",
      id_finca: "",
      area_hectareas: undefined,
      capacidad_animales: undefined,
      tipo_pasto: "",
      notas: "",
    });
    setCreateOpen(true);
  };

  const openEdit = (p: Potrero) => {
    setSelected(p);
    form.reset({
      nombre: p.nombre,
      id_finca: p.id_finca ?? "",
      area_hectareas: p.area_hectareas ?? undefined,
      capacidad_animales: p.capacidad_animales ?? undefined,
      tipo_pasto: p.tipo_pasto ?? "",
      estado: p.estado,
      notas: p.notas ?? "",
    });
    setEditOpen(true);
  };

  const openDelete = (p: Potrero) => {
    setSelected(p);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: PotreroForm) => {
    setSubmitting(true);
    try {
      const created = await createPotrero(values);
      setPotreros((prev) => [created, ...prev]);
      toast.success("Potrero creado");
      setCreateOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: PotreroForm) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await updatePotrero(selected.id, values);
      setPotreros((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Potrero actualizado");
      setEditOpen(false);
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
      setPotreros((prev) => prev.filter((p) => p.id !== selected.id));
      toast.success("Potrero eliminado");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

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
      render: (p) => (
        <Badge variant={getEstadoBadgeVariant(p.estado)}>{p.estado}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <DropdownMenu
          items={[
            ...(canEdit
              ? [{ label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(p) }]
              : []),
            ...(canDelete
              ? [{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(p), variant: "danger" as const }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <FiltersBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar potrero..." />
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo potrero
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={potreros} keyExtractor={(p) => p.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin potreros" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo potrero">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...form.register("nombre")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Finca</label>
              <Controller
                name="id_finca"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ninguna</SelectItem>
                      {fincas.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
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
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosPotreros.map((estado) => (
                        <SelectItem key={estado.codigo} value={estado.codigo}>{estado.nombre}</SelectItem>
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
              <Input type="number" step="0.01" {...form.register("area_hectareas")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacidad animales</label>
              <Input type="number" {...form.register("capacidad_animales")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              {...form.register("notas")}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar potrero">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleEdit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...form.register("nombre")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Finca</label>
              <Controller
                name="id_finca"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ninguna</SelectItem>
                      {fincas.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
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
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosPotreros.map((estado) => (
                        <SelectItem key={estado.codigo} value={estado.codigo}>{estado.nombre}</SelectItem>
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
              <Input type="number" step="0.01" {...form.register("area_hectareas")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacidad animales</label>
              <Input type="number" {...form.register("capacidad_animales")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              {...form.register("notas")}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar potrero" description={`¿Eliminar "${selected?.nombre}"?`} loading={submitting} />
    </div>
  );
}

// ========== LOTES TAB ==========
function LotesTab({ fincas }: { fincas: Finca[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "potreros.create");
  const canEdit = hasPermission(session, "potreros.edit");
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
    form.reset({ nombre: "" });
    setCreateOpen(true);
  };

  const openDelete = (l: Lote) => {
    setSelected(l);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: LoteForm) => {
    setSubmitting(true);
    try {
      const created = await createLote(values);
      setLotes((prev) => [created, ...prev]);
      toast.success("Lote creado");
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
    { key: "proposito", header: "Propósito", render: (l) => l.proposito ?? "—" },
    { key: "cantidad", header: "Animales", render: (l) => l.cantidad_animales ?? "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) =>
        canDelete ? (
          <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(l), variant: "danger" }]} />
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
      <DataTable columns={columns} data={lotes} keyExtractor={(l) => l.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin lotes" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo lote">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...form.register("nombre")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Finca</label>
            <Controller
              name="finca_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguna</SelectItem>
                    {fincas.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Propósito</label>
            <Input {...form.register("proposito")} placeholder="Ej: Cría, Engorde" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar lote" description={`¿Eliminar "${selected?.nombre}"?`} loading={submitting} />
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
      await deleteOcupacion(selected.id);
      setOcupaciones((prev) => prev.filter((o) => o.id !== selected.id));
      toast.success("Ocupación eliminada");
      setDeleteOpen(false);
    } catch {
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
    { key: "fin", header: "Fin", render: (o) => (o.fecha_fin ? formatDate(o.fecha_fin) : <Badge variant="success">Activa</Badge>) },
    { key: "cantidad", header: "Animales", render: (o) => o.cantidad_animales ?? "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (o) =>
        canDelete ? (
          <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(o), variant: "danger" }]} />
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
      <DataTable columns={columns} data={ocupaciones} keyExtractor={(o) => o.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin ocupaciones" }} />
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
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
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
                <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? undefined : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguno</SelectItem>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha inicio *</label>
              <Input type="date" {...form.register("fecha_inicio")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha fin</label>
              <Input type="date" {...form.register("fecha_fin")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad animales</label>
            <Input type="number" {...form.register("cantidad_animales")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar ocupación" loading={submitting} />
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
    fetchFincas({ limit: 100 }).then((r) => setFincas(r.items ?? [])).catch(() => { });
    fetchPotreros({ limit: 100 }).then((r) => setPotreros(r.items ?? [])).catch(() => { });
    fetchLotes({ limit: 100 }).then((r) => setLotes(r.items ?? [])).catch(() => { });
  }, []);

  if (!canView) {
    return <NoPermission />;
  }

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
            <Tabs tabs={tabs} defaultTab="potreros" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
