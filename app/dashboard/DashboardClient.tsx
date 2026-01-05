"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStoredSession, logout } from "@/lib/auth/auth.service";
import type { GanadexSession } from "@/lib/types/auth";

export default function DashboardClient() {
  const [session, setSession] = useState<GanadexSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    setLoading(false);
  }, []);

  const empresaActiva = useMemo(() => {
    if (!session) return null;
    return (
      session.empresas.find(
        (empresa) => empresa.id === session.empresa_activa_id
      ) ?? session.empresas[0] ?? null
    );
  }, [session]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando sesión...</p>;
  }

  if (!session) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          No encontramos una sesión válida.
        </p>
        <Button onClick={() => (window.location.href = "/login")}>
          Volver al login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Panel Ganadex
          </p>
          <h1 className="text-2xl font-semibold">
            Hola, {session.user.nombre}
          </h1>
        </div>
        <Button variant="outline" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>

      <Card className="border-border/60 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <CardTitle className="text-lg">Resumen de cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="font-medium">{session.user.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            {session.user.telefono && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{session.user.telefono}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Empresas
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {session.empresas.map((empresa) => (
                <div
                  key={empresa.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <p className="font-medium">{empresa.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Rol: {empresa.rol_nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {empresa.id}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Empresa activa</p>
            <p className="font-medium">
              {empresaActiva ? empresaActiva.nombre : "Sin empresa activa"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
