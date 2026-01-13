"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Plus, Stethoscope, Trash2 } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import NoPermission from "@/components/no-permission";

import {
  fetchEventosSanitarios,
  createEventoSanitario,
  deleteEventoSanitario,
  fetchRetirosSanitarios,
  createRetiroSanitario,
  deleteRetiroSanitario,
  fetchAlertasSalud,
} from "@/lib/api/salud.service";
import { fetchAnimales } from "@/lib/api/animales.service";
import type { EventoSanitario, RetiroSanitario, AlertaSalud, Animal } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const eventoSchema = z.object({
  animal_id: z.string().min(1, "Selecciona un animal"),
  tipo: z.string().min(1, "Selecciona un tipo"),
  fecha: z.string().min(1, "Ingresa la fecha"),
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  medicamentos: z.string().optional(),
  notas: z.string().optional(),
});

const retiroSchema = z.object({
  animal_id: z.string().min(1, "Selecciona un animal"),
  motivo: z.string().min(1, "Ingresa el motivo"),
  tipo: z.enum(["carne", "leche", "ambos"]),
  fecha_inicio: z.string().min(1, "Ingresa fecha inicio"),
  fecha_fin: z.string().min(1, "Ingresa fecha fin"),
  dias_retiro: z.number().min(1, "Ingresa días de retiro"),
  medicamento: z.string().optional(),
});

type EventoForm = z.infer<typeof eventoSchema>;
type RetiroForm = {
  animal_id: string;
  motivo: string;
  tipo: "carne" | "leche" | "ambos";
  fecha_inicio: string;
  fecha_fin: string;
  dias_retiro: number;
  medicamento?: string;
};

const tipoEventoOptions = [
  { value: "vacunacion", label: "Vacunación" },
  { value: "desparasitacion", label: "Desparasitación" },
  { value: "tratamiento", label: "Tratamiento" },
  { value: "revision", label: "Revisión" },
  { value: "cirugia", label: "Cirugía" },
];

