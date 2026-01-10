"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
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
import { MetricCard } from "@/components/ui/metric-cards";
import { MotionFadeSlide } from "@/components/ui/animate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NoPermission from "@/components/no-permission";

import {
  fetchTransacciones,
  createTransaccion,
  deleteTransaccion,
  fetchCategorias,
  createCategoria,
  deleteCategoria,
  fetchMonedas,
} from "@/lib/api/finanzas.service";
import type { TransaccionFinanciera, CategoriaFinanciera, Moneda } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const transaccionSchema = z.object({
  tipo: z.enum(["ingreso", "gasto"]),
  categoria_id: z.string().optional(),
  descripcion: z.string().min(1, "Ingresa descripción"),
  monto: z.any(),
  fecha: z.string().min(1, "Ingresa fecha"),
  referencia: z.string().optional(),
  notas: z.string().optional(),
});

const categoriaSchema = z.object({
  nombre: z.string().min(1, "Ingresa nombre"),
  tipo: z.enum(["ingreso", "gasto"]),
  descripcion: z.string().optional(),
  color: z.string().optional(),
});

type TransaccionForm = z.infer<typeof transaccionSchema>;
type CategoriaForm = z.infer<typeof categoriaSchema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function TransaccionesTab({ categorias }: { categorias: CategoriaFinanciera[] }) {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "finanzas.create");
  const canDelete = hasPermission(session, "finanzas.delete");

  const [transacciones, setTransacciones] = useState<TransaccionFinanciera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tipoFilter, setTipoFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TransaccionFinanciera | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TransaccionForm>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: { tipo: "ingreso", descripcion: "", monto: 0, fecha: new Date().toISOString().split("T")[0] },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const ingresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((sum, t) => sum + t.monto, 0);
    const gastos = transacciones.filter((t) => t.tipo === "gasto").reduce((sum, t) => sum + t.monto, 0);
    return { ingresos, gastos, balance: ingresos - gastos };
  }, [transacciones]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchTransacciones({ page, limit: 10, tipo: tipoFilter || undefined });
      setTransacciones(res.items ?? []);
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
    form.reset({ tipo: "ingreso", descripcion: "", monto: 0, fecha: new Date().toISOString().split("T")[0] });
    setCreateOpen(true);
  };

  const openDelete = (t: TransaccionFinanciera) => {
    setSelected(t);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: TransaccionForm) => {
    setSubmitting(true);
    try {
      const created = await createTransaccion(values);
      setTransacciones((prev) => [created, ...prev]);
      toast.success("Transacción registrada");
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
      await deleteTransaccion(selected.id);
      setTransacciones((prev) => prev.filter((t) => t.id !== selected.id));
      toast.success("Transacción eliminada");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const tipoOptions = [
    { value: "ingreso", label: "Ingresos" },
    { value: "gasto", label: "Gastos" },
  ];

  const columns: DataTableColumn<TransaccionFinanciera>[] = [
    { key: "fecha", header: "Fecha", render: (t) => formatDate(t.fecha) },
    {
      key: "tipo",
      header: "Tipo",
      render: (t) => (
        <Badge variant={t.tipo === "ingreso" ? "success" : "danger"}>
          {t.tipo === "ingreso" ? "Ingreso" : "Gasto"}
        </Badge>
      ),
    },
    { key: "descripcion", header: "Descripción", render: (t) => <span className="font-medium">{t.descripcion}</span> },
    { key: "categoria", header: "Categoría", render: (t) => t.categoria_nombre ?? "—" },
    {
      key: "monto",
      header: "Monto",
      render: (t) => (
        <span className={t.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}>
          {t.tipo === "ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) =>
        canDelete ? <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(t), variant: "danger" }]} /> : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Ingresos" value={formatCurrency(totals.ingresos)} icon={<ArrowUpCircle className="h-5 w-5" />} />
        <MetricCard label="Gastos" value={formatCurrency(totals.gastos)} icon={<ArrowDownCircle className="h-5 w-5" />} />
        <MetricCard
          label="Balance"
          value={formatCurrency(Math.abs(totals.balance))}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: totals.balance >= 0 ? "Positivo" : "Negativo", positive: totals.balance >= 0 }}
        />
      </div>

      <div className="flex justify-between gap-3">
        <FiltersBar>
          <SelectFilter value={tipoFilter} onChange={setTipoFilter} options={tipoOptions} placeholder="Tipo" />
        </FiltersBar>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva transacción
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={transacciones} keyExtractor={(t) => t.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin transacciones" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva transacción">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
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
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="gasto">Gasto</SelectItem>
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
              <Input type="date" {...form.register("fecha")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción *</label>
            <Input {...form.register("descripcion")} placeholder="Ej: Venta de ganado" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto *</label>
              <Input type="number" step="1" {...form.register("monto")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Controller
                name="categoria_id"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Referencia</label>
            <Input {...form.register("referencia")} placeholder="Nro. factura, recibo, etc." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar transacción" loading={submitting} />
    </div>
  );
}

function CategoriasTab() {
  const session = getStoredSession();
  const canCreate = hasPermission(session, "finanzas.create");
  const canDelete = hasPermission(session, "finanzas.delete");

  const [categorias, setCategorias] = useState<CategoriaFinanciera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CategoriaFinanciera | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: "", tipo: "ingreso" },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchCategorias({ page, limit: 10 });
      setCategorias(res.items ?? []);
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
    form.reset({ nombre: "", tipo: "ingreso" });
    setCreateOpen(true);
  };

  const openDelete = (c: CategoriaFinanciera) => {
    setSelected(c);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: CategoriaForm) => {
    setSubmitting(true);
    try {
      const created = await createCategoria(values);
      setCategorias((prev) => [created, ...prev]);
      toast.success("Categoría creada");
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
      await deleteCategoria(selected.id);
      setCategorias((prev) => prev.filter((c) => c.id !== selected.id));
      toast.success("Categoría eliminada");
      setDeleteOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<CategoriaFinanciera>[] = [
    { key: "nombre", header: "Nombre", render: (c) => <span className="font-medium">{c.nombre}</span> },
    {
      key: "tipo",
      header: "Tipo",
      render: (c) => <Badge variant={c.tipo === "ingreso" ? "success" : "danger"}>{c.tipo}</Badge>,
    },
    { key: "descripcion", header: "Descripción", render: (c) => c.descripcion ?? "—" },
    { key: "global", header: "Global", render: (c) => (c.es_global ? <Badge variant="info">Sí</Badge> : "No") },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) =>
        canDelete && !c.es_global ? <DropdownMenu items={[{ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(c), variant: "danger" }]} /> : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={categorias} keyExtractor={(c) => c.id} loading={loading} error={error} onRetry={loadData} emptyState={{ title: "Sin categorías" }} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva categoría">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...form.register("nombre")} />
          </div>
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
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.tipo && (
              <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input {...form.register("descripcion")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Eliminar categoría" description={`¿Eliminar "${selected?.nombre}"?`} loading={submitting} />
    </div>
  );
}

export default function FinanzasPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "finanzas.view");

  const [categorias, setCategorias] = useState<CategoriaFinanciera[]>([]);

  useEffect(() => {
    fetchCategorias({ limit: 100 }).then((r) => setCategorias(r.items ?? [])).catch(() => { });
  }, []);

  if (!canView) {
    return <NoPermission />;
  }

  const tabs = [
    { id: "transacciones", label: "Transacciones", content: <TransaccionesTab categorias={categorias} /> },
    { id: "categorias", label: "Categorías", content: <CategoriasTab /> },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Contabilidad"
          title="Finanzas"
          description="Gestiona ingresos, gastos y categorías."
        />
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <Tabs tabs={tabs} defaultTab="transacciones" />
          </CardContent>
        </Card>
      </div>
    </MotionFadeSlide>
  );
}
