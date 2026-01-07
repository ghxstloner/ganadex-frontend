"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import NoPermission from "@/components/no-permission";

import {
  fetchEventosReproductivos,
  createEventoReproductivo,
  deleteEventoReproductivo,
  fetchSemaforo,
} from "@/lib/api/reproduccion.service";
import { fetchAnimales } from "@/lib/api/animales.service";
import type { EventoReproductivo, SemaforoRow, Animal } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const eventoSchema = z.object({
  animal_id: z.string().min(1, "Selecciona un animal"),
  tipo: z.string().min(1, "Selecciona un tipo"),
  fecha: z.string().min(1, "Ingresa la fecha"),
  resultado: z.string().optional(),
  notas: z.string().optional(),
});

type EventoForm = z.infer<typeof eventoSchema>;

const tipoEventoOptions = [
  { value: "celo", label: "Celo" },
  { value: "inseminacion", label: "Inseminación" },
  { value: "monta", label: "Monta" },
  { value: "palpacion", label: "Palpación" },
  { value: "parto", label: "Parto" },
  { value: "aborto", label: "Aborto" },
  { value: "secado", label: "Secado" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function getSemaforoBadgeVariant(estado: string): "success" | "warning" | "danger" {
  switch (estado) {
    case "verde":
      return "success";
    case "amarillo":
      return "warning";
    case "rojo":
      return "danger";
    default:
      return "warning";
  }
}

function SemaforoTab() {
  const [data, setData] = useState<SemaforoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchSemaforo({ page, limit: 10, estado: estadoFilter || undefined });
      setData(res.items ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: DataTableColumn<SemaforoRow>[] = [
    { key: "animal", header: "Animal", render: (r) => <span className="font-medium">{r.animal_nombre || r.animal_codigo || "—"}</span> },
    {
      key: "estado",
      header: "Estado",
      render: (r) => (
        <Badge variant={getSemaforoBadgeVariant(r.estado)}>
          {r.estado === "verde" ? "OK" : r.estado === "amarillo" ? "Atención" : "Crítico"}
        </Badge>
      ),
    },
    { key: "dias", header: "Días abiertos", render: (r) => r.dias_abiertos ?? "—" },
    { key: "ultimo", header: "Último evento", render: (r) => r.ultimo_evento ?? "—" },
    { key: "fecha", header: "Fecha", render: (r) => (r.fecha_ultimo_evento ? formatDate(r.fecha_ultimo_evento) : "—") },
    { key: "proxima", header: "Próxima acción", render: (r) => r.proxima_accion ?? "—" },
  ];

  const estadoOptions = [
    { value: "verde", label: "Verde (OK)" },
    { value: "amarillo", label: "Amarillo (Atención)" },
    { value: "rojo", label: "Rojo (Crítico)" },
  ];

  return (
    <div className="space-y-4">
      <FiltersBar>
        <SelectFilter value={estadoFilter} onChange={setEstadoFilter} options={estadoOptions} placeholder="Estado" />
      </FiltersBar>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.animal_id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin datos de semáforo" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function EventosTab({ animales }: { animales: Animal[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "reproduccion.create");
  const canDelete = hasPermission(session, "reproduccion.delete");

  const [eventos, setEventos] = useState<EventoReproductivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tipoFilter, setTipoFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EventoReproductivo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { animal_id: "", tipo: "", fecha: new Date().toISOString().split("T")[0] },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchEventosReproductivos({ page, limit: 10, tipo: tipoFilter || undefined });
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

  const openDelete = (e: EventoReproductivo) => {
    setSelected(e);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: EventoForm) => {
    setSubmitting(true);
    try {
      const created = await createEventoReproductivo(values);
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
      await deleteEventoReproductivo(selected.id);
      setEventos((prev) => prev.filter((e) => e.id !== selected.id));
      toast.success("Evento eliminado");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<EventoReproductivo>[] = [
    { key: "fecha", header: "Fecha", render: (e) => formatDate(e.fecha) },
    { key: "animal", header: "Animal", render: (e) => <span className="font-medium">{e.animal_nombre || e.animal_codigo || "—"}</span> },
    { key: "tipo", header: "Tipo", render: (e) => <Badge variant="default">{e.tipo}</Badge> },
    { key: "resultado", header: "Resultado", render: (e) => e.resultado ?? "—" },
    { key: "notas", header: "Notas", render: (e) => e.notas ?? "—" },
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo evento reproductivo">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Animal *</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" {...form.register("animal_id")}>
              <option value="">Seleccionar</option>
              {animales.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre || a.codigo || a.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" {...form.register("tipo")}>
                <option value="">Seleccionar</option>
                {tipoEventoOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha *</label>
              <Input type="date" {...form.register("fecha")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Resultado</label>
            <Input {...form.register("resultado")} placeholder="Ej: Positivo, Negativo" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <Input {...form.register("notas")} />
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

export default function ReproduccionPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "reproduccion.view");

  const [animales, setAnimales] = useState<Animal[]>([]);

  useEffect(() => {
    fetchAnimales({ limit: 100, sexo: "hembra", estado: "activo" }).then((r) => setAnimales(r.items ?? [])).catch(() => { });
  }, []);

  if (!canView) {
    return <NoPermission />;
  }

  const tabs = [
    { id: "semaforo", label: "Semáforo", content: <SemaforoTab /> },
    { id: "eventos", label: "Eventos", content: <EventosTab animales={animales} /> },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Ciclo reproductivo"
          title="Reproducción"
          description="Monitorea el estado reproductivo y registra eventos."
        />
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <Tabs tabs={tabs} defaultTab="semaforo" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
