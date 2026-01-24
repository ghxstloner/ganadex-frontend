"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    Calendar,
    Heart,
    IdCard,
    MapPin,
    PawPrint,
    Stethoscope,
    Pencil,
    Save,
    X,
    Plus,
    Trash2,
    Loader2,
    Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { MotionFadeSlide } from "@/components/ui/animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import NoPermission from "@/components/no-permission";

import {
    fetchAnimalPerfil,
    updateAnimal,
    uploadAnimalPhoto,
    deleteAnimalPhoto,
    fetchAnimalIdentificaciones,
    createIdentificacion,
    updateIdentificacion,
    deleteIdentificacion,
    setIdentificacionPrincipal,
    buscarAnimales,
    fetchRazas,
    fetchColoresPelaje,
    fetchTiposIdentificacion,
    fetchCategoriasAnimales,
    fetchEstadosAnimales,
    fetchCategoriaHistorial,
    fetchEstadoHistorial,
    createCategoriaHistorial,
    createEstadoHistorial,
    type CategoriaAnimal,
    type EstadoAnimal,
    type CreateCategoriaHistorialDTO,
    type CreateEstadoHistorialDTO,
} from "@/lib/api/animales.service";
import { fetchFincas } from "@/lib/api/fincas.service";
import {
    fetchAnimalMovimientos,
    fetchAnimalUbicacionActual,
} from "@/lib/api/movimientos.service";
import type {
    AnimalPerfil,
    Identificacion,
    Finca,
    Raza,
    ColorPelaje,
    TipoIdentificacion,
    Movimiento,
    UbicacionActual,
} from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";
import { buildImageUrl } from "@/lib/api/client";

