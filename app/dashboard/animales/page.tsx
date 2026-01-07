"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import NoPermission from "@/components/no-permission";

import {
  fetchAnimales,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  type AnimalesQuery,
} from "@/lib/api/animales.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import type { Animal, CreateAnimalDTO, Finca } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const animalSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().optional(),
  sexo: z.enum(["macho", "hembra"]),
  categoria: z.string().optional(),
  estado: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  raza: z.string().optional(),
  finca_id: z.string().optional(),
  notas: z.string().optional(),
});

type AnimalForm = z.infer<typeof animalSchema>;

const sexoOptions = [
  { value: "macho", label: "Macho" },
  { value: "hembra", label: "Hembra" },
];

const categoriaOptions = [
  { value: "ternero", label: "Ternero" },
  { value: "novillo", label: "Novillo" },
  { value: "vaca", label: "Vaca" },
  { value: "toro", label: "Toro" },
];

const estadoOptions = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "vendido", label: "Vendido" },
  { value: "muerto", label: "Muerto" },
];

function getSexoBadgeVariant(sexo: string) {
  return sexo === "hembra" ? "default" : "info";
}

function getEstadoBadgeVariant(estado: string) {
  switch (estado) {
    case "activo":
      return "success";
    case "inactivo":
      return "muted";
    case "vendido":
      return "warning";
    case "muerto":
      return "danger";
    default:
      return "muted";
  }
}

