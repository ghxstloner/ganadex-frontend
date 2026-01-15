"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { MotionFadeSlide } from "@/components/ui/animate";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { fetchMonedas } from "@/lib/api/finanzas.service";
import type { Moneda } from "@/lib/types/business";
import { apiRequest } from "@/lib/api/request";

const fincaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  moneda_base_id: z.string().min(1, "La moneda base es obligatoria"),
});

type FincaForm = z.infer<typeof fincaSchema>;

type FincaRecord = {
  id: string;
  nombre: string;
  moneda_base_id?: string;
  moneda_nombre?: string;
  moneda_simbolo?: string;
};

export default function FincasPage() {
  const [fincas, setFincas] = useState<FincaRecord[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FincaRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [monedaComboboxOpen, setMonedaComboboxOpen] = useState(false);

  const form = useForm<FincaForm>({
    resolver: zodResolver(fincaSchema),
    defaultValues: { nombre: "", moneda_base_id: "" },
  });

  const watchedMonedaId = form.watch("moneda_base_id");

  const loadFincas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiRequest<FincaRecord[] | { items: FincaRecord[] }>(
        "/fincas",
        {
          toastOnError: true,
        }
      );
      if (Array.isArray(response)) {
        setFincas(response);
      } else if (response && typeof response === "object" && "items" in response) {
        setFincas(response.items);
      } else {
        setFincas([]);
      }
    } catch (error) {
      console.error("Error al cargar fincas:", error);
      setError(true);
      setFincas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFincas();
  }, [loadFincas]);

  useEffect(() => {
    const loadMonedas = async () => {
      try {
        const monedasData = await fetchMonedas();
        setMonedas(monedasData);
      } catch (error) {
        console.error("Error al cargar monedas:", error);
        toast.error("Error al cargar monedas");
      }
    };

    loadMonedas();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ nombre: "", moneda_base_id: "" });
    setMonedaComboboxOpen(false);
    setCreateOpen(true);
  };

  const openEdit = (finca: FincaRecord) => {
    setEditing(finca);
    form.reset({
      nombre: finca.nombre,
      moneda_base_id: finca.moneda_base_id || "",
    });
    setMonedaComboboxOpen(false);
    setCreateOpen(true);
  };

  const handleSubmit = async (values: FincaForm) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiRequest<FincaRecord>(`/fincas/${editing.id}`, {
          method: "PUT",
          body: values,
        });
        toast.success("Finca actualizada");
      } else {
        await apiRequest<FincaRecord>("/fincas", {
          method: "POST",
          body: values,
        });
        toast.success("Finca creada");
      }
      setCreateOpen(false);
      await loadFincas();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar finca");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<FincaRecord>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (f) => <span className="font-medium">{f.nombre}</span>,
    },
    {
      key: "moneda",
      header: "Moneda base",
      render: (f) => {
        const moneda = monedas.find((m) => m.id === f.moneda_base_id);
        return moneda
          ? `${moneda.iso_alpha3} — ${moneda.nombre}${moneda.simbolo ? ` (${moneda.simbolo})` : ""}`
          : "—";
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (f) => (
        <Button variant="outline" size="sm" onClick={() => openEdit(f)}>
          Editar
        </Button>
      ),
    },
  ];

  if (loading && fincas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && fincas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">
          Error al cargar las fincas. Por favor, intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <MotionFadeSlide>
      <div className="space-y-6">
        <PageHeader
          title="Fincas"
          description="Gestiona las fincas de tu empresa"
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Listado de fincas</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {fincas.length} {fincas.length === 1 ? "finca" : "fincas"} registrada{fincas.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva finca
              </Button>
            </div>

            {fincas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-4">
                  Aún no hay fincas registradas.
                </p>
                <Button onClick={openCreate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera finca
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={fincas} />
            )}
          </CardContent>
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title={editing ? "Editar finca" : "Nueva finca"}
          description={editing ? "Modifica los datos de la finca" : "Crea una nueva finca"}
        >
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...form.register("nombre")}
                placeholder="Nombre de la finca"
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda_base">Moneda base *</Label>
              <Popover open={monedaComboboxOpen} onOpenChange={setMonedaComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="moneda_base"
                    variant="outline"
                    role="combobox"
                    aria-expanded={monedaComboboxOpen}
                    className="w-full justify-between"
                  >
                    {(() => {
                      const selectedMoneda = monedas.find(
                        (moneda) => moneda.id === watchedMonedaId
                      );
                      return selectedMoneda
                        ? `${selectedMoneda.iso_alpha3} — ${selectedMoneda.nombre}${selectedMoneda.simbolo ? ` (${selectedMoneda.simbolo})` : ""}`
                        : "Selecciona una moneda";
                    })()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar moneda..." />
                    <CommandList>
                      <CommandEmpty>No se encontró ninguna moneda.</CommandEmpty>
                      <CommandGroup>
                        {monedas.map((moneda) => (
                          <CommandItem
                            key={moneda.id}
                            value={`${moneda.iso_alpha3} ${moneda.nombre} ${moneda.simbolo || ""}`}
                            onSelect={() => {
                              form.setValue(
                                "moneda_base_id",
                                moneda.id === watchedMonedaId ? "" : moneda.id
                              );
                              setMonedaComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watchedMonedaId === moneda.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {moneda.iso_alpha3} — {moneda.nombre}
                            {moneda.simbolo ? ` (${moneda.simbolo})` : ""}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.moneda_base_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.moneda_base_id.message}
                </p>
              )}
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
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MotionFadeSlide>
  );
}
