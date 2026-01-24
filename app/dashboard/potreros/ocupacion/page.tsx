"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, History, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FiltersBar, SelectFilter } from "@/components/ui/filters-bar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import NoPermission from "@/components/no-permission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchOcupacionesActivas,
  fetchOcupacionesHistorial,
  createOcupacion,
  cerrarOcupacion,
} from "@/lib/api/ocupaciones.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import { fetchPotreros } from "@/lib/api/potreros.service";
import { fetchLotes } from "@/lib/api/lotes.service";
import type {
  OcupacionActivaPotrero,
  OcupacionActivaLote,
  CerrarOcupacionResponse,
  Ocupacion,
  CreateOcupacionDTO,
  CloseOcupacionDTO,
  Finca,
  Potrero,
  Lote,
} from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const ocupacionSchema = z.object({
  id_finca: z.string().min(1, "Selecciona una finca"),
  id_potrero: z.string().min(1, "Selecciona un potrero"),
  id_lote: z.string().min(1, "Selecciona un lote"),
  fecha_inicio: z.string().min(1, "Ingresa la fecha de inicio"),
  notas: z.string().optional(),
});

const cerrarSchema = z.object({
  fecha_fin: z.string().min(1, "Ingresa la fecha de fin"),
  notas: z.string().optional(),
});

type OcupacionForm = z.infer<typeof ocupacionSchema>;
type CerrarForm = z.infer<typeof cerrarSchema>;

function formatDate(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: es });
}

