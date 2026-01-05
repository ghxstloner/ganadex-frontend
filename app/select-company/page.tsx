"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  getStoredSession,
  getToken,
  setActiveCompany,
  setStoredSession,
} from "@/lib/auth/auth.service";
import type { EmpresaDTO, GanadexSession } from "@/lib/types/auth";
import { toast } from "sonner";

function getEmpresaLogo(empresa: EmpresaDTO) {
  return empresa.logo_url ?? empresa.logo ?? null;
}

export default function SelectCompanyPage() {
  const router = useRouter();
  const [session, setSession] = useState<GanadexSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [autoSelecting, setAutoSelecting] = useState(false);

  const handleSelect = useCallback(
    async (empresaId: string, isAuto = false) => {
      const currentSession = getStoredSession();
      if (!currentSession) return;

      if (isAuto) {
        setAutoSelecting(true);
      } else {
        setSubmittingId(empresaId);
      }

      try {
        const response = await setActiveCompany(empresaId);
        setStoredSession({
          user: response.user ?? currentSession.user,
          empresas: response.empresas ?? currentSession.empresas,
          empresa_activa_id: response.empresa_activa_id ?? empresaId,
        });
        if (!isAuto) {
          toast.success("Empresa activa actualizada");
        }
        router.push("/dashboard");
      } catch {
        setAutoSelecting(false);
        setSubmittingId(null);
      }
    },
    [router]
  );

  useEffect(() => {
    const token = getToken();
    const stored = getStoredSession();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (stored.empresa_activa_id) {
      router.replace("/dashboard");
      return;
    }

    // Auto-select if user has only one company
    if (stored.empresas.length === 1) {
      handleSelect(stored.empresas[0].id, true);
      return;
    }

    setSession(stored);
    setLoading(false);
  }, [router, handleSelect]);

  const empresas = useMemo(() => session?.empresas ?? [], [session]);

  if (loading || autoSelecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {autoSelecting ? "Iniciando sesión..." : "Cargando empresas..."}
        </p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Ganadex</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content - Centered */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Selecciona tu empresa
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Elige la empresa con la que quieres trabajar ahora
            </p>
          </div>

          <div className="space-y-3">
            {empresas.map((empresa) => {
              const logoUrl = getEmpresaLogo(empresa);
              const initials = empresa.nombre
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              const isSubmitting = submittingId === empresa.id;

              return (
                <Card
                  key={empresa.id}
                  className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => !submittingId && handleSelect(empresa.id)}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-accent text-sm font-semibold text-accent-foreground ring-1 ring-border">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={empresa.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{initials || "GD"}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {empresa.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {empresa.rol_nombre}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!!submittingId}
                      className="text-muted-foreground transition-colors group-hover:text-primary"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
