"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStoredSession } from "@/lib/auth/auth.service";
import type { GanadexSession } from "@/lib/types/auth";

const quickLinks = [
  {
    label: "Animales",
    description: "Inventario y fichas",
    href: "/dashboard/animales",
    icon: BarChart3,
  },
  {
    label: "Movimientos",
    description: "Entradas y salidas",
    href: "/dashboard/movimientos",
    icon: ArrowRight,
  },
  {
    label: "Finanzas",
    description: "Flujos y reportes",
    href: "/dashboard/finanzas",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  const [session, setSession] = useState<GanadexSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const empresaActiva = useMemo(() => {
    if (!session) return null;
    return (
      session.empresas.find(
        (empresa) => empresa.id === session.empresa_activa_id
      ) ?? null
    );
  }, [session]);

  const firstName = session?.user.nombre.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-8 shadow-sm">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Home Ganadex
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {session ? `Hola, ${firstName}` : "Bienvenido"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Acceso rapido a la operacion diaria y el estado general de tu
            empresa.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Empresa activa
                </p>
                <p className="mt-2 text-xl font-semibold text-card-foreground">
                  {empresaActiva?.nombre ?? "Sin empresa activa"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {empresaActiva?.rol_nombre
                    ? `Rol: ${empresaActiva.rol_nombre}`
                    : "Selecciona una empresa para comenzar"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Estado
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Operacion estable
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Ultimo reporte
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Hoy, 08:30
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Estado general
            </p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm font-medium text-foreground">
                  Inventario saludable
                </p>
                <p className="text-xs text-muted-foreground">
                  Ultima revision sin alertas activas.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm font-medium text-foreground">
                  Finanzas equilibradas
                </p>
                <p className="text-xs text-muted-foreground">
                  Flujo de caja dentro de lo esperado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Accesos rapidos
            </p>
            <p className="text-sm text-muted-foreground">
              Atajos para lo que mas usas cada dia.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Ver mas
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card key={link.label} className="border-border bg-card">
                <CardContent className="space-y-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-card-foreground">
                      {link.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <Button asChild variant="ghost" className="px-0">
                    <Link href={link.href} className="flex items-center gap-2">
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