export default function OcupacionPage() {
  const session = getStoredSession();
  const canView = hasPermission(session, "potreros.view");
  const canCreate = hasPermission(session, "potreros.create");
  const canEdit = hasPermission(session, "potreros.edit");

  // Estados principales
  const [resumen, setResumen] = useState<{
    porPotrero: OcupacionActivaPotrero[];
    porLote: OcupacionActivaLote[];
  }>({ porPotrero: [], porLote: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filtros
  const [fincaFilter, setFincaFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // Formulario crear ocupación
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<OcupacionForm>({
    resolver: zodResolver(ocupacionSchema),
    defaultValues: {
      id_finca: "",
      id_potrero: "",
      id_lote: "",
      fecha_inicio: new Date().toISOString().split("T")[0],
      notas: "",
    },
  });

  // Formulario cerrar ocupación
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [selectedOcupacion, setSelectedOcupacion] = useState<
    | { id_ocupacion: string; potrero_nombre?: string; lote_nombre?: string }
    | null
  >(null);
  const [cerrarWarning, setCerrarWarning] = useState<string | null>(null);
  const cerrarForm = useForm<CerrarForm>({
    resolver: zodResolver(cerrarSchema),
    defaultValues: {
      fecha_fin: new Date().toISOString().split("T")[0],
      notas: "",
    },
  });

  // Historial
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialPotrero, setHistorialPotrero] = useState<string | null>(null);
  const [historialLote, setHistorialLote] = useState<string | null>(null);
  const [historialData, setHistorialData] = useState<Ocupacion[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  // Catálogos
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [potreros, setPotreros] = useState<Potrero[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);

  const watchedFincaId = form.watch("id_finca");

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [fincasRes, potrerosRes, lotesRes] = await Promise.all([
          fetchFincas({ limit: 100 }),
          fetchPotreros({ limit: 100 }),
          fetchLotes({ limit: 100 }),
        ]);
        setFincas(fincasRes.items ?? []);
        setPotreros(potrerosRes.items ?? []);
        setLotes(lotesRes.items ?? []);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      }
    };
    loadCatalogos();
  }, []);

  // Filtrar potreros y lotes por finca seleccionada
  const potrerosFiltrados = useMemo(() => {
    if (!watchedFincaId) return [];
    return potreros.filter((p) => p.id_finca === watchedFincaId);
  }, [potreros, watchedFincaId]);

  const lotesFiltrados = useMemo(() => {
    if (!watchedFincaId) return [];
    return lotes.filter((l) => l.id_finca === watchedFincaId);
  }, [lotes, watchedFincaId]);

  // Cargar resumen
  const loadResumen = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [porPotreroRes, porLoteRes] = await Promise.all([
        fetchOcupacionesActivas({
          id_finca: fincaFilter || undefined,
          vista: "potrero",
        }),
        fetchOcupacionesActivas({
          id_finca: fincaFilter || undefined,
          vista: "lote",
        }),
      ]);
      setResumen({
        porPotrero: "porPotrero" in porPotreroRes ? porPotreroRes.porPotrero : [],
        porLote: "porLote" in porLoteRes ? porLoteRes.porLote : [],
      });
    } catch {
      setError(true);
      toast.error("Error al cargar ocupaciones");
    } finally {
      setLoading(false);
    }
  }, [fincaFilter]);

  useEffect(() => {
    loadResumen();
  }, [loadResumen]);

  // Cargar historial
  const loadHistorial = useCallback(async () => {
    if (!historialPotrero && !historialLote) return;

    setHistorialLoading(true);
    try {
      const res = await fetchOcupacionesHistorial({
        id_potrero: historialPotrero || undefined,
        id_lote: historialLote || undefined,
        id_finca: fincaFilter || undefined,
      });
      setHistorialData(res ?? []);
    } catch {
      toast.error("Error al cargar historial");
    } finally {
      setHistorialLoading(false);
    }
  }, [historialPotrero, historialLote, fincaFilter]);

  useEffect(() => {
    if (historialOpen) {
      loadHistorial();
    }
  }, [historialOpen, loadHistorial]);

  // Handlers
  const openCreate = () => {
    form.reset({
      id_finca: fincaFilter || "",
      id_potrero: "",
      id_lote: "",
      fecha_inicio: new Date().toISOString().split("T")[0],
      notas: "",
    });
    setCreateOpen(true);
  };

  const handleCreate = async (values: OcupacionForm) => {
    setSubmitting(true);
    try {
      await createOcupacion(values as CreateOcupacionDTO);
      toast.success("Ocupación creada exitosamente");
      setCreateOpen(false);
      await loadResumen();
    } catch (err: any) {
      toast.error(err?.message || "Error al crear ocupación");
    } finally {
      setSubmitting(false);
    }
  };

  const openCerrar = (ocupacion: {
    id_ocupacion: string;
    potrero_nombre?: string;
    lote_nombre?: string;
  }) => {
    setSelectedOcupacion(ocupacion);
    setCerrarWarning(null);
    cerrarForm.reset({
      fecha_fin: new Date().toISOString().split("T")[0],
      notas: "",
    });
    setCerrarOpen(true);
  };

  const handleCerrar = async (values: CerrarForm) => {
    if (!selectedOcupacion) return;

    setSubmitting(true);
    try {
      const res = await cerrarOcupacion(
        selectedOcupacion.id_ocupacion,
        values as CloseOcupacionDTO,
      );
      const warning = (res as CerrarOcupacionResponse)?.warning;
      if (warning?.animales_en_potrero) {
        setCerrarWarning(
          `Aún hay ${warning.animales_en_potrero} animales de ese lote en este potrero.`,
        );
      }
      toast.success("Ocupación cerrada exitosamente");
      setCerrarOpen(false);
      await loadResumen();
    } catch (err: any) {
      toast.error(err?.message || "Error al cerrar ocupación");
    } finally {
      setSubmitting(false);
    }
  };

  const openHistorial = (potreroId?: string, loteId?: string) => {
    setHistorialPotrero(potreroId || null);
    setHistorialLote(loteId || null);
    setHistorialOpen(true);
  };

  // Columnas para tabla "Por potrero"
  const columnsPorPotrero: DataTableColumn<OcupacionActivaPotrero>[] = [
    {
      key: "potrero",
      header: "Potrero",
      render: (o) => (
        <div>
          <span className="font-medium">{o.potrero_nombre}</span>
          {o.mezcla_indebida && (
            <Badge variant="warning" className="ml-2">
              Mezcla indebida
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "ocupaciones",
      header: "Ocupaciones activas",
      render: (o) => (
        <div className="flex flex-wrap gap-2">
          {o.ocupaciones.map((oc) => (
            <div
              key={oc.id_ocupacion}
              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
            >
              <span className="font-medium">{oc.lote_nombre}</span> · {oc.dias} días ·{" "}
              {oc.animales_del_lote} animales
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "finca",
      header: "Finca",
      render: (o) => o.finca_nombre,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openHistorial(o.potrero_id, undefined)}
          >
            <History className="h-4 w-4" />
          </Button>
          {canEdit && o.ocupaciones.length > 0 && (
            <Select
              value=""
              onValueChange={(value) => {
                const selected = o.ocupaciones.find(
                  (oc) => oc.id_ocupacion === value,
                );
                if (!selected) return;
                openCerrar({
                  id_ocupacion: selected.id_ocupacion,
                  potrero_nombre: o.potrero_nombre,
                  lote_nombre: selected.lote_nombre,
                });
              }}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Cerrar" />
              </SelectTrigger>
              <SelectContent>
                {o.ocupaciones.map((oc) => (
                  <SelectItem key={oc.id_ocupacion} value={oc.id_ocupacion}>
                    {oc.lote_nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
  ];

  // Columnas para tabla "Por lote"
  const columnsPorLote: DataTableColumn<OcupacionActivaLote>[] = [
    {
      key: "lote",
      header: "Lote",
      render: (o) => <span className="font-medium">{o.lote_nombre}</span>,
    },
    {
      key: "potreros",
      header: "Potreros activos",
      render: (o) => (
        <div className="flex flex-wrap gap-2">
          {o.ocupaciones.map((oc) => (
            <div
              key={oc.id_ocupacion}
              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
            >
              <span className="font-medium">{oc.potrero_nombre}</span> · {oc.dias} días ·{" "}
              {oc.animales_del_lote} animales
              {oc.mezcla_indebida && (
                <Badge variant="warning" className="ml-2">
                  Mezcla
                </Badge>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "finca",
      header: "Finca",
      render: (o) => o.finca_nombre,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openHistorial(undefined, o.lote_id)}
          >
            <History className="h-4 w-4" />
          </Button>
          {canEdit && o.ocupaciones.length > 0 && (
            <Select
              value=""
              onValueChange={(value) => {
                const selected = o.ocupaciones.find(
                  (oc) => oc.id_ocupacion === value,
                );
                if (!selected) return;
                openCerrar({
                  id_ocupacion: selected.id_ocupacion,
                  lote_nombre: o.lote_nombre,
                  potrero_nombre: selected.potrero_nombre,
                });
              }}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Cerrar" />
              </SelectTrigger>
              <SelectContent>
                {o.ocupaciones.map((oc) => (
                  <SelectItem key={oc.id_ocupacion} value={oc.id_ocupacion}>
                    {oc.potrero_nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
  ];

  // Columnas para historial
  const columnsHistorial: DataTableColumn<Ocupacion>[] = [
    {
      key: "potrero",
      header: "Potrero",
      render: (o) => o.potrero_nombre || "—",
    },
    {
      key: "lote",
      header: "Lote",
      render: (o) => o.lote_nombre || "—",
    },
    {
      key: "inicio",
      header: "Inicio",
      render: (o) => formatDate(o.fecha_inicio),
    },
    {
      key: "fin",
      header: "Fin",
      render: (o) => (o.fecha_fin ? formatDate(o.fecha_fin) : "—"),
    },
    {
      key: "estado",
      header: "Estado",
      render: (o) =>
        o.activo ? (
          <Badge variant="success">Activa</Badge>
        ) : (
          <Badge variant="muted">Cerrada</Badge>
        ),
    },
  ];

  if (!canView) return <NoPermission />;

  const tabs = [
    {
      id: "por-potrero",
      label: "Por potrero",
      content: (
        <DataTable
          columns={columnsPorPotrero}
          data={resumen.porPotrero}
          keyExtractor={(o) => o.potrero_id}
          loading={loading}
          error={error}
          onRetry={loadResumen}
          emptyState={{ title: "Sin ocupaciones activas" }}
        />
      ),
    },
    {
      id: "por-lote",
      label: "Por lote",
      content: (
        <DataTable
          columns={columnsPorLote}
          data={resumen.porLote}
          keyExtractor={(o) => o.lote_id}
          loading={loading}
          error={error}
          onRetry={loadResumen}
          emptyState={{ title: "Sin ocupaciones activas" }}
        />
      ),
    },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          title="Ocupación actual"
          description="Gestiona la ocupación de lotes en potreros"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ocupaciones activas</CardTitle>
              {canCreate && (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar ocupación
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FiltersBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
              }}
              searchPlaceholder="Buscar por potrero o lote..."
            >
              <SelectFilter
                label="Finca"
                value={fincaFilter}
                onChange={setFincaFilter}
                placeholder="Todas las fincas"
                options={fincas.map((f) => ({ value: f.id, label: f.nombre }))}
              />
            </FiltersBar>

            <Tabs tabs={tabs} defaultTab="por-potrero" />
          </CardContent>
        </Card>

        {/* Modal crear ocupación */}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Asignar ocupación"
          description="Asigna un lote a un potrero"
        >
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreate)}
          >
            <div className="space-y-2">
              <Label htmlFor="id_finca">Finca *</Label>
              <Controller
                name="id_finca"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("id_potrero", "");
                      form.setValue("id_lote", "");
                    }}
                  >
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
                <p className="text-sm text-destructive">
                  {form.formState.errors.id_finca.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_potrero">Potrero *</Label>
              <Controller
                name="id_potrero"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!watchedFincaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar potrero" />
                    </SelectTrigger>
                    <SelectContent>
                      {potrerosFiltrados.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.id_potrero && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.id_potrero.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_lote">Lote *</Label>
              <Controller
                name="id_lote"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!watchedFincaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotesFiltrados.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.id_lote && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.id_lote.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha inicio *</Label>
              <Controller
                name="fecha_inicio"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha"
                  />
                )}
              />
              {form.formState.errors.fecha_inicio && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fecha_inicio.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                {...form.register("notas")}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal cerrar ocupación */}
        <ConfirmDialog
          open={cerrarOpen}
          onClose={() => setCerrarOpen(false)}
          onConfirm={cerrarForm.handleSubmit(handleCerrar)}
          title="Cerrar ocupación"
          description={
            <div className="space-y-4">
              <p>
                ¿Deseas cerrar la ocupación de{" "}
                {selectedOcupacion
                  ? selectedOcupacion.potrero_nombre ?? selectedOcupacion.lote_nombre
                  : null}
                ?
              </p>
              {cerrarWarning && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {cerrarWarning}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha fin *</label>
                <Controller
                  name="fecha_fin"
                  control={cerrarForm.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar fecha"
                    />
                  )}
                />
                {cerrarForm.formState.errors.fecha_fin && (
                  <p className="text-sm text-destructive">
                    {cerrarForm.formState.errors.fecha_fin.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  {...cerrarForm.register("notas")}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          }
          loading={submitting}
          confirmLabel="Cerrar"
        />

        {/* Modal historial */}
        {historialOpen && (
          <Card className="fixed inset-4 z-50 m-auto max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historial de ocupaciones</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHistorialOpen(false);
                    setHistorialPotrero(null);
                    setHistorialLote(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columnsHistorial}
                data={historialData}
                keyExtractor={(o) => o.id}
                loading={historialLoading}
                emptyState={{ title: "Sin historial" }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MotionFadeSlide>
  );
}
