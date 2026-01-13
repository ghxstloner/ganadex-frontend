"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import NoPermission from "@/components/no-permission";

import {
    fetchAuditorias,
    createAuditoria,
    deleteAuditoria,
} from "@/lib/api/auditorias.service";
import type { Auditoria } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const auditoriaSchema = z.object({
    tipo: z.string().min(1, "Selecciona un tipo"),
    titulo: z.string().min(1, "Ingresa el título"),
    descripcion: z.string().optional(),
    fecha: z.string().min(1, "Ingresa la fecha"),
    auditor: z.string().optional(),
    notas: z.string().optional(),
});

type AuditoriaForm = z.infer<typeof auditoriaSchema>;

const tipoOptions = [
    { value: "interna", label: "Interna" },
    { value: "externa", label: "Externa" },
    { value: "certificacion", label: "Certificación" },
    { value: "seguimiento", label: "Seguimiento" },
];

const estadoOptions = [
    { value: "pendiente", label: "Pendiente" },
    { value: "en_progreso", label: "En progreso" },
    { value: "completada", label: "Completada" },
    { value: "cancelada", label: "Cancelada" },
];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function getEstadoBadgeVariant(estado: string): "success" | "warning" | "danger" | "muted" | "info" {
    switch (estado) {
        case "completada":
            return "success";
        case "en_progreso":
            return "info";
        case "pendiente":
            return "warning";
        case "cancelada":
            return "danger";
        default:
            return "muted";
    }
}

export default function AuditoriasPage() {
    const session = getStoredSession();
    const canView = hasPermission(session, "auditorias.view");
    const canCreate = hasPermission(session, "auditorias.create");

    const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [tipoFilter, setTipoFilter] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Auditoria | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<AuditoriaForm>({
        resolver: zodResolver(auditoriaSchema),
        defaultValues: { tipo: "", titulo: "", fecha: new Date().toISOString().split("T")[0] },
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetchAuditorias({
                page,
                limit: 10,
                tipo: tipoFilter || undefined,
                estado: estadoFilter || undefined,
            });
            setAuditorias(res.items ?? []);
            setTotalPages(res.meta?.totalPages ?? 1);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [page, tipoFilter, estadoFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openCreate = () => {
        form.reset({ tipo: "", titulo: "", fecha: new Date().toISOString().split("T")[0] });
        setCreateOpen(true);
    };

    const openDelete = (a: Auditoria) => {
        setSelected(a);
        setDeleteOpen(true);
    };

    const handleCreate = async (values: AuditoriaForm) => {
        setSubmitting(true);
        try {
            const created = await createAuditoria(values);
            setAuditorias((prev) => [created, ...prev]);
            toast.success("Auditoría creada");
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
            await deleteAuditoria(selected.id);
            setAuditorias((prev) => prev.filter((a) => a.id !== selected.id));
            toast.success("Auditoría eliminada");
            setDeleteOpen(false);
        } catch {
        } finally {
            setSubmitting(false);
        }
    };

    const clearFilters = () => {
        setTipoFilter("");
        setEstadoFilter("");
        setPage(1);
    };

    const hasFilters = tipoFilter || estadoFilter;

    const columns: DataTableColumn<Auditoria>[] = [
        { key: "fecha", header: "Fecha", render: (a) => formatDate(a.fecha) },
        { key: "titulo", header: "Título", render: (a) => <span className="font-medium">{a.titulo}</span> },
        { key: "tipo", header: "Tipo", render: (a) => <Badge variant="muted">{a.tipo}</Badge> },
        {
            key: "estado",
            header: "Estado",
            render: (a) => <Badge variant={getEstadoBadgeVariant(a.estado)}>{a.estado.replace("_", " ")}</Badge>,
        },
        { key: "auditor", header: "Auditor", render: (a) => a.auditor ?? "—" },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (a) => (
                <DropdownMenu
                    items={[
                        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => openDelete(a), variant: "danger" },
                    ]}
                />
            ),
        },
    ];

    if (!canView) {
        return <NoPermission />;
    }

    return (
        <MotionFadeSlide>
            <div className="space-y-6">
                <PageHeader
                    subtitle="Cumplimiento"
                    title="Auditorías"
                    description="Gestiona auditorías internas y externas."
                    actions={
                        canCreate ? (
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Nueva auditoría
                            </Button>
                        ) : undefined
                    }
                />

                <Card className="border-border bg-card">
                    <CardContent className="space-y-4 p-5">
                        <FiltersBar showClear={!!hasFilters} onClear={clearFilters}>
                            <SelectFilter
                                value={tipoFilter}
                                onChange={(v) => {
                                    setTipoFilter(v);
                                    setPage(1);
                                }}
                                options={tipoOptions}
                                placeholder="Tipo"
                            />
                            <SelectFilter
                                value={estadoFilter}
                                onChange={(v) => {
                                    setEstadoFilter(v);
                                    setPage(1);
                                }}
                                options={estadoOptions}
                                placeholder="Estado"
                            />
                        </FiltersBar>

                        <DataTable
                            columns={columns}
                            data={auditorias}
                            keyExtractor={(a) => a.id}
                            loading={loading}
                            error={error}
                            onRetry={loadData}
                            emptyState={{
                                title: "Sin auditorías",
                                description: "Crea tu primera auditoría para comenzar.",
                                action: canCreate ? { label: "Nueva auditoría", onClick: openCreate } : undefined,
                            }}
                        />

                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </CardContent>
                </Card>

                <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva auditoría">
                    <form className="space-y-4" onSubmit={form.handleSubmit(handleCreate)}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título *</label>
                            <Input {...form.register("titulo")} placeholder="Ej: Auditoría anual 2026" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo *</label>
                                <Controller
                                    name="tipo"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""} onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tipoOptions.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </SelectItem>
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
                            <label className="text-sm font-medium">Auditor</label>
                            <Input {...form.register("auditor")} placeholder="Nombre del auditor" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción</label>
                            <Input {...form.register("descripcion")} />
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
                    title="Eliminar auditoría"
                    description={`¿Eliminar "${selected?.titulo}"?`}
                    loading={submitting}
                />
            </div>
        </MotionFadeSlide>
    );
}