const animalFormSchema = z.object({
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

type AnimalForm = z.infer<typeof animalFormSchema>;

const identificacionFormSchema = z.object({
    id_tipo_identificacion: z.string().min(1, "El tipo es obligatorio"),
    valor: z.string().min(1, "El valor es obligatorio").max(120),
    fecha_asignacion: z.string().min(1, "La fecha es obligatoria"),
    activo: z.boolean().optional(),
    es_principal: z.boolean().optional(),
    observaciones: z.string().optional(),
});

type IdentificacionForm = z.infer<typeof identificacionFormSchema>;

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

function formatDate(date?: string | Date | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatAge(animal: AnimalPerfil) {
    const pluralize = (value: number, singular: string, plural: string) =>
        value === 1 ? singular : plural;

    if (animal.fecha_nacimiento) {
        const birthDate = new Date(animal.fecha_nacimiento);
        if (!isNaN(birthDate.getTime())) {
            const now = new Date();
            let days = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
            if (days < 0) days = 0;

            if (days < 7) {
                return `${days} ${pluralize(days, "dia", "dias")}`;
            }

            if (days < 30) {
                const weeks = Math.floor(days / 7);
                const remainingDays = days % 7;
                const weeksLabel = `${weeks} ${pluralize(weeks, "semana", "semanas")}`;
                if (remainingDays > 0) {
                    return `${weeksLabel} ${remainingDays} ${pluralize(remainingDays, "dia", "dias")}`;
                }
                return weeksLabel;
            }

            const months = Math.max(1, Math.floor(days / 30));
            return `${months} ${pluralize(months, "mes", "meses")}`;
        }
    }

    if (animal.edad_meses !== undefined && animal.edad_meses !== null) {
        return `${animal.edad_meses} ${pluralize(animal.edad_meses, "mes", "meses")}`;
    }

    return "No disponible";
}

function EditIdentificacionForm({
    ident,
    tiposIdentificacion,
    onSave,
    onCancel,
}: {
    ident: Identificacion;
    tiposIdentificacion: Array<{ id: string; nombre: string }>;
    onSave: (values: IdentificacionForm) => void;
    onCancel: () => void;
}) {
    const editForm = useForm<IdentificacionForm>({
        resolver: zodResolver(identificacionFormSchema),
        defaultValues: {
            id_tipo_identificacion: ident.tipo_id ?? "",
            valor: ident.valor,
            fecha_asignacion: ident.fecha_asignacion.split("T")[0],
            activo: ident.activo,
            es_principal: ident.es_principal ?? false,
            observaciones: ident.observaciones ?? "",
        },
    });

    return (
        <Card className="border-primary/20">
            <CardContent className="p-4">
                <form
                    onSubmit={editForm.handleSubmit(onSave)}
                    className="space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <select
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                {...editForm.register("id_tipo_identificacion")}
                            >
                                <option value="">Seleccionar</option>
                                {tiposIdentificacion.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor *</Label>
                            <Input {...editForm.register("valor")} />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Fecha de asignación *</Label>
                            <Controller
                                name="fecha_asignacion"
                                control={editForm.control}
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Seleccionar fecha"
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 pt-8">
                                <Checkbox
                                    checked={editForm.watch("activo") ?? true}
                                    onCheckedChange={(checked) =>
                                        editForm.setValue("activo", !!checked)
                                    }
                                />
                                <Label className="text-sm font-normal cursor-pointer">Activa</Label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={editForm.watch("es_principal") ?? false}
                                onCheckedChange={(checked) => {
                                    editForm.setValue("es_principal", !!checked);
                                }}
                            />
                            <Label className="text-sm font-normal cursor-pointer flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                Marcar como identificación principal
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Solo una identificación puede ser principal. Si marcas esta, la actual principal se desmarcará automáticamente.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                            {...editForm.register("observaciones")}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function AnimalPerfilPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const mode = searchParams.get("mode") === "edit" ? "edit" : "view";

    const session = getStoredSession();
    const canView = hasPermission(session, "animales.view");
    const canEdit = hasPermission(session, "animales.edit");
    const canViewMovimientos = hasPermission(session, "movimientos.view");

    const [animal, setAnimal] = useState<AnimalPerfil | null>(null);
    const [identificaciones, setIdentificaciones] = useState<Identificacion[]>([]);
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [razas, setRazas] = useState<Raza[]>([]);
    const [colores, setColores] = useState<ColorPelaje[]>([]);
    const [tiposIdentificacion, setTiposIdentificacion] = useState<TipoIdentificacion[]>([]);
    const [categorias, setCategorias] = useState<CategoriaAnimal[]>([]);
    const [estados, setEstados] = useState<EstadoAnimal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("resumen");

    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [movimientosPage, setMovimientosPage] = useState(1);
    const [movimientosTotalPages, setMovimientosTotalPages] = useState(1);
    const [movimientosLoading, setMovimientosLoading] = useState(false);
    const [movimientosError, setMovimientosError] = useState(false);
    const [ubicacionActual, setUbicacionActual] = useState<UbicacionActual | null>(null);

    // Form states
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [hadPhotoInitially, setHadPhotoInitially] = useState(false);

    // Identificaciones states
    const [editingIdentificacion, setEditingIdentificacion] = useState<string | null>(null);
    const [creatingIdentificacion, setCreatingIdentificacion] = useState(false);
    const [deletingIdentificacion, setDeletingIdentificacion] = useState<string | null>(null);
    const [padreSearchResults, setPadreSearchResults] = useState<AutocompleteOption[]>([]);
    const [madreSearchResults, setMadreSearchResults] = useState<AutocompleteOption[]>([]);
    const [searchingPadre, setSearchingPadre] = useState(false);
    const [searchingMadre, setSearchingMadre] = useState(false);
    
    // Categoría/Estado states
    const [editingCategoria, setEditingCategoria] = useState(false);
    const [editingEstado, setEditingEstado] = useState(false);
    const [submittingCategoria, setSubmittingCategoria] = useState(false);
    const [submittingEstado, setSubmittingEstado] = useState(false);

    const animalForm = useForm<AnimalForm>({
        resolver: zodResolver(animalFormSchema),
    });

    const identificacionForm = useForm<IdentificacionForm>({
        resolver: zodResolver(identificacionFormSchema),
        defaultValues: {
            activo: true,
            es_principal: false,
            fecha_asignacion: new Date().toISOString().split("T")[0],
        },
    });

    const categoriaForm = useForm<CreateCategoriaHistorialDTO>({
        defaultValues: {
            id_categoria_animal: "",
            fecha_inicio: new Date().toISOString().split("T")[0],
            observaciones: "",
        },
    });

    const estadoForm = useForm<CreateEstadoHistorialDTO>({
        defaultValues: {
            id_estado_animal: "",
            fecha_inicio: new Date().toISOString().split("T")[0],
            motivo: "",
        },
    });

    const loadAnimal = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await fetchAnimalPerfil(id);
            setAnimal(data);
            
            // Load identificaciones
            const identData = await fetchAnimalIdentificaciones(id);
            setIdentificaciones(identData);

            // Set form values
            const sexoValue = data.sexo === "hembra" || data.sexo === "F" ? "F" : "M";
            animalForm.reset({
                nombre: data.nombre ?? "",
                sexo: sexoValue,
                fecha_nacimiento: data.fecha_nacimiento ?? "",
                fecha_nacimiento_estimada: data.fecha_nacimiento_estimada ?? false,
                id_raza: data.id_raza ?? "",
                id_color_pelaje: data.id_color_pelaje ?? "",
                id_finca: data.id_finca ?? data.finca_id ?? "",
                padre_id: data.padre_id ?? "",
                madre_id: data.madre_id ?? "",
                notas: data.notas ?? "",
            });

            // Load padre/madre names
            if (data.padre_id && data.padre_nombre) {
                setPadreSearchResults([{ value: data.padre_id, label: data.padre_nombre }]);
            }
            if (data.madre_id && data.madre_nombre) {
                setMadreSearchResults([{ value: data.madre_id, label: data.madre_nombre }]);
            }

            // Load photo preview
            const photoUrl = buildImageUrl(data.foto_url);
            setPhotoPreview(photoUrl);
            setHadPhotoInitially(!!data.foto_url);
        } catch {
            setError(true);
            toast.error("No se pudo cargar el perfil del animal");
        } finally {
            setLoading(false);
        }
    }, [id, animalForm]);

    const loadFincas = useCallback(async () => {
        try {
            const response = await fetchFincas({ limit: 100 });
            setFincas(response.items ?? []);
        } catch {
            // Silent fail
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

    const loadTiposIdentificacion = useCallback(async () => {
        try {
            const data = await fetchTiposIdentificacion();
            setTiposIdentificacion(data);
        } catch {
            // Silent fail
        }
    }, []);

    const loadCategorias = useCallback(async (sexo?: "M" | "F") => {
        try {
            const data = await fetchCategoriasAnimales(sexo);
            setCategorias(data);
        } catch {
            // Silent fail
        }
    }, []);

    const loadEstados = useCallback(async () => {
        try {
            const data = await fetchEstadosAnimales();
            setEstados(data);
        } catch {
            // Silent fail
        }
    }, []);

    const loadMovimientos = useCallback(async () => {
        if (!canViewMovimientos) return;
        setMovimientosLoading(true);
        setMovimientosError(false);
        try {
            const [movimientosRes, ubicacionRes] = await Promise.all([
                fetchAnimalMovimientos(id, { page: movimientosPage, limit: 10 }),
                fetchAnimalUbicacionActual(id),
            ]);
            setMovimientos(movimientosRes.items ?? []);
            setMovimientosTotalPages(movimientosRes.meta?.totalPages ?? 1);
            setUbicacionActual(ubicacionRes.ubicacionActual ?? null);
        } catch {
            setMovimientosError(true);
        } finally {
            setMovimientosLoading(false);
        }
    }, [canViewMovimientos, id, movimientosPage]);

    useEffect(() => {
        loadAnimal();
        loadFincas();
        loadRazas();
        loadColores();
        loadTiposIdentificacion();
        loadEstados();
    }, [loadAnimal, loadFincas, loadRazas, loadColores, loadTiposIdentificacion, loadEstados]);

    useEffect(() => {
        if (animal?.sexo) {
            const sexoValue = animal.sexo === "hembra" || animal.sexo === "F" ? "F" : "M";
            loadCategorias(sexoValue);
        }
    }, [animal?.sexo, loadCategorias]);

    useEffect(() => {
        if (activeTab === "movimientos") {
            loadMovimientos();
        }
    }, [activeTab, loadMovimientos]);

    useEffect(() => {
        setMovimientosPage(1);
    }, [id]);

    const handleSearchPadre = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setPadreSearchResults([]);
            return;
        }
        setSearchingPadre(true);
        try {
            const results = await buscarAnimales(query, "M", id);
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
    }, [id]);

    const handleSearchMadre = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setMadreSearchResults([]);
            return;
        }
        setSearchingMadre(true);
        try {
            const results = await buscarAnimales(query, "F", id);
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
    }, [id]);

    const handleSaveAnimal = async (values: AnimalForm) => {
        setSubmitting(true);
        try {
            await updateAnimal(id, values);

            // Handle photo
            const photoWasRemoved = hadPhotoInitially && !photoFile && !photoPreview;
            if (photoWasRemoved) {
                try {
                    await deleteAnimalPhoto(id);
                } catch (photoError) {
                    console.error("Error eliminando foto:", photoError);
                    toast.error("Animal actualizado, pero hubo un error al eliminar la foto");
                }
            }

            if (photoFile) {
                try {
                    await uploadAnimalPhoto(id, photoFile);
                } catch (photoError) {
                    console.error("Error uploading photo:", photoError);
                    toast.error("Animal actualizado, pero hubo un error al subir la foto");
                }
            }

            await loadAnimal();
            toast.success("Animal actualizado");
            router.push(`/dashboard/animales/${id}`);
        } catch {
            // Error already toasted
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        router.push(`/dashboard/animales/${id}`);
    };

    const handleCreateIdentificacion = async (values: IdentificacionForm) => {
        try {
            const created = await createIdentificacion(id, {
                id_tipo_identificacion: values.id_tipo_identificacion,
                valor: values.valor,
                fecha_asignacion: values.fecha_asignacion,
                activo: values.activo ?? true,
                es_principal: values.es_principal ?? false,
                observaciones: values.observaciones ?? null,
            });
            await loadAnimal();
            setCreatingIdentificacion(false);
            identificacionForm.reset({
                activo: true,
                es_principal: false,
                fecha_asignacion: new Date().toISOString().split("T")[0],
            });
            toast.success("Identificación creada");
        } catch {
            // Error already toasted
        }
    };

    const handleUpdateIdentificacion = async (identId: string, values: IdentificacionForm) => {
        try {
            await updateIdentificacion(identId, {
                id_tipo_identificacion: values.id_tipo_identificacion,
                valor: values.valor,
                fecha_asignacion: values.fecha_asignacion,
                activo: values.activo,
                es_principal: values.es_principal ?? false,
                observaciones: values.observaciones ?? null,
            });
            await loadAnimal();
            setEditingIdentificacion(null);
            toast.success("Identificación actualizada");
        } catch {
            // Error already toasted
        }
    };

    const handleDeleteIdentificacion = async () => {
        if (!deletingIdentificacion) return;
        try {
            await deleteIdentificacion(deletingIdentificacion);
            await loadAnimal();
            setDeletingIdentificacion(null);
            toast.success("Identificación eliminada");
        } catch {
            // Error already toasted
        }
    };

    const handleSetPrincipal = async (identId: string | null | undefined) => {
        if (!identId) return;
        try {
            await setIdentificacionPrincipal(identId);
            await loadAnimal();
            toast.success("Identificación marcada como principal");
        } catch {
            // Error already toasted
        }
    };

    const handleChangeCategoria = async (values: CreateCategoriaHistorialDTO) => {
        setSubmittingCategoria(true);
        try {
            await createCategoriaHistorial(id, values);
            await loadAnimal();
            setEditingCategoria(false);
            categoriaForm.reset({
                id_categoria_animal: "",
                fecha_inicio: new Date().toISOString().split("T")[0],
                observaciones: "",
            });
            toast.success("Categoría actualizada");
        } catch {
            // Error already toasted
        } finally {
            setSubmittingCategoria(false);
        }
    };

    const handleChangeEstado = async (values: CreateEstadoHistorialDTO) => {
        setSubmittingEstado(true);
        try {
            await createEstadoHistorial(id, values);
            await loadAnimal();
            setEditingEstado(false);
            estadoForm.reset({
                id_estado_animal: "",
                fecha_inicio: new Date().toISOString().split("T")[0],
                motivo: "",
            });
            toast.success("Estado actualizado");
        } catch {
            // Error already toasted
        } finally {
            setSubmittingEstado(false);
        }
    };


    if (!canView) {
        return <NoPermission />;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-48 animate-pulse rounded-2xl bg-muted" />
                <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
        );
    }

    if (error || !animal) {
        return <ErrorState onRetry={loadAnimal} />;
    }

    const renderResumenTab = () => {
        if (mode === "edit") {
            return (
                <div className="space-y-6">
                    <form onSubmit={animalForm.handleSubmit(handleSaveAnimal)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="id_finca">Finca *</Label>
                                    <select
                                        id="id_finca"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        {...animalForm.register("id_finca")}
                                    >
                                        <option value="">Seleccionar</option>
                                        {fincas.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {animalForm.formState.errors.id_finca && (
                                        <p className="text-xs text-destructive">
                                            {animalForm.formState.errors.id_finca.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        {...animalForm.register("nombre")}
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
                                        {...animalForm.register("sexo")}
                                    >
                                        <option value="M">Macho</option>
                                        <option value="F">Hembra</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                                    <Controller
                                        name="fecha_nacimiento"
                                        control={animalForm.control}
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
                                        checked={animalForm.watch("fecha_nacimiento_estimada")}
                                        onCheckedChange={(checked) =>
                                            animalForm.setValue("fecha_nacimiento_estimada", !!checked)
                                        }
                                    />
                                    <Label htmlFor="fecha_nacimiento_estimada" className="text-sm font-normal cursor-pointer">
                                        Fecha de nacimiento estimada
                                    </Label>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="id_raza">Raza</Label>
                                    <select
                                        id="id_raza"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        {...animalForm.register("id_raza")}
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
                                    <Label htmlFor="id_color_pelaje">Color de pelaje</Label>
                                    <select
                                        id="id_color_pelaje"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        {...animalForm.register("id_color_pelaje")}
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
                                        control={animalForm.control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                    if (!value) setPadreSearchResults([]);
                                                }}
                                                options={padreSearchResults}
                                                placeholder="Buscar padre (macho)..."
                                                searchPlaceholder="Buscar por nombre o identificación..."
                                                emptyText="Escribe al menos 2 caracteres para buscar"
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
                                        control={animalForm.control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                    if (!value) setMadreSearchResults([]);
                                                }}
                                                options={madreSearchResults}
                                                placeholder="Buscar madre (hembra)..."
                                                searchPlaceholder="Buscar por nombre o identificación..."
                                                emptyText="Escribe al menos 2 caracteres para buscar"
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
                                    {...animalForm.register("notas")}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                            <div>
                                <p className="text-sm font-medium text-foreground">Foto del animal</p>
                                <p className="text-xs text-muted-foreground">Sube una imagen clara para identificarlo.</p>
                            </div>
                            <ImageUpload
                                value={photoFile || photoPreview}
                                onChange={(file) => {
                                    setPhotoFile(file);
                                    if (!file) setPhotoPreview(null);
                                }}
                                onRemove={() => {
                                    setPhotoFile(null);
                                    setPhotoPreview(null);
                                }}
                                disabled={submitting}
                            />
                        </div>
                    </div>
                    </form>

                    {/* Categoría y Estado - Fuera del formulario principal */}
                    <div className="space-y-6 mt-6">
                    {/* Categoría */}
                    <Card>
                        <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold">Categoría actual</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {animal?.categoria_actual
                                                        ? `${animal.categoria_actual.nombre} • Desde: ${formatDate(animal.categoria_actual.desde)}`
                                                        : "—"}
                                                </p>
                                            </div>
                                            {!editingCategoria && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingCategoria(true)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Cambiar categoría
                                                </Button>
                                            )}
                                        </div>
                                        {editingCategoria && (
                                            <div className="border-t pt-4 space-y-4">
                                                <form
                                                    onSubmit={categoriaForm.handleSubmit(handleChangeCategoria)}
                                                    className="space-y-4"
                                                >
                                                    <div className="space-y-2">
                                                        <Label>Categoría *</Label>
                                                        <select
                                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            {...categoriaForm.register("id_categoria_animal", {
                                                                required: "La categoría es obligatoria",
                                                            })}
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            {categorias.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Fecha de inicio *</Label>
                                                        <Controller
                                                            name="fecha_inicio"
                                                            control={categoriaForm.control}
                                                            rules={{ required: "La fecha es obligatoria" }}
                                                            render={({ field }) => (
                                                                <DatePicker
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder="Seleccionar fecha"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Observaciones</Label>
                                                        <textarea
                                                            className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            {...categoriaForm.register("observaciones")}
                                                            placeholder="Opcional"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingCategoria(false);
                                                                categoriaForm.reset({
                                                                    id_categoria_animal: "",
                                                                    fecha_inicio: new Date().toISOString().split("T")[0],
                                                                    observaciones: "",
                                                                });
                                                            }}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button type="submit" disabled={submittingCategoria}>
                                                            {submittingCategoria && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                            Guardar
                                                        </Button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {!editingCategoria && (
                                            <div className="border-t pt-4">
                                                <DataTable
                                                    columns={[
                                                        {
                                                            key: "categoria",
                                                            header: "Categoría",
                                                            render: (item) => item.categoria_nombre,
                                                        },
                                                        {
                                                            key: "inicio",
                                                            header: "Inicio",
                                                            render: (item) => formatDate(item.fecha_inicio),
                                                        },
                                                        {
                                                            key: "fin",
                                                            header: "Fin",
                                                            render: (item) => formatDate(item.fecha_fin),
                                                        },
                                                        {
                                                            key: "observaciones",
                                                            header: "Observaciones",
                                                            render: (item) => item.observaciones ?? "—",
                                                        },
                                                    ]}
                                                    data={animal?.historial_categorias ?? []}
                                                    keyExtractor={(item) => item.id}
                                                    emptyState={{
                                                        title: "Sin historial de categorías",
                                                        description: "Este animal no tiene categorías registradas.",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                    </Card>

                    {/* Estado */}
                    <Card>
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold">Estado actual</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {animal?.estado_actual
                                                        ? `${animal.estado_actual.nombre} • Desde: ${formatDate(animal.estado_actual.desde)}`
                                                        : "—"}
                                                </p>
                                            </div>
                                            {!editingEstado && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingEstado(true)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Cambiar estado
                                                </Button>
                                            )}
                                        </div>
                                        {editingEstado && (
                                            <div className="border-t pt-4 space-y-4">
                                                <form
                                                    onSubmit={estadoForm.handleSubmit(handleChangeEstado)}
                                                    className="space-y-4"
                                                >
                                                    <div className="space-y-2">
                                                        <Label>Estado *</Label>
                                                        <select
                                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            {...estadoForm.register("id_estado_animal", {
                                                                required: "El estado es obligatorio",
                                                            })}
                                                        >
                                                            <option value="">Seleccionar</option>
                                                            {estados.map((e) => (
                                                                <option key={e.id} value={e.id}>
                                                                    {e.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Fecha de inicio *</Label>
                                                        <Controller
                                                            name="fecha_inicio"
                                                            control={estadoForm.control}
                                                            rules={{ required: "La fecha es obligatoria" }}
                                                            render={({ field }) => (
                                                                <DatePicker
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder="Seleccionar fecha"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Motivo</Label>
                                                        <textarea
                                                            className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            {...estadoForm.register("motivo")}
                                                            placeholder="Opcional"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingEstado(false);
                                                                estadoForm.reset({
                                                                    id_estado_animal: "",
                                                                    fecha_inicio: new Date().toISOString().split("T")[0],
                                                                    motivo: "",
                                                                });
                                                            }}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button type="submit" disabled={submittingEstado}>
                                                            {submittingEstado && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                            Guardar
                                                        </Button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {!editingEstado && (
                                            <div className="border-t pt-4">
                                                <DataTable
                                                    columns={[
                                                        {
                                                            key: "estado",
                                                            header: "Estado",
                                                            render: (item) => item.estado_nombre,
                                                        },
                                                        {
                                                            key: "inicio",
                                                            header: "Inicio",
                                                            render: (item) => formatDate(item.fecha_inicio),
                                                        },
                                                        {
                                                            key: "fin",
                                                            header: "Fin",
                                                            render: (item) => formatDate(item.fecha_fin),
                                                        },
                                                        {
                                                            key: "motivo",
                                                            header: "Motivo",
                                                            render: (item) => item.motivo ?? "—",
                                                        },
                                                    ]}
                                                    data={animal?.historial_estados ?? []}
                                                    keyExtractor={(item) => item.id}
                                                    emptyState={{
                                                        title: "Sin historial de estados",
                                                        description: "Este animal no tiene estados registrados.",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Edad</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {formatAge(animal)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Ubicación</p>
                                    <p className="text-lg font-semibold text-foreground">{animal.finca_nombre ?? "—"}</p>
                                    {animal.potrero_nombre && (
                                        <p className="text-xs text-muted-foreground">{animal.potrero_nombre}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <PawPrint className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Raza</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {animal.raza_nombre ?? "No especificada"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Categoría */}
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold">Categoría actual</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {animal.categoria_actual
                                            ? `${animal.categoria_actual.nombre} • Desde: ${formatDate(animal.categoria_actual.desde)}`
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <DataTable
                                    columns={[
                                        {
                                            key: "categoria",
                                            header: "Categoría",
                                            render: (item) => item.categoria_nombre,
                                        },
                                        {
                                            key: "inicio",
                                            header: "Inicio",
                                            render: (item) => formatDate(item.fecha_inicio),
                                        },
                                        {
                                            key: "fin",
                                            header: "Fin",
                                            render: (item) => formatDate(item.fecha_fin),
                                        },
                                        {
                                            key: "observaciones",
                                            header: "Observaciones",
                                            render: (item) => item.observaciones ?? "—",
                                        },
                                    ]}
                                    data={animal.historial_categorias ?? []}
                                    keyExtractor={(item) => item.id}
                                    emptyState={{
                                        title: "Sin historial de categorías",
                                        description: "Este animal no tiene categorías registradas.",
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Estado */}
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold">Estado actual</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {animal.estado_actual
                                            ? `${animal.estado_actual.nombre} • Desde: ${formatDate(animal.estado_actual.desde)}`
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <DataTable
                                    columns={[
                                        {
                                            key: "estado",
                                            header: "Estado",
                                            render: (item) => item.estado_nombre,
                                        },
                                        {
                                            key: "inicio",
                                            header: "Inicio",
                                            render: (item) => formatDate(item.fecha_inicio),
                                        },
                                        {
                                            key: "fin",
                                            header: "Fin",
                                            render: (item) => formatDate(item.fecha_fin),
                                        },
                                        {
                                            key: "motivo",
                                            header: "Motivo",
                                            render: (item) => item.motivo ?? "—",
                                        },
                                    ]}
                                    data={animal.historial_estados ?? []}
                                    keyExtractor={(item) => item.id}
                                    emptyState={{
                                        title: "Sin historial de estados",
                                        description: "Este animal no tiene estados registrados.",
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderIdentificacionesTab = () => {
        if (mode === "edit") {
            return (
                <div className="space-y-4">
                    {creatingIdentificacion ? (
                        <Card className="border-primary/20">
                            <CardContent className="p-4">
                                <form
                                    onSubmit={identificacionForm.handleSubmit((values) =>
                                        handleCreateIdentificacion(values)
                                    )}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="tipo_identificacion">Tipo *</Label>
                                            <select
                                                id="tipo_identificacion"
                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                {...identificacionForm.register("id_tipo_identificacion")}
                                            >
                                                <option value="">Seleccionar</option>
                                                {tiposIdentificacion.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="valor_identificacion">Valor *</Label>
                                            <Input
                                                id="valor_identificacion"
                                                {...identificacionForm.register("valor")}
                                                placeholder="Ej: 12345"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="fecha_asignacion_identificacion">Fecha de asignación *</Label>
                                            <Controller
                                                name="fecha_asignacion"
                                                control={identificacionForm.control}
                                                render={({ field }) => (
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Seleccionar fecha"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2 pt-8">
                                                <Checkbox
                                                    id="activo_identificacion"
                                                    checked={identificacionForm.watch("activo") ?? true}
                                                    onCheckedChange={(checked) =>
                                                        identificacionForm.setValue("activo", !!checked)
                                                    }
                                                />
                                                <Label htmlFor="activo_identificacion" className="text-sm font-normal cursor-pointer">
                                                    Activa
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="es_principal_identificacion"
                                                checked={identificacionForm.watch("es_principal") ?? false}
                                                onCheckedChange={(checked) => {
                                                    identificacionForm.setValue("es_principal", !!checked);
                                                }}
                                            />
                                            <Label htmlFor="es_principal_identificacion" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                Marcar como identificación principal
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Solo una identificación puede ser principal. Si marcas esta, la actual principal se desmarcará automáticamente.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="observaciones_identificacion">Observaciones</Label>
                                        <textarea
                                            id="observaciones_identificacion"
                                            className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                                            {...identificacionForm.register("observaciones")}
                                            placeholder="Opcional"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setCreatingIdentificacion(false);
                                                identificacionForm.reset({
                                                    activo: true,
                                                    fecha_asignacion: new Date().toISOString().split("T")[0],
                                                    es_principal: false,
                                                });
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit">Guardar</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button
                            onClick={() => setCreatingIdentificacion(true)}
                            className="w-full sm:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar identificación
                        </Button>
                    )}

                    {!creatingIdentificacion && (
                        <div className="space-y-2">
                            {identificaciones.map((ident) => {
                            if (editingIdentificacion === ident.id) {
                                return (
                                    <EditIdentificacionForm
                                        key={ident.id}
                                        ident={ident}
                                        tiposIdentificacion={tiposIdentificacion}
                                        onSave={(values) => handleUpdateIdentificacion(ident.id, values)}
                                        onCancel={() => setEditingIdentificacion(null)}
                                    />
                                );
                            }

                            return (
                                <Card key={ident.id} className="border-border">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{ident.tipo}</span>
                                                    {ident.es_principal && (
                                                        <Badge variant="success" className="text-xs">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            Principal
                                                        </Badge>
                                                    )}
                                                    {!ident.activo && (
                                                        <Badge variant="muted" className="text-xs">Inactiva</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-foreground">{ident.valor}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Asignada: {formatDate(ident.fecha_asignacion)}
                                                </p>
                                                {ident.observaciones && (
                                                    <p className="text-xs text-muted-foreground">{ident.observaciones}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {!ident.es_principal && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSetPrincipal(ident.id)}
                                                        title="Marcar como principal"
                                                    >
                                                        <Star className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingIdentificacion(ident.id ?? "")}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingIdentificacion(ident.id ?? "")}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        </div>
                    )}

                    {identificaciones.length === 0 && !creatingIdentificacion && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No hay identificaciones registradas</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <DataTable
                columns={[
                    {
                        key: "tipo",
                        header: "Tipo",
                        render: (item) => <span className="font-medium">{item.tipo}</span>,
                    },
                    {
                        key: "valor",
                        header: "Valor",
                        render: (item) => item.valor,
                    },
                    {
                        key: "principal",
                        header: "Principal",
                        render: (item) =>
                            item.es_principal ? (
                                <Badge variant="success">Sí</Badge>
                            ) : (
                                <span className="text-muted-foreground">No</span>
                            ),
                    },
                ]}
                data={identificaciones}
                keyExtractor={(item) => item.id}
                emptyState={{
                    title: "Sin identificaciones",
                    description: "Este animal no tiene identificaciones registradas.",
                }}
            />
        );
    };

    const renderMovimientosTab = () => {
        if (!canViewMovimientos) {
            return (
                <NoPermission
                    title="Sin permisos"
                    description="No tienes permisos para ver los movimientos."
                />
            );
        }

        const destinoLabel = ubicacionActual
            ? ubicacionActual.potreroNombre ?? ubicacionActual.loteNombre ?? "Sin destino"
            : "Sin ubicación registrada";
        const tipoLabel = ubicacionActual?.tipoMovimiento
            ? ubicacionActual.tipoMovimiento === "potrero"
                ? "Potrero"
                : ubicacionActual.tipoMovimiento === "lote"
                  ? "Lote"
                  : "Sin destino"
            : null;

        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        {movimientosLoading && !ubicacionActual && !movimientosError ? (
                            <div className="w-full space-y-2">
                                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                            </div>
                        ) : movimientosError ? (
                            <div className="text-sm text-muted-foreground">
                                No se pudo cargar la ubicación actual.
                            </div>
                        ) : ubicacionActual ? (
                            <div className="space-y-1">
                                <div className="text-xs uppercase text-muted-foreground">Ubicación actual</div>
                                <div className="text-base font-semibold">
                                    {ubicacionActual.fincaNombre ?? "Finca sin nombre"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {destinoLabel}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDate(ubicacionActual.fechaMovimiento)}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="text-xs uppercase text-muted-foreground">Ubicación actual</div>
                                <div className="text-sm text-muted-foreground">Sin ubicación registrada</div>
                            </div>
                        )}
                        {tipoLabel && (
                            <Badge variant="muted" className="self-start sm:self-auto">
                                {tipoLabel}
                            </Badge>
                        )}
                    </CardContent>
                </Card>
                <DataTable
                    columns={[
                        {
                            key: "fecha_hora",
                            header: "Fecha",
                            render: (item) => formatDate(item.fecha_hora),
                        },
                        {
                            key: "tipo",
                            header: "Tipo",
                            render: (item) => {
                                const tipo = item.potrero_destino_id || item.potrero_destino_nombre
                                    ? "Potrero"
                                    : item.lote_destino_id || item.lote_destino_nombre
                                      ? "Lote"
                                      : "Sin destino";
                                return <Badge variant="muted">{tipo}</Badge>;
                            },
                        },
                        {
                            key: "origen",
                            header: "Origen",
                            render: (item) =>
                                item.potrero_origen_nombre ?? item.lote_origen_nombre ?? "—",
                        },
                        {
                            key: "destino",
                            header: "Destino",
                            render: (item) =>
                                item.potrero_destino_nombre ?? item.lote_destino_nombre ?? "Sin destino",
                        },
                        {
                            key: "motivo",
                            header: "Observación",
                            render: (item) => item.motivo_nombre ?? item.observaciones ?? "—",
                        },
                    ]}
                    data={movimientos}
                    keyExtractor={(item) => item.id}
                    loading={movimientosLoading}
                    error={movimientosError}
                    onRetry={loadMovimientos}
                    emptyState={{
                        title: "Sin movimientos",
                        description: "Este animal no tiene movimientos registrados.",
                    }}
                />
                <Pagination
                    page={movimientosPage}
                    totalPages={movimientosTotalPages}
                    onPageChange={setMovimientosPage}
                />
            </div>
        );
    };

    const tabs = [
        {
            id: "resumen",
            label: "Resumen",
            content: renderResumenTab(),
        },
        {
            id: "identificaciones",
            label: "Identificaciones",
            content: renderIdentificacionesTab(),
        },
        {
            id: "movimientos",
            label: "Movimientos",
            content: renderMovimientosTab(),
        },
        {
            id: "salud",
            label: "Salud",
            content: (
                <div className="space-y-4">
                    {animal.retiro_activo && (
                        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                            <CardContent className="flex items-center gap-3 p-4">
                                <Stethoscope className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="font-medium text-red-700 dark:text-red-400">Retiro activo</p>
                                    <p className="text-sm text-red-600">
                                        {animal.retiro_activo.motivo} — hasta {formatDate(animal.retiro_activo.fecha_fin)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <DataTable
                        columns={[
                            {
                                key: "fecha",
                                header: "Fecha",
                                render: (item) => formatDate(item.fecha),
                            },
                            {
                                key: "tipo",
                                header: "Tipo",
                                render: (item) => <Badge variant="muted">{item.tipo}</Badge>,
                            },
                            {
                                key: "diagnostico",
                                header: "Diagnóstico",
                                render: (item) => item.diagnostico ?? "—",
                            },
                            {
                                key: "tratamiento",
                                header: "Tratamiento",
                                render: (item) => item.tratamiento ?? "—",
                            },
                        ]}
                        data={animal.ultimos_eventos_salud ?? []}
                        keyExtractor={(item) => item.id}
                        emptyState={{
                            title: "Sin eventos de salud",
                            description: "Este animal no tiene eventos de salud registrados.",
                        }}
                    />
                </div>
            ),
        },
        {
            id: "reproduccion",
            label: "Reproducción",
            content: (
                <DataTable
                    columns={[
                        {
                            key: "fecha",
                            header: "Fecha",
                            render: (item) => formatDate(item.fecha),
                        },
                        {
                            key: "tipo",
                            header: "Evento",
                            render: (item) => <Badge variant="default">{item.tipo}</Badge>,
                        },
                        {
                            key: "resultado",
                            header: "Resultado",
                            render: (item) => item.resultado ?? "—",
                        },
                        {
                            key: "notas",
                            header: "Notas",
                            render: (item) => item.notas ?? "—",
                        },
                    ]}
                    data={animal.ultimos_eventos_reproduccion ?? []}
                    keyExtractor={(item) => item.id}
                    emptyState={{
                        title: "Sin eventos reproductivos",
                        description: "Este animal no tiene eventos reproductivos.",
                    }}
                />
            ),
        },
    ];

    return (
        <MotionFadeSlide>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/animales")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <PageHeader
                        subtitle="Hoja de vida"
                        title={animal.nombre || animal.codigo || `Animal ${id.slice(0, 8)}`}
                        description={`${animal.sexo === "hembra" ? "Hembra" : "Macho"} • ${animal.categoria ?? "Sin categoría"}`}
                        actions={
                            <div className="flex gap-2">
                                {mode === "view" && canEdit ? (
                                    <Button onClick={() => router.push(`/dashboard/animales/${id}?mode=edit`)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                ) : mode === "edit" ? (
                                    <>
                                        <Button variant="ghost" onClick={handleCancelEdit}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={animalForm.handleSubmit(handleSaveAnimal)}
                                            disabled={submitting}
                                        >
                                            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            <Save className="h-4 w-4 mr-2" />
                                            Guardar cambios
                                        </Button>
                                    </>
                                ) : null}
                                <Badge variant={getEstadoBadgeVariant(animal.estado ?? "")}>{animal.estado ?? "—"}</Badge>
                                <Badge variant={animal.sexo === "hembra" ? "default" : "info"}>
                                    {animal.sexo === "hembra" ? "Hembra" : "Macho"}
                                </Badge>
                            </div>
                        }
                    />
                </div>

                <Tabs tabs={tabs} defaultTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <ConfirmDialog
                open={!!deletingIdentificacion}
                onClose={() => setDeletingIdentificacion(null)}
                onConfirm={handleDeleteIdentificacion}
                title="Eliminar identificación"
                description="¿Estás seguro de eliminar esta identificación? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
            />
        </MotionFadeSlide>
    );
}
