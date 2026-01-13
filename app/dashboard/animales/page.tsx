"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FiltersBar, SelectFilter } from "@/components/ui/filters-bar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MotionFadeSlide } from "@/components/ui/animate";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import { ImageUpload } from "@/components/ui/image-upload";
import NoPermission from "@/components/no-permission";

import {
  fetchAnimales,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  fetchRazas,
  fetchColoresPelaje,
  buscarAnimales,
  createRaza,
  createColor,
  uploadAnimalPhoto,
  type AnimalesQuery,
  type CreateRazaDTO,
  type CreateColorDTO,
} from "@/lib/api/animales.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import type {
  Animal,
  CreateAnimalDTO,
  Finca,
  Raza,
  ColorPelaje,
} from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

const animalSchema = z.object({
  nombre: z.string().optional(),
  sexo: z.enum(["M", "F"]),
  fecha_nacimiento: z.string().optional(),
  fecha_nacimiento_estimada: z.boolean().optional(),
  id_raza: z.string().optional(),
  id_color_pelaje: z.string().optional(),
  id_finca: z.string().min(1, "La finca es obligatoria"),
  padre_id: z.string().optional(),
  madre_id: z.string().optional(),
  notas: z.string().optional(),
});

type AnimalForm = z.infer<typeof animalSchema>;

const sexoOptions = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Hembra" },
];

