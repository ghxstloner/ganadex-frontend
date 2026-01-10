"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, type PaginatedResponse } from "@/lib/api/request";
import { fetchMonedas } from "@/lib/api/finanzas.service";
import type { Moneda } from "@/lib/types/business";
import { cn } from "@/lib/utils";

type FincaRecord = {
  id: string;
  nombre: string;
  moneda_base_id?: string;
};

export default function FincasPage() {
  const [fincas, setFincas] = useState<FincaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FincaRecord | null>(null);
  const [nombre, setNombre] = useState("");
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [monedaBaseId, setMonedaBaseId] = useState("");
  const [monedaComboboxOpen, setMonedaComboboxOpen] = useState(false);

  const loadFincas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<
        FincaRecord[] | PaginatedResponse<FincaRecord>
      >("/fincas", {
        toastOnError: true,
      });
      // Manejar respuesta paginada o directa
      if (Array.isArray(response)) {
        setFincas(response);
      } else if (response && typeof response === "object" && "items" in response) {
        setFincas(response.items);
      } else {
        setFincas([]);
      }
    } catch (error) {
      // El error ya se maneja en apiRequest (toast + logout si es 401)
      // No hacer nada aquí para evitar doble manejo
      console.error("Error al cargar fincas:", error);
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
    setNombre("");
    setMonedaBaseId("");
    setMonedaComboboxOpen(false);
    setIsModalOpen(true);
  };

  const openEdit = (finca: FincaRecord) => {
    setEditing(finca);
    setNombre(finca.nombre);
    setMonedaBaseId(finca.moneda_base_id || "");
    setMonedaComboboxOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!monedaBaseId) {
      toast.error("La moneda base es obligatoria");
      return;
    }

    setSaving(true);
    try {
      const body = {
        nombre: nombre.trim(),
        moneda_base_id: monedaBaseId,
      };

      if (editing) {
        await apiRequest<FincaRecord>(`/fincas/${editing.id}`, {
          method: "PUT",
          body,
        });
        toast.success("Finca actualizada");
      } else {
        await apiRequest<FincaRecord>("/fincas", {
          method: "POST",
          body,
        });
        toast.success("Finca creada");
      }
      await loadFincas();
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Gestion</p>
          <h1 className="text-2xl font-semibold text-slate-900">Fincas</h1>
        </div>
        <Button onClick={openCreate}>Nueva finca</Button>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando fincas...</p>
          ) : fincas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aun no hay fincas registradas.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fincas.map((finca) => (
                    <tr key={finca.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 text-slate-900">
                        {finca.nombre}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(finca)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity",
          isModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsModalOpen(false)}
      >
        <div className="fixed inset-y-0 left-0 right-0 lg:left-72 z-40 flex items-center justify-center px-4 pointer-events-none">
          <Card 
            className="w-full max-w-md border-slate-200/80 shadow-lg pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
          <CardHeader>
            <CardTitle className="text-lg">
              {editing ? "Editar finca" : "Nueva finca"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Nombre de la finca"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneda_base">Moneda Base</Label>
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
                        const selectedMoneda = monedas.find((moneda) => moneda.id === monedaBaseId);
                        return selectedMoneda
                          ? `${selectedMoneda.iso_alpha3} — ${selectedMoneda.nombre}${selectedMoneda.simbolo ? ` (${selectedMoneda.simbolo})` : ""}`
                          : "Selecciona una moneda";
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                                setMonedaBaseId(moneda.id === monedaBaseId ? "" : moneda.id);
                                setMonedaComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  monedaBaseId === moneda.id ? "opacity-100" : "opacity-0"
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
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
