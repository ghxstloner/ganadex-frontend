"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api/request";
import { cn } from "@/lib/utils";

type EmpresaRecord = {
  id: string;
  nombre: string;
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmpresaRecord | null>(null);
  const [nombre, setNombre] = useState("");

  const loadEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EmpresaRecord[]>("/empresas");
      setEmpresas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setIsModalOpen(true);
  };

  const openEdit = (empresa: EmpresaRecord) => {
    setEditing(empresa);
    setNombre(empresa.nombre);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await apiRequest<EmpresaRecord>(`/empresas/${editing.id}`, {
          method: "PUT",
          body: { nombre: nombre.trim() },
        });
        toast.success("Empresa actualizada");
      } else {
        await apiRequest<EmpresaRecord>("/empresas", {
          method: "POST",
          body: { nombre: nombre.trim() },
        });
        toast.success("Empresa creada");
      }
      await loadEmpresas();
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
          <h1 className="text-2xl font-semibold text-slate-900">Empresas</h1>
        </div>
        <Button onClick={openCreate}>Nueva empresa</Button>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando empresas...</p>
          ) : empresas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aun no hay empresas registradas.
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
                  {empresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className="border-t border-slate-200"
                    >
                      <td className="px-4 py-3 text-slate-900">
                        {empresa.nombre}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(empresa)}
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
          "fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 transition-opacity",
          isModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Card className="w-full max-w-md border-slate-200/80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              {editing ? "Editar empresa" : "Nueva empresa"}
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
                  placeholder="Nombre de la empresa"
                />
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
  );
}