function getSexoBadgeVariant(sexo: string) {
  return sexo === "F" || sexo === "hembra" ? "default" : "info";
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
  const [razas, setRazas] = useState<Raza[]>([]);
  const [colores, setColores] = useState<ColorPelaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [fincaFilter, setFincaFilter] = useState("");
  const [sexoFilter, setSexoFilter] = useState("");
  const [razaFilter, setRazaFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState("");
  const [fechaHastaFilter, setFechaHastaFilter] = useState("");
  const [conPadreFilter, setConPadreFilter] = useState(false);
  const [conMadreFilter, setConMadreFilter] = useState(false);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modals for razas/colores
  const [createRazaOpen, setCreateRazaOpen] = useState(false);
  const [createColorOpen, setCreateColorOpen] = useState(false);
  const [creatingRaza, setCreatingRaza] = useState(false);
  const [creatingColor, setCreatingColor] = useState(false);

  // Forms for razas/colores
  const [razaForm, setRazaForm] = useState({ codigo: "", nombre: "" });
  const [colorForm, setColorForm] = useState({ codigo: "", nombre: "" });

  // Animal search for padre/madre
  const [padreSearchResults, setPadreSearchResults] = useState<AutocompleteOption[]>([]);
  const [madreSearchResults, setMadreSearchResults] = useState<AutocompleteOption[]>([]);
  const [searchingPadre, setSearchingPadre] = useState(false);
  const [searchingMadre, setSearchingMadre] = useState(false);

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<AnimalForm>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      nombre: "",
      sexo: "M",
      fecha_nacimiento: "",
      fecha_nacimiento_estimada: false,
      id_raza: "",
      id_color_pelaje: "",
      id_finca: "",
      padre_id: "",
      madre_id: "",
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
        id_finca: fincaFilter || undefined,
        finca_id: fincaFilter || undefined,
        sexo: sexoFilter || undefined,
        id_raza: razaFilter || undefined,
        id_color_pelaje: colorFilter || undefined,
        fecha_nacimiento_desde: fechaDesdeFilter || undefined,
        fecha_nacimiento_hasta: fechaHastaFilter || undefined,
        con_padre: conPadreFilter || undefined,
        con_madre: conMadreFilter || undefined,
      };
      const response = await fetchAnimales(query);
      setAnimals(response.items ?? []);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    fincaFilter,
    sexoFilter,
    razaFilter,
    colorFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    conPadreFilter,
    conMadreFilter,
  ]);

  const loadFincas = useCallback(async () => {
    try {
      const response = await fetchFincas({ limit: 100 });
      setFincas(response.items ?? []);
    } catch {
      // Silent fail for fincas dropdown
    }
  }, []);

  const loadRazas = useCallback(async () => {
    try {
      const data = await fetchRazas();
      setRazas(data);
    } catch {
      // Silent fail
    }
  }, []);

  const loadColores = useCallback(async () => {
    try {
      const data = await fetchColoresPelaje();
      setColores(data);
    } catch {
      // Silent fail
    }
  }, []);

  const handleSearchPadre = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPadreSearchResults([]);
      return;
    }
    setSearchingPadre(true);
    try {
      const results = await buscarAnimales(query, "M");
      setPadreSearchResults(
        results.map((a) => ({
          value: a.id,
          label: a.nombre || a.identificacion || `Animal ${a.id.slice(0, 8)}`,
          description: a.identificacion || undefined,
        }))
      );
    } catch {
      setPadreSearchResults([]);
    } finally {
      setSearchingPadre(false);
    }
  }, []);

  const handleSearchMadre = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setMadreSearchResults([]);
      return;
    }
    setSearchingMadre(true);
    try {
      const results = await buscarAnimales(query, "F");
      setMadreSearchResults(
        results.map((a) => ({
          value: a.id,
          label: a.nombre || a.identificacion || `Animal ${a.id.slice(0, 8)}`,
          description: a.identificacion || undefined,
        }))
      );
    } catch {
      setMadreSearchResults([]);
    } finally {
      setSearchingMadre(false);
    }
  }, []);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  useEffect(() => {
    loadFincas();
    loadRazas();
    loadColores();
  }, [loadFincas, loadRazas, loadColores]);

  const fincaOptions = useMemo(
    () => fincas.map((f) => ({ value: f.id, label: f.nombre })),
    [fincas]
  );

  const razaOptions = useMemo(
    () => razas.map((r) => ({ value: r.id, label: r.nombre })),
    [razas]
  );

  const colorOptions = useMemo(
    () => colores.map((c) => ({ value: c.id, label: c.nombre })),
    [colores]
  );

  const openCreate = () => {
    form.reset({
      nombre: "",
      sexo: "M",
      fecha_nacimiento: "",
      fecha_nacimiento_estimada: false,
      id_raza: "",
      id_color_pelaje: "",
      id_finca: "",
      padre_id: "",
      madre_id: "",
      notas: "",
    });
    setPadreSearchResults([]);
    setMadreSearchResults([]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditOpen(false);
    setCreateOpen(true);
  };

  const openEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    const sexoValue = animal.sexo === "hembra" || animal.sexo === "F" ? "F" : "M";
    form.reset({
      nombre: animal.nombre ?? "",
      sexo: sexoValue,
      fecha_nacimiento: animal.fecha_nacimiento ?? "",
      fecha_nacimiento_estimada: animal.fecha_nacimiento_estimada ?? false,
      id_raza: animal.id_raza ?? "",
      id_color_pelaje: animal.id_color_pelaje ?? "",
      id_finca: animal.id_finca ?? animal.finca_id ?? "",
      padre_id: animal.padre_id ?? "",
      madre_id: animal.madre_id ?? "",
      notas: animal.notas ?? "",
    });
    // Load padre/madre names if they exist
    if (animal.padre_id && animal.padre_nombre) {
      setPadreSearchResults([
        {
          value: animal.padre_id,
          label: animal.padre_nombre,
        },
      ]);
    } else {
      setPadreSearchResults([]);
    }
    if (animal.madre_id && animal.madre_nombre) {
      setMadreSearchResults([
        {
          value: animal.madre_id,
          label: animal.madre_nombre,
        },
      ]);
    } else {
      setMadreSearchResults([]);
    }
    // Load photo preview if exists
    setPhotoFile(null);
    setPhotoPreview(animal.foto_url ?? null);
    setCreateOpen(false);
    setEditOpen(true);
  };

  const openDelete = (animal: Animal) => {
    setSelectedAnimal(animal);
    setDeleteOpen(true);
  };

  const closeForm = () => {
    setCreateOpen(false);
    setEditOpen(false);
    setSelectedAnimal(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreate = async (values: AnimalForm) => {
    setSubmitting(true);
    try {
      const dto: CreateAnimalDTO = {
        ...values,
      };
      const created = await createAnimal(dto);
      await loadAnimals();
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
      
      // Upload photo if a new one was selected
      if (photoFile) {
        try {
          await uploadAnimalPhoto(selectedAnimal.id, photoFile);
        } catch (photoError) {
          // Log but don't fail the update
          console.error("Error uploading photo:", photoError);
          toast.error("Animal actualizado, pero hubo un error al subir la foto");
        }
      }
      
      await loadAnimals();
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
      await loadAnimals();
      toast.success("Animal eliminado");
      setDeleteOpen(false);
    } catch {
      // Error already toasted
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRaza = async () => {
    if (!razaForm.codigo || !razaForm.nombre) {
      toast.error("Código y nombre son requeridos");
      return;
    }
    setCreatingRaza(true);
    try {
      const nuevaRaza = await createRaza(razaForm);
      await loadRazas();
      toast.success("Raza creada");
      setCreateRazaOpen(false);
      setRazaForm({ codigo: "", nombre: "" });
      // Seleccionar la nueva raza en el formulario
      form.setValue("id_raza", nuevaRaza.id);
    } catch {
      // Error already toasted
    } finally {
      setCreatingRaza(false);
    }
  };

  const handleCreateColor = async () => {
    if (!colorForm.codigo || !colorForm.nombre) {
      toast.error("Código y nombre son requeridos");
      return;
    }
    setCreatingColor(true);
    try {
      const nuevoColor = await createColor(colorForm);
      await loadColores();
      toast.success("Color creado");
      setCreateColorOpen(false);
      setColorForm({ codigo: "", nombre: "" });
      // Seleccionar el nuevo color en el formulario
      form.setValue("id_color_pelaje", nuevoColor.id);
    } catch {
      // Error already toasted
    } finally {
      setCreatingColor(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFincaFilter("");
    setSexoFilter("");
    setRazaFilter("");
    setColorFilter("");
    setFechaDesdeFilter("");
    setFechaHastaFilter("");
    setConPadreFilter(false);
    setConMadreFilter(false);
    setPage(1);
  };

  const hasFilters =
    search ||
    fincaFilter ||
    sexoFilter ||
    razaFilter ||
    colorFilter ||
    fechaDesdeFilter ||
    fechaHastaFilter ||
    conPadreFilter ||
    conMadreFilter;

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
      render: (animal) => {
        const sexoValue = animal.sexo === "F" || animal.sexo === "hembra" ? "F" : "M";
        return (
          <Badge variant={getSexoBadgeVariant(sexoValue)}>
            {sexoValue === "F" ? "Hembra" : "Macho"}
        </Badge>
        );
      },
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
            {(createOpen || editOpen) && (
              <Card className="border-primary/20">
                <CardHeader className="border-b border-border">
                  <div className="space-y-1">
                    <CardTitle>
                      {editOpen ? "Editar animal" : "Nuevo animal"}
                    </CardTitle>
                    <CardDescription>
                      {editOpen
                        ? "Actualiza los datos del animal."
                        : "Ingresa los datos del animal."}
                    </CardDescription>
                  </div>
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={closeForm}
                      aria-label="Cerrar formulario"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(
                    editOpen ? handleEdit : handleCreate
                  )}
                >
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="id_finca">Finca *</Label>
                            <select
                              id="id_finca"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              {...form.register("id_finca")}
                            >
                              <option value="">Seleccionar</option>
                              {fincas.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.nombre}
                                </option>
                              ))}
                            </select>
                            {form.formState.errors.id_finca && (
                              <p className="text-xs text-destructive">
                                {form.formState.errors.id_finca.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre</Label>
                            <Input
                              id="nombre"
                              {...form.register("nombre")}
                              placeholder="Opcional"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="sexo">Sexo *</Label>
                            <select
                              id="sexo"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              {...form.register("sexo")}
                            >
                              <option value="M">Macho</option>
                              <option value="F">Hembra</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fecha_nacimiento">
                              Fecha de nacimiento
                            </Label>
                            <Controller
                              name="fecha_nacimiento"
                              control={form.control}
                              render={({ field }) => (
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Seleccionar fecha"
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="fecha_nacimiento_estimada"
                              checked={form.watch("fecha_nacimiento_estimada")}
                              onCheckedChange={(checked) =>
                                form.setValue(
                                  "fecha_nacimiento_estimada",
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor="fecha_nacimiento_estimada"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Fecha de nacimiento estimada
                            </Label>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="id_raza">Raza</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCreateRazaOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Nueva
                              </Button>
                            </div>
                            <select
                              id="id_raza"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              {...form.register("id_raza")}
                            >
                              <option value="">Seleccionar</option>
                              {razas.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="id_color_pelaje">
                                Color de pelaje
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCreateColorOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Nuevo
                              </Button>
                            </div>
                            <select
                              id="id_color_pelaje"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              {...form.register("id_color_pelaje")}
                            >
                              <option value="">Seleccionar</option>
                              {colores.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="padre_id">Padre</Label>
                            <Controller
                              name="padre_id"
                              control={form.control}
                              render={({ field }) => (
                                <Autocomplete
                                  value={field.value}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    if (!value) {
                                      setPadreSearchResults([]);
                                    }
                                  }}
                                  options={padreSearchResults}
                                  placeholder="Buscar padre (macho)..."
                                  searchPlaceholder="Buscar por nombre o identificación..."
                                  emptyText="No se encontraron animales machos"
                                  onSearch={handleSearchPadre}
                                  loading={searchingPadre}
                                />
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="madre_id">Madre</Label>
                            <Controller
                              name="madre_id"
                              control={form.control}
                              render={({ field }) => (
                                <Autocomplete
                                  value={field.value}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    if (!value) {
                                      setMadreSearchResults([]);
                                    }
                                  }}
                                  options={madreSearchResults}
                                  placeholder="Buscar madre (hembra)..."
                                  searchPlaceholder="Buscar por nombre o identificación..."
                                  emptyText="No se encontraron animales hembras"
                                  onSearch={handleSearchMadre}
                                  loading={searchingMadre}
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notas">Notas</Label>
                          <textarea
                            id="notas"
                            className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                            {...form.register("notas")}
                            placeholder="Opcional"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Foto del animal
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sube una imagen clara para identificarlo.
                          </p>
                        </div>
                        <ImageUpload
                          value={photoFile || photoPreview}
                          onChange={(file) => {
                            setPhotoFile(file);
                            if (!file) {
                              setPhotoPreview(null);
                            }
                          }}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2 border-t border-border">
                    <Button type="button" variant="ghost" onClick={closeForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {editOpen ? "Guardar cambios" : "Guardar"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
            {!createOpen && !editOpen && (
              <>
                <FiltersBar
                  search={search}
                  onSearchChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  searchPlaceholder="Buscar por nombre o identificación..."
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
                    value={razaFilter}
                    onChange={(v) => {
                      setRazaFilter(v);
                      setPage(1);
                    }}
                    options={razaOptions}
                    placeholder="Raza"
                  />
                  <SelectFilter
                    value={colorFilter}
                    onChange={(v) => {
                      setColorFilter(v);
                      setPage(1);
                    }}
                    options={colorOptions}
                    placeholder="Color"
                  />
                  <div className="flex items-center gap-2">
                    <DatePicker
                      value={fechaDesdeFilter}
                      onChange={(v) => {
                        setFechaDesdeFilter(v);
                        setPage(1);
                      }}
                      placeholder="Nacimiento desde"
                      className="w-[180px]"
                    />
                    <DatePicker
                      value={fechaHastaFilter}
                      onChange={(v) => {
                        setFechaHastaFilter(v);
                        setPage(1);
                      }}
                      placeholder="Nacimiento hasta"
                      className="w-[180px]"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        checked={conPadreFilter}
                        onCheckedChange={(checked) => {
                          setConPadreFilter(!!checked);
                          setPage(1);
                        }}
                      />
                      Con padre
                    </Label>
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        checked={conMadreFilter}
                        onCheckedChange={(checked) => {
                          setConMadreFilter(!!checked);
                          setPage(1);
                        }}
                      />
                      Con madre
                    </Label>
                  </div>
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
              </>
            )}
          </CardContent>
        </Card>

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

        {/* Create Raza Modal */}
        <Modal
          open={createRazaOpen}
          onClose={() => {
            setCreateRazaOpen(false);
            setRazaForm({ codigo: "", nombre: "" });
          }}
          title="Nueva raza"
          description="Crea una nueva raza para tu empresa."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raza_codigo">Código *</Label>
              <Input
                id="raza_codigo"
                value={razaForm.codigo}
                onChange={(e) =>
                  setRazaForm({ ...razaForm, codigo: e.target.value })
                }
                placeholder="Ej: BRA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raza_nombre">Nombre *</Label>
              <Input
                id="raza_nombre"
                value={razaForm.nombre}
                onChange={(e) =>
                  setRazaForm({ ...razaForm, nombre: e.target.value })
                }
                placeholder="Ej: Brahman"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateRazaOpen(false);
                  setRazaForm({ codigo: "", nombre: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateRaza}
                disabled={creatingRaza}
              >
                {creatingRaza && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Color Modal */}
        <Modal
          open={createColorOpen}
          onClose={() => {
            setCreateColorOpen(false);
            setColorForm({ codigo: "", nombre: "" });
          }}
          title="Nuevo color de pelaje"
          description="Crea un nuevo color de pelaje."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color_codigo">Código *</Label>
              <Input
                id="color_codigo"
                value={colorForm.codigo}
                onChange={(e) =>
                  setColorForm({ ...colorForm, codigo: e.target.value })
                }
                placeholder="Ej: NEGRO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color_nombre">Nombre *</Label>
              <Input
                id="color_nombre"
                value={colorForm.nombre}
                onChange={(e) =>
                  setColorForm({ ...colorForm, nombre: e.target.value })
                }
                placeholder="Ej: Negro"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateColorOpen(false);
                  setColorForm({ codigo: "", nombre: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateColor}
                disabled={creatingColor}
              >
                {creatingColor && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MotionFadeSlide>
  );
}
