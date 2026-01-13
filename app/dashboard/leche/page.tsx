"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Droplet, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard } from "@/components/ui/metric-cards";
import { MotionFadeSlide } from "@/components/ui/animate";
import { DatePicker } from "@/components/ui/date-picker";
import NoPermission from "@/components/no-permission";

import {
  fetchEntregasLeche,
  createEntregaLeche,
  deleteEntregaLeche,
  fetchLiquidacionesLeche,
  createLiquidacionLeche,
  deleteLiquidacionLeche,
  fetchConciliacionLeche,
} from "@/lib/api/leche.service";
import type { EntregaLeche, LiquidacionLeche, ConciliacionLeche } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const entregaSchema = z.object({
  fecha: z.string().min(1, "Ingresa la fecha"),
  cantidad_litros: z.any(),
  calidad: z.string().optional(),
  temperatura: z.any().optional(),
  precio_litro: z.any().optional(),
});

const liquidacionSchema = z.object({
  periodo_inicio: z.string().min(1, "Ingresa fecha inicio"),
  periodo_fin: z.string().min(1, "Ingresa fecha fin"),
  total_litros: z.any(),
  precio_promedio: z.any(),
  total_pagar: z.any(),
});

type EntregaForm = z.infer<typeof entregaSchema>;
type LiquidacionForm = z.infer<typeof liquidacionSchema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function EntregasTab() {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "leche.create");
  const canDelete = hasPermission(session, "leche.delete");

  const [entregas, setEntregas] = useState<EntregaLeche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EntregaLeche | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EntregaForm>({
    resolver: zodResolver(entregaSchema),
    defaultValues: { fecha: new Date().toISOString().split("T")[0], cantidad_litros: 0 },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchEntregasLeche({ page, limit: 10 });
      setEntregas(res.items ?? []);
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
    form.reset({ fecha: new Date().toISOString().split("T")[0], cantidad_litros: 0 });
    setCreateOpen(true);
  };

  const openDelete = (e: EntregaLeche) => {
    setSelected(e);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: EntregaForm) => {
    setSubmitting(true);
    try {
      const created = await createEntregaLeche(values);
      setEntregas((prev) => [created, ...prev]);
      toast.success("Entrega registrada");
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
      await deleteEntregaLeche(selected.id);
      setEntregas((prev) => prev.filter((e) => e.id !== selected.id));
      toast.success("Entrega eliminada");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<EntregaLeche>[] = [
    { key: "fecha", header: "Fecha", render: (e) => formatDate(e.fecha) },
    { key: "cantidad", header: "Litros", render: (e) => <span className="font-medium">{e.cantidad_litros.toLocaleString()}</span> },
    { key: "calidad", header: "Calidad", render: (e) => e.calidad ?? "—" },
    { key: "temp", header: "Temp (°C)", render: (e) => e.temperatura ?? "—" },
    { key: "precio", header: "Precio/L", render: (e) => (e.precio_litro ? formatCurrency(e.precio_litro) : "—") },
    { key: "total", header: "Total", render: (e) => (e.total ? formatCurrency(e.total) : "—") },
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
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva entrega
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={entregas} keyExtractor={(e) => e.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin entregas" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva entrega">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Litros *</label>
              <Input type="number" step="0.1" {...form.register("cantidad_litros")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calidad</label>
              <Input {...form.register("calidad")} placeholder="Ej: A, B" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperatura (°C)</label>
              <Input type="number" step="0.1" {...form.register("temperatura")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Precio por litro</label>
            <Input type="number" step="1" {...form.register("precio_litro")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar entrega" loading={submitting} />
    </div>
  );
}

function LiquidacionesTab() {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "leche.create");
  const canDelete = hasPermission(session, "leche.delete");

  const [liquidaciones, setLiquidaciones] = useState<LiquidacionLeche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LiquidacionLeche | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LiquidacionForm>({
    resolver: zodResolver(liquidacionSchema),
    defaultValues: { periodo_inicio: "", periodo_fin: "", total_litros: 0, precio_promedio: 0, total_pagar: 0 },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchLiquidacionesLeche({ page, limit: 10 });
      setLiquidaciones(res.items ?? []);
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
    form.reset({ periodo_inicio: "", periodo_fin: "", total_litros: 0, precio_promedio: 0, total_pagar: 0 });
    setCreateOpen(true);
  };

  const openDelete = (l: LiquidacionLeche) => {
    setSelected(l);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: LiquidacionForm) => {
    setSubmitting(true);
    try {
      const created = await createLiquidacionLeche(values);
      setLiquidaciones((prev) => [created, ...prev]);
      toast.success("Liquidación creada");
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
      await deleteLiquidacionLeche(selected.id);
      setLiquidaciones((prev) => prev.filter((l) => l.id !== selected.id));
      toast.success("Liquidación eliminada");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagada":
        return <Badge variant="success">Pagada</Badge>;
      case "anulada":
        return <Badge variant="danger">Anulada</Badge>;
      default:
        return <Badge variant="warning">Pendiente</Badge>;
    }
  };

  const columns: DataTableColumn<LiquidacionLeche>[] = [
    { key: "periodo", header: "Período", render: (l) => `${formatDate(l.periodo_inicio)} - ${formatDate(l.periodo_fin)}` },
    { key: "litros", header: "Litros", render: (l) => l.total_litros.toLocaleString() },
    { key: "precio", header: "Precio prom.", render: (l) => formatCurrency(l.precio_promedio) },
    { key: "total", header: "Total", render: (l) => <span className="font-medium">{formatCurrency(l.total_pagar)}</span> },
    { key: "estado", header: "Estado", render: (l) => getEstadoBadge(l.estado) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) =>
        canDelete ? <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(l), variant: "danger" }]} /> : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva liquidación
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={liquidaciones} keyExtractor={(l) => l.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin liquidaciones" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva liquidación">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Inicio *</label>
              <Controller
                name="periodo_inicio"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha inicio"
                  />
                )}
              />
              {form.formState.errors.periodo_inicio && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.periodo_inicio.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fin *</label>
              <Controller
                name="periodo_fin"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha fin"
                  />
                )}
              />
              {form.formState.errors.periodo_fin && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.periodo_fin.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Litros</label>
              <Input type="number" step="0.1" {...form.register("total_litros")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio prom.</label>
              <Input type="number" step="1" {...form.register("precio_promedio")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total</label>
              <Input type="number" step="1" {...form.register("total_pagar")} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar liquidación" loading={submitting} />
    </div>
  );
}

function ConciliacionTab() {
  const [periodo, setPeriodo] = useState({
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });
  const [data, setData] = useState<ConciliacionLeche | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchConciliacionLeche({ periodo_inicio: periodo.inicio, periodo_fin: periodo.fin });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <DatePicker value={periodo.inicio} onChange={(date) => setPeriodo((p) => ({ ...p, inicio: date }))} placeholder="Desde" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <DatePicker value={periodo.fin} onChange={(date) => setPeriodo((p) => ({ ...p, fin: date }))} placeholder="Hasta" />
        </div>
        <Button onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
        </Button>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total entregas" value={data.total_entregas} icon={<Droplet className="h-5 w-5" />} />
          <MetricCard label="Litros entregados" value={data.total_litros_entregados.toLocaleString()} />
          <MetricCard label="Litros liquidados" value={data.total_litros_liquidados.toLocaleString()} />
          <MetricCard
            label="Diferencia litros"
            value={data.diferencia_litros.toLocaleString()}
            trend={{
              value: data.diferencia_litros >= 0 ? "Favorable" : "Desfavorable",
              positive: data.diferencia_litros >= 0,
            }}
          />
        </div>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total facturado" value={formatCurrency(data.total_facturado)} />
          <MetricCard label="Total pagado" value={formatCurrency(data.total_pagado)} />
          <MetricCard
            label="Diferencia valor"
            value={formatCurrency(Math.abs(data.diferencia_valor))}
            trend={{
              value: data.diferencia_valor >= 0 ? "A favor" : "En contra",
              positive: data.diferencia_valor >= 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function LechePage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "leche.view");

  if (!canView) {
    return <NoPermission />;
  }

  const tabs = [
    { id: "entregas", label: "Entregas", content: <EntregasTab /> },
    { id: "liquidaciones", label: "Liquidaciones", content: <LiquidacionesTab /> },
    { id: "conciliacion", label: "Conciliación", content: <ConciliacionTab /> },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Producción"
          title="Leche"
          description="Gestiona entregas, liquidaciones y conciliación."
        />
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <Tabs tabs={tabs} defaultTab="entregas" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
