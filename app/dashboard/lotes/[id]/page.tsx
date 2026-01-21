"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/error-state";
import { MotionFadeSlide } from "@/components/ui/animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import NoPermission from "@/components/no-permission";

import {
  fetchLote,
  updateLote,
  fetchLoteAnimales,
  bulkAssignAnimales,
  bulkRemoveAnimales,
  type BulkAnimalsResponse,
} from "@/lib/api/lotes.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import { fetchAnimales } from "@/lib/api/animales.service";
import type { Lote, Finca, Animal } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const loteFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  activo: z.boolean(),
});

type LoteForm = z.infer<typeof loteFormSchema>;

export default function LoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loteId = params.id as string;
  const initialMode = searchParams.get("mode") === "edit" ? "edit" : "view";

  const session = getStoredSession();
  const canView = hasPermission(session, "lotes.view");
  const canEdit = hasPermission(session, "lotes.edit");
  const canBulkAssign = hasPermission(session, "lotes.bulkAssign");
  const canBulkRemove = hasPermission(session, "lotes.bulkRemove");

  const [lote, setLote] = useState<Lote | null>(null);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para gestión de animales
  const [loteAnimals, setLoteAnimals] = useState<Animal[]>([]);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkAnimalsResponse | null>(null);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [searchAnimal, setSearchAnimal] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const form = useForm<LoteForm>({
    resolver: zodResolver(loteFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  const loadLote = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchLote(loteId);
      setLote(data);
      form.reset({
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        activo: data.activo,
      });
    } catch {
      setError(true);
      toast.error("Error al cargar el lote");
    } finally {
      setLoading(false);
    }
  }, [loteId, form]);

  const loadFincas = useCallback(async () => {
    try {
      const res = await fetchFincas({ limit: 100 });
      setFincas(res.items ?? []);
    } catch {
      // Silent fail
    }
  }, []);

  const loadLoteAnimales = useCallback(async () => {
    setLoadingAnimals(true);
    try {
      const animals = await fetchLoteAnimales(loteId);
      setLoteAnimals(animals ?? []);
    } catch {
      toast.error("Error al cargar animales del lote");
    } finally {
      setLoadingAnimals(false);
    }
  }, [loteId]);

  const loadAllAnimales = useCallback(async () => {
    try {
      const res = await fetchAnimales({ limit: 100, estado: "activo" });
      setAllAnimals(res.items ?? []);
    } catch {
      toast.error("Error al cargar animales disponibles");
    }
  }, []);

  useEffect(() => {
    loadLote();
    loadFincas();
    loadLoteAnimales();
  }, [loadLote, loadFincas, loadLoteAnimales]);

  // Filtrar animales disponibles para asignar
  const availableAnimalsToAssign = useMemo(() => {
    if (!lote) return [];
    
    const animalsInCurrentLote = new Set(loteAnimals.map(a => a.id));
    
    return allAnimals.filter((animal) => {
      if (animalsInCurrentLote.has(animal.id)) return false;
      if (animal.id_finca !== lote.id_finca) return false;
      
      if (searchAnimal) {
        const search = searchAnimal.toLowerCase();
        return (
          animal.nombre?.toLowerCase().includes(search) ||
          animal.codigo?.toLowerCase().includes(search) ||
          animal.identificador_principal?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allAnimals, loteAnimals, lote, searchAnimal]);

  // Filtrar animales del lote actual
  const animalsInLote = useMemo(() => {
    if (searchAnimal) {
      const search = searchAnimal.toLowerCase();
      return loteAnimals.filter(
        (animal) =>
          animal.nombre?.toLowerCase().includes(search) ||
          animal.codigo?.toLowerCase().includes(search) ||
          animal.identificador_principal?.toLowerCase().includes(search)
      );
    }
    return loteAnimals;
  }, [loteAnimals, searchAnimal]);

  const handleSubmit = async (values: LoteForm) => {
    setSubmitting(true);
    try {
      await updateLote(loteId, values);
      toast.success("Lote actualizado");
      setMode("view");
      await loadLote();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar lote";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedAnimals.length === 0) return;
    setSubmitting(true);
    try {
      const result = await bulkAssignAnimales(loteId, selectedAnimals);
      setBulkResult(result);
      toast.success(`${result.assigned_count ?? 0} animales asignados`);
      setSelectedAnimals([]);
      await loadLoteAnimales();
      setAssignModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error en asignación masiva";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedAnimals.length === 0) return;
    setSubmitting(true);
    try {
      const result = await bulkRemoveAnimales(loteId, selectedAnimals);
      setBulkResult(result);
      toast.success(`${result.removed_count ?? 0} animales removidos`);
      setSelectedAnimals([]);
      await loadLoteAnimales();
      setRemoveModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error en remoción masiva";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = async () => {
    setSelectedAnimals([]);
    setBulkResult(null);
    setSearchAnimal("");
    setAssignModalOpen(true);
    if (allAnimals.length === 0) {
      await loadAllAnimales();
    }
  };

  const openRemoveModal = () => {
    setSelectedAnimals([]);
    setBulkResult(null);
    setSearchAnimal("");
    setRemoveModalOpen(true);
  };

  if (!canView) {
    return <NoPermission />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lote) {
    return (
      <ErrorState
        title="Error al cargar el lote"
        description="No se pudo cargar la información del lote"
        onRetry={loadLote}
      />
    );
  }

  const tabs = [
    {
      id: "info",
      label: "Información",
      content: (
        <Card className="border-border">
          <CardContent className="p-6">
            {mode === "edit" ? (
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input id="nombre" {...form.register("nombre")} />
                    {form.formState.errors.nombre && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nombre.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <textarea
                      id="descripcion"
                      {...form.register("descripcion")}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Descripción del lote..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activo"
                      checked={form.watch("activo")}
                      onCheckedChange={(checked) =>
                        form.setValue("activo", !!checked)
                      }
                    />
                    <Label htmlFor="activo" className="cursor-pointer">
                      Lote activo
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMode("view");
                      form.reset({
                        nombre: lote.nombre,
                        descripcion: lote.descripcion || "",
                        activo: lote.activo,
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-lg font-semibold">{lote.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finca</p>
                    <p className="text-lg">{lote.finca_nombre || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                  <p className="text-base mt-1">{lote.descripcion || "—"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    {lote.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="muted">Inactivo</Badge>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-4 border-t">
                    <Button onClick={() => setMode("edit")}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar información
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "animals",
      label: `Animales (${loteAnimals.length})`,
      content: (
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            {mode === "edit" && (
              <div className="flex gap-2 pb-4 border-b">
                <Button
                  onClick={openAssignModal}
                  disabled={!canBulkAssign}
                  variant="default"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar animales
                </Button>
                <Button
                  onClick={openRemoveModal}
                  disabled={!canBulkRemove || loteAnimals.length === 0}
                  variant="destructive"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remover animales
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar animal..."
                  value={searchAnimal}
                  onChange={(e) => setSearchAnimal(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchAnimal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchAnimal("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loadingAnimals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : animalsInLote.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
                <UsersRound className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {searchAnimal ? "No se encontraron animales" : "Sin animales en este lote"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchAnimal ? "Intenta con otra búsqueda" : mode === "edit" ? "Usa el botón 'Asignar animales' para agregar animales" : "No hay animales asignados a este lote"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
                  <span className="font-medium">{animalsInLote.length}</span> animal{animalsInLote.length !== 1 ? "es" : ""} en el lote
                </div>
                <div className="space-y-2">
                  {animalsInLote.map((animal) => (
                    <div
                      key={animal.id}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3 text-sm hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/animales/${animal.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {animal.nombre || animal.identificador_principal || animal.codigo || `Animal #${animal.id}`}
                        </p>
                        {(animal.identificador_principal || animal.codigo) && (
                          <p className="text-xs text-muted-foreground">
                            ID: {animal.identificador_principal || animal.codigo}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={animal.sexo === "F" ? "default" : "info"}>
                          {animal.sexo === "F" ? "Hembra" : "Macho"}
                        </Badge>
                        {animal.categoria && (
                          <span className="text-xs text-muted-foreground">{animal.categoria}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          subtitle="Gestión"
          title={lote.nombre}
          description={`Finca: ${lote.finca_nombre || "—"}`}
          actions={
            <Button variant="ghost" onClick={() => router.push("/dashboard/lotes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          }
        />

        <Tabs tabs={tabs} defaultTab="info" />

        {/* Modal para asignar animales */}
        <Modal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title="Asignar animales"
          description="Selecciona los animales que deseas asignar a este lote"
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Solo se muestran animales de la misma finca que no están en este lote.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar animal..."
                  value={searchAnimal}
                  onChange={(e) => setSearchAnimal(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchAnimal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchAnimal("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loadingAnimals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableAnimalsToAssign.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
                <UsersRound className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No hay animales disponibles
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchAnimal ? "Intenta con otra búsqueda" : "Todos los animales de esta finca ya están asignados"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium">{availableAnimalsToAssign.length}</span> disponible{availableAnimalsToAssign.length !== 1 ? "s" : ""}
                  </span>
                  {selectedAnimals.length > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {selectedAnimals.length} seleccionado{selectedAnimals.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] space-y-2 overflow-auto">
                  {availableAnimalsToAssign.map((animal) => (
                    <label
                      key={animal.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={selectedAnimals.includes(animal.id)}
                        onCheckedChange={(checked) => {
                          setSelectedAnimals((prev) =>
                            checked
                              ? [...prev, animal.id]
                              : prev.filter((id) => id !== animal.id)
                          );
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {animal.nombre || animal.identificador_principal || animal.codigo || `Animal #${animal.id}`}
                        </p>
                        {(animal.identificador_principal || animal.codigo) && (
                          <p className="text-xs text-muted-foreground">
                            ID: {animal.identificador_principal || animal.codigo}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={animal.sexo === "F" ? "default" : "info"} className="text-xs">
                          {animal.sexo === "F" ? "H" : "M"}
                        </Badge>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {bulkResult && bulkResult.assigned_count !== undefined && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {bulkResult.assigned_count} animal{bulkResult.assigned_count !== 1 ? "es asignados" : " asignado"}
                </div>
                {bulkResult.failed && bulkResult.failed.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <p className="font-medium">{bulkResult.failed.length} error{bulkResult.failed.length !== 1 ? "es" : ""}:</p>
                    {bulkResult.failed.slice(0, 3).map((fail) => (
                      <div key={`${fail.animal_id}-${fail.reason}`}>
                        • {fail.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={submitting || selectedAnimals.length === 0}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <UserPlus className="h-4 w-4 mr-2" />
                Asignar {selectedAnimals.length > 0 && `(${selectedAnimals.length})`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal para remover animales */}
        <Modal
          open={removeModalOpen}
          onClose={() => setRemoveModalOpen(false)}
          title="Remover animales"
          description="Selecciona los animales que deseas remover de este lote"
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-orange-50 dark:bg-orange-950/20 p-3 text-sm">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Solo se muestran animales que actualmente están en este lote.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar animal..."
                  value={searchAnimal}
                  onChange={(e) => setSearchAnimal(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchAnimal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchAnimal("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loadingAnimals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : animalsInLote.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
                <UsersRound className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {searchAnimal ? "No se encontraron animales" : "Sin animales en este lote"}
                </p>
                <p className="text-xs text-muted-foreground">
                  No hay animales para remover
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium">{animalsInLote.length}</span> en el lote
                  </span>
                  {selectedAnimals.length > 0 && (
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {selectedAnimals.length} seleccionado{selectedAnimals.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] space-y-2 overflow-auto">
                  {animalsInLote.map((animal) => (
                    <label
                      key={animal.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={selectedAnimals.includes(animal.id)}
                        onCheckedChange={(checked) => {
                          setSelectedAnimals((prev) =>
                            checked
                              ? [...prev, animal.id]
                              : prev.filter((id) => id !== animal.id)
                          );
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {animal.nombre || animal.identificador_principal || animal.codigo || `Animal #${animal.id}`}
                        </p>
                        {(animal.identificador_principal || animal.codigo) && (
                          <p className="text-xs text-muted-foreground">
                            ID: {animal.identificador_principal || animal.codigo}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={animal.sexo === "F" ? "default" : "info"} className="text-xs">
                          {animal.sexo === "F" ? "Hembra" : "Macho"}
                        </Badge>
                        {animal.categoria && (
                          <span className="text-xs text-muted-foreground">{animal.categoria}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {bulkResult && bulkResult.removed_count !== undefined && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {bulkResult.removed_count} animal{bulkResult.removed_count !== 1 ? "es removidos" : " removido"}
                </div>
                {bulkResult.failed && bulkResult.failed.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <p className="font-medium">{bulkResult.failed.length} error{bulkResult.failed.length !== 1 ? "es" : ""}:</p>
                    {bulkResult.failed.slice(0, 3).map((fail) => (
                      <div key={`${fail.animal_id}-${fail.reason}`}>
                        • {fail.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRemoveModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkRemove}
                disabled={submitting || selectedAnimals.length === 0}
                variant="destructive"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <UserMinus className="h-4 w-4 mr-2" />
                Remover {selectedAnimals.length > 0 && `(${selectedAnimals.length})`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MotionFadeSlide>
  );
}