export default function AnimalesPage() {
  const router = useRouter();
  const session = getStoredSession();
  const canView = hasPermission(session, "animales.view");
  const canCreate = hasPermission(session, "animales.create");
  const canEdit = hasPermission(session, "animales.edit");
  const canDelete = hasPermission(session, "animales.delete");

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [fincaFilter, setFincaFilter] = useState("");
  const [sexoFilter, setSexoFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      sexo: "macho",
      categoria: "",
      estado: "activo",
      fecha_nacimiento: "",
      raza: "",
      finca_id: "",
      notas: "",
    },
  });

  const loadAnimals = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query: AnimalesQuery = {
        page,
        limit: 10,
        q: search || undefined,
        finca_id: fincaFilter || undefined,
        sexo: sexoFilter || undefined,
        categoria: categoriaFilter || undefined,
        estado: estadoFilter || undefined,
      };
      const response = await fetchAnimales(query);
      setAnimals(response.items ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, fincaFilter, sexoFilter, categoriaFilter, estadoFilter]);

  const loadFincas = useCallback(async () => {
    try {
      const response = await fetchFincas({ limit: 100 });
      setFincas(response.items ?? []);
    } catch {
      // Silent fail for fincas dropdown
    }
  }, []);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  useEffect(() => {
    loadFincas();
  }, [loadFincas]);

  const fincaOptions = useMemo(
    () => fincas.map((f) => ({ value: f.id, label: f.nombre })),
    [fincas]
  );

  const openCreate = () => {
    form.reset({
      codigo: "",
      nombre: "",
      sexo: "macho",
      categoria: "",
      estado: "activo",
      fecha_nacimiento: "",
      raza: "",
      finca_id: "",
      notas: "",
    });
    setCreateOpen(true);
  };

  const openEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    form.reset({
      codigo: animal.codigo ?? "",
      nombre: animal.nombre ?? "",
      sexo: animal.sexo,
      categoria: animal.categoria ?? "",
      estado: animal.estado ?? "activo",
      fecha_nacimiento: animal.fecha_nacimiento ?? "",
      raza: animal.raza ?? "",
      finca_id: animal.finca_id ?? "",
      notas: animal.notas ?? "",
    });
    setEditOpen(true);
  };

  const openDelete = (animal: Animal) => {
    setSelectedAnimal(animal);
    setDeleteOpen(true);
  };

  const handleCreate = async (values: AnimalForm) => {
    setSubmitting(true);
    try {
      const dto: CreateAnimalDTO = {
        ...values,
        sexo: values.sexo as "macho" | "hembra",
      };
      const created = await createAnimal(dto);
      setAnimals((prev) => [created, ...prev]);
      toast.success("Animal creado");
      setCreateOpen(false);
    } catch {
      // Error already toasted
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: AnimalForm) => {
    if (!selectedAnimal) return;
    setSubmitting(true);
    try {
      const updated = await updateAnimal(selectedAnimal.id, values);
      setAnimals((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      toast.success("Animal actualizado");
      setEditOpen(false);
    } catch {
      // Error already toasted
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnimal) return;
    setSubmitting(true);
    try {
      await deleteAnimal(selectedAnimal.id);
      setAnimals((prev) => prev.filter((a) => a.id !== selectedAnimal.id));
      toast.success("Animal eliminado");
      setDeleteOpen(false);
    } catch {
      // Error already toasted
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFincaFilter("");
    setSexoFilter("");
    setCategoriaFilter("");
    setEstadoFilter("");
    setPage(1);
  };

  const hasFilters =
    search || fincaFilter || sexoFilter || categoriaFilter || estadoFilter;

  const columns: DataTableColumn<Animal>[] = [
    {
      key: "identificador",
      header: "Identificador",
      render: (animal) => (
        <div>
          <p className="font-medium text-foreground">
            {animal.identificador_principal ?? animal.codigo ?? "—"}
          </p>
          {animal.nombre && (
            <p className="text-xs text-muted-foreground">{animal.nombre}</p>
          )}
        </div>
      ),
    },
    {
      key: "sexo",
      header: "Sexo",
      render: (animal) => (
        <Badge variant={getSexoBadgeVariant(animal.sexo)}>
          {animal.sexo === "hembra" ? "Hembra" : "Macho"}
        </Badge>
      ),
    },
    {
      key: "categoria",
      header: "Categoría",
      render: (animal) => (
        <span className="text-sm text-foreground">
          {animal.categoria ?? "—"}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (animal) => (
        <Badge variant={getEstadoBadgeVariant(animal.estado)}>
          {animal.estado}
        </Badge>
      ),
    },
    {
      key: "finca",
      header: "Finca / Lote",
      render: (animal) => (
        <div className="text-sm">
          <p className="text-foreground">{animal.finca_nombre ?? "—"}</p>
          {animal.lote_nombre && (
            <p className="text-xs text-muted-foreground">
              {animal.lote_nombre}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (animal) => (
        <DropdownMenu
          items={[
            {
              label: "Ver perfil",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/dashboard/animales/${animal.id}`),
            },
            ...(canEdit
              ? [
                {
                  label: "Editar",
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: () => openEdit(animal),
                },
              ]
              : []),
            ...(canDelete
              ? [
                {
                  label: "Eliminar",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => openDelete(animal),
                  variant: "danger" as const,
                },
              ]
              : []),
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
          subtitle="Inventario"
          title="Animales"
          description="Gestiona el inventario de animales de tu empresa."
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo animal
              </Button>
            ) : undefined
          }
        />

        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5">
            <FiltersBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="Buscar por código o nombre..."
              showClear={!!hasFilters}
              onClear={clearFilters}
            >
              <SelectFilter
                value={fincaFilter}
                onChange={(v) => {
                  setFincaFilter(v);
                  setPage(1);
                }}
                options={fincaOptions}
                placeholder="Finca"
              />
              <SelectFilter
                value={sexoFilter}
                onChange={(v) => {
                  setSexoFilter(v);
                  setPage(1);
                }}
                options={sexoOptions}
                placeholder="Sexo"
              />
              <SelectFilter
                value={categoriaFilter}
                onChange={(v) => {
                  setCategoriaFilter(v);
                  setPage(1);
                }}
                options={categoriaOptions}
                placeholder="Categoría"
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
              data={animals}
              keyExtractor={(a) => a.id}
              loading={loading}
              error={error}
              onRetry={loadAnimals}
              emptyState={{
                title: "Sin animales",
                description: "Agrega tu primer animal para comenzar.",
                action: canCreate
                  ? { label: "Nuevo animal", onClick: openCreate }
                  : undefined,
              }}
            />

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Nuevo animal"
          description="Ingresa los datos del animal."
        >
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreate)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input {...form.register("codigo")} placeholder="Ej: BOV-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...form.register("nombre")} placeholder="Opcional" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sexo *</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("sexo")}
                >
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("categoria")}
                >
                  <option value="">Seleccionar</option>
                  {categoriaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("estado")}
                >
                  {estadoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Finca</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("finca_id")}
                >
                  <option value="">Seleccionar</option>
                  {fincas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha nacimiento</label>
                <Input type="date" {...form.register("fecha_nacimiento")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Raza</label>
                <Input {...form.register("raza")} placeholder="Ej: Brahman" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input {...form.register("notas")} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Editar animal"
          description="Actualiza los datos del animal."
        >
          <form className="space-y-4" onSubmit={form.handleSubmit(handleEdit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input {...form.register("codigo")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...form.register("nombre")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sexo</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("sexo")}
                >
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("categoria")}
                >
                  <option value="">Seleccionar</option>
                  {categoriaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("estado")}
                >
                  {estadoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Finca</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  {...form.register("finca_id")}
                >
                  <option value="">Seleccionar</option>
                  {fincas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar animal"
          description={`¿Estás seguro de eliminar "${selectedAnimal?.nombre || selectedAnimal?.codigo || "este animal"}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={submitting}
        />
      </div>
    </MotionFadeSlide>
  );
}