const tipoRetiroOptions = [
  { value: "carne", label: "Carne" },
  { value: "leche", label: "Leche" },
  { value: "ambos", label: "Ambos" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function AlertasPanel({ alertas }: { alertas: AlertaSalud[] }) {
  if (!alertas.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {alertas.slice(0, 6).map((a) => (
        <Card
          key={a.id}
          className={`border-l-4 ${a.prioridad === "alta"
              ? "border-l-red-500"
              : a.prioridad === "media"
                ? "border-l-amber-500"
                : "border-l-blue-500"
            }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`h-5 w-5 ${a.prioridad === "alta" ? "text-red-500" : a.prioridad === "media" ? "text-amber-500" : "text-blue-500"
                  }`}
              />
              <div>
                <p className="font-medium text-foreground">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.descripcion}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventosTab({ animales }: { animales: Animal[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "salud.create");
  const canDelete = hasPermission(session, "salud.delete");

  const [eventos, setEventos] = useState<EventoSanitario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tipoFilter, setTipoFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EventoSanitario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { animal_id: "", tipo: "", fecha: new Date().toISOString().split("T")[0] },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchEventosSanitarios({ page, limit: 10, tipo: tipoFilter || undefined });
      setEventos(res.items ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, tipoFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    form.reset({ animal_id: "", tipo: "", fecha: new Date().toISOString().split("T")[0] });
    setCreateOpen(true);
  };

  const openDelete = (e: EventoSanitario) => {
    setSelected(e);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: EventoForm) => {
    setSubmitting(true);
    try {
      const created = await createEventoSanitario(values);
      setEventos((prev) => [created, ...prev]);
      toast.success("Evento registrado");
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
      await deleteEventoSanitario(selected.id);
      setEventos((prev) => prev.filter((e) => e.id !== selected.id));
      toast.success("Evento eliminado");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<EventoSanitario>[] = [
    { key: "fecha", header: "Fecha", render: (e) => formatDate(e.fecha) },
    { key: "animal", header: "Animal", render: (e) => <span className="font-medium">{e.animal_nombre || e.animal_codigo || "—"}</span> },
    { key: "tipo", header: "Tipo", render: (e) => <Badge variant="muted">{e.tipo}</Badge> },
    { key: "diagnostico", header: "Diagnóstico", render: (e) => e.diagnostico ?? "—" },
    { key: "tratamiento", header: "Tratamiento", render: (e) => e.tratamiento ?? "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (e) =>
        canDelete ? <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(e), variant: "danger" }]} /> : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <FiltersBar>
          <SelectFilter value={tipoFilter} onChange={setTipoFilter} options={tipoEventoOptions} placeholder="Tipo" />
        </FiltersBar>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo evento
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={eventos} keyExtractor={(e) => e.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin eventos" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo evento sanitario">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Animal *</label>
            <Controller
              name="animal_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {animales.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre || a.codigo || a.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.animal_id && (
              <p className="text-sm text-red-500">{form.formState.errors.animal_id.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Controller
                name="tipo"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoEventoOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.tipo && (
                <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
              )}
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
                <p className="text-sm text-red-500">{form.formState.errors.fecha.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Diagnóstico</label>
            <Input {...form.register("diagnostico")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tratamiento</label>
            <Input {...form.register("tratamiento")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar evento" loading={submitting} />
    </div>
  );
}

function RetirosTab({ animales }: { animales: Animal[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "salud.create");
  const canDelete = hasPermission(session, "salud.delete");

  const [retiros, setRetiros] = useState<RetiroSanitario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<RetiroSanitario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RetiroForm>({
    resolver: zodResolver(retiroSchema),
    defaultValues: { animal_id: "", motivo: "", tipo: "carne", fecha_inicio: "", fecha_fin: "", dias_retiro: 7, medicamento: "" },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchRetirosSanitarios({ page, limit: 10 });
      setRetiros(res.items ?? []);
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
    form.reset({ animal_id: "", motivo: "", tipo: "carne", fecha_inicio: new Date().toISOString().split("T")[0], fecha_fin: "", dias_retiro: 7 });
    setCreateOpen(true);
  };

  const openDelete = (r: RetiroSanitario) => {
    setSelected(r);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: RetiroForm) => {
    setSubmitting(true);
    try {
      const created = await createRetiroSanitario(values);
      setRetiros((prev) => [created, ...prev]);
      toast.success("Retiro registrado");
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
      await deleteRetiroSanitario(selected.id);
      setRetiros((prev) => prev.filter((r) => r.id !== selected.id));
      toast.success("Retiro eliminado");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<RetiroSanitario>[] = [
    { key: "animal", header: "Animal", render: (r) => <span className="font-medium">{r.animal_nombre || r.animal_codigo || "—"}</span> },
    { key: "motivo", header: "Motivo", render: (r) => r.motivo },
    { key: "tipo", header: "Tipo", render: (r) => <Badge variant="warning">{r.tipo}</Badge> },
    { key: "inicio", header: "Inicio", render: (r) => formatDate(r.fecha_inicio) },
    { key: "fin", header: "Fin", render: (r) => formatDate(r.fecha_fin) },
    { key: "activo", header: "Estado", render: (r) => r.activo ? <Badge variant="danger">Activo</Badge> : <Badge variant="muted">Finalizado</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        canDelete ? <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(r), variant: "danger" }]} /> : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo retiro
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={retiros} keyExtractor={(r) => r.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin retiros" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo retiro sanitario">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Animal *</label>
            <Controller
              name="animal_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {animales.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre || a.codigo || a.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.animal_id && (
              <p className="text-sm text-red-500">{form.formState.errors.animal_id.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo *</label>
            <Input {...form.register("motivo")} placeholder="Ej: Antibiótico" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Controller
                name="tipo"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoRetiroOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.tipo && (
                <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Días *</label>
              <Input type="number" {...form.register("dias_retiro", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Medicamento</label>
              <Input {...form.register("medicamento")} />
            </div>
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
                <p className="text-sm text-red-500">{form.formState.errors.fecha_inicio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha fin *</label>
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
                <p className="text-sm text-red-500">{form.formState.errors.fecha_fin.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar retiro" loading={submitting} />
    </div>
  );
}

export default function SaludPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "salud.view");

  const [alertas, setAlertas] = useState<AlertaSalud[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);

  useEffect(() => {
    fetchAlertasSalud().then(setAlertas).catch(() => setAlertas([]));
    fetchAnimales({ limit: 100, estado: "activo" }).then((r) => setAnimales(r.items ?? [])).catch(() => { });
  }, []);

  if (!canView) {
    return <NoPermission />;
  }

  const tabs = [
    { id: "eventos", label: "Eventos", content: <EventosTab animales={animales} /> },
    { id: "retiros", label: "Retiros", content: <RetirosTab animales={animales} /> },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Bienestar animal"
          title="Salud"
          description="Gestiona eventos sanitarios y retiros."
        />

        {alertas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Alertas activas</h3>
            <AlertasPanel alertas={alertas} />
          </div>
        )}

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <Tabs tabs={tabs} defaultTab="eventos" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
