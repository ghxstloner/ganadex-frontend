"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Heart,
    IdCard,
    MapPin,
    PawPrint,
    Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { MotionFadeSlide } from "@/components/ui/animate";
import NoPermission from "@/components/no-permission";

import { fetchAnimalPerfil } from "@/lib/api/animales.service";
import type { AnimalPerfil } from "@/lib/types/business";
import { getStoredSession } from "@/lib/auth/storage";
import { hasPermission } from "@/lib/auth/permissions";

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

function formatDate(date?: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function AnimalPerfilPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const session = getStoredSession();
    const canView = hasPermission(session, "animales.view");

    const [animal, setAnimal] = useState<AnimalPerfil | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadAnimal = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await fetchAnimalPerfil(id);
            setAnimal(data);
        } catch {
            setError(true);
            toast.error("No se pudo cargar el perfil del animal");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadAnimal();
    }, [loadAnimal]);

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

    const tabs = [
        {
            id: "resumen",
            label: "Resumen",
            content: (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Edad
                                    </p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {animal.edad_meses
                                            ? `${animal.edad_meses} meses`
                                            : "No disponible"}
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
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Ubicación
                                    </p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {animal.finca_nombre ?? "—"}
                                    </p>
                                    {animal.potrero_nombre && (
                                        <p className="text-xs text-muted-foreground">
                                            {animal.potrero_nombre}
                                        </p>
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
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Raza
                                    </p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {animal.raza ?? "No especificada"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ),
        },
        {
            id: "identificaciones",
            label: "Identificaciones",
            content: (
                <DataTable
                    columns={[
                        {
                            key: "tipo",
                            header: "Tipo",
                            render: (item) => (
                                <span className="font-medium">{item.tipo}</span>
                            ),
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
                    data={animal.identificaciones ?? []}
                    keyExtractor={(item) => item.id}
                    emptyState={{
                        title: "Sin identificaciones",
                        description: "Este animal no tiene identificaciones registradas.",
                    }}
                />
            ),
        },
        {
            id: "movimientos",
            label: "Movimientos",
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
                            header: "Tipo",
                            render: (item) => (
                                <Badge variant="muted">{item.tipo}</Badge>
                            ),
                        },
                        {
                            key: "destino",
                            header: "Destino",
                            render: (item) => item.destino_potrero_nombre ?? item.destino_lote_nombre ?? "—",
                        },
                        {
                            key: "motivo",
                            header: "Motivo",
                            render: (item) => item.motivo ?? "—",
                        },
                    ]}
                    data={animal.ultimos_movimientos ?? []}
                    keyExtractor={(item) => item.id}
                    emptyState={{
                        title: "Sin movimientos",
                        description: "Este animal no tiene movimientos registrados.",
                    }}
                />
            ),
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
                                    <p className="font-medium text-red-700 dark:text-red-400">
                                        Retiro activo
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {animal.retiro_activo.motivo} — hasta{" "}
                                        {formatDate(animal.retiro_activo.fecha_fin)}
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
                                <Badge variant={getEstadoBadgeVariant(animal.estado)}>
                                    {animal.estado}
                                </Badge>
                                <Badge variant={animal.sexo === "hembra" ? "default" : "info"}>
                                    {animal.sexo === "hembra" ? "Hembra" : "Macho"}
                                </Badge>
                            </div>
                        }
                    />
                </div>

                <Tabs tabs={tabs} defaultTab="resumen" />
            </div>
        </MotionFadeSlide>
    );
}
