"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  MapPinned,
  PawPrint,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredSession } from "@/lib/auth/auth.service";
import type { GanadexSession } from "@/lib/types/auth";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card className="border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-card-foreground">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState<GanadexSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const firstName = session?.user.nombre.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Panel Ganadex
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {session ? `Hola, ${firstName}` : "Bienvenido"}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Empresas"
          value={String(session?.empresas.length ?? 0)}
          description="Empresas asociadas"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Fincas"
          value="—"
          description="Total de fincas"
          icon={<MapPinned className="h-5 w-5" />}
        />
        <StatCard
          title="Animales"
          value="—"
          description="Total en inventario"
          icon={<PawPrint className="h-5 w-5" />}
        />
        <StatCard
          title="Actividad"
          value="—"
          description="Eventos este mes"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Resumen rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Aquí podrás ver indicadores clave y accesos directos a las
            funcionalidades más utilizadas de tu sistema ganadero.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
