"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import NoPermission from "@/components/no-permission";

import {
  fetchLotes,
  createLote,
  deleteLote,
} from "@/lib/api/lotes.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import type { Lote, Finca } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const loteSchema = z.object({
  id_finca: z.string().min(1, "Selecciona una finca"),
  nombre: z.string().min(1, "Ingresa el nombre"),
  descripcion: z.string().optional(),
  activo: z.boolean(),
});

type LoteForm = z.infer<typeof loteSchema>;

export default function LotesPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "animales.view");
  const canCreate = hasPermission(session, "animales.create");
  const canDelete = hasPermission(session, "animales.delete");

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
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
    defaultValues: {
      id_finca: "",
      nombre: "",
      descripcion: "",
      activo: true,
    },
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

  const loadFincas = useCallback(async () => {
    try {
      const res = await fetchFincas({ limit: 100 });
      setFincas(res.items ?? []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadData();
    loadFincas();
  }, [loadData, loadFincas]);

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
        activo: values.activo,
      });
      toast.success("Lote creado");
      setCreateOpen(false);
      await loadData();
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
      toast.success("Lote eliminado");
      setDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar lote");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<Lote>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (l) => <span className="font-medium">{l.nombre}</span>,
    },
    {
      key: "finca",
      header: "Finca",
      render: (l) => l.finca_nombre ?? "—",
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (l) => l.descripcion ?? "—",
    },
    {
      key: "estado",
      header: "Estado",
      render: (l) =>
        l.activo ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="muted">Inactivo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (l) =>
        canDelete ? (
          <DropdownMenu
            items={[
              {
                label: "Eliminar",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => openDelete(l),
                variant: "danger" as const,
              },
            ]}
          />
        ) : null,
    },
  ];

  if (!canView) return <NoPermission />;

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          title="Lotes"
          description="Gestiona los lotes de animales"
        />

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                {canCreate && (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo lote
                  </Button>
                )}
              </div>

              <div className="rounded-md border overflow-hidden">
                <DataTable
                  columns={columns}
                  data={lotes}
                  keyExtractor={(l) => l.id}
                  loading={loading}
                  error={error}
                  onRetry={loadData}
                  emptyState={{ title: "Sin lotes" }}
                />
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo lote">
          <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input {...form.register("nombre")} />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
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


            <div className="flex justify-end gap-2 pt-4 border-t">
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
          title="Eliminar lote"
          description={`¿Eliminar "${selected?.nombre}"?`}
          loading={submitting}
        />
      </div>
    </MotionFadeSlide>
  );
}
