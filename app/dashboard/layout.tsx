"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Droplet,
  HeartPulse,
  Home,
  Leaf,
  Loader2,
  LogOut,
  Menu,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  getStoredSession,
  getToken,
  logout,
  updateStoredSession,
} from "@/lib/auth/auth.service";
import { hasPermission } from "@/lib/auth/permissions";
import { fetchMe } from "@/lib/api/me.service";
import type { EmpresaDTO, GanadexSession } from "@/lib/types/auth";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string | string[];
};

const navSections: Array<{
  title: string;
  items: NavItem[];
}> = [
  {
    title: "Principal",
    items: [
      { label: "Inicio", href: "/dashboard", icon: Home },
      {
        label: "Animales",
        href: "/dashboard/animales",
        icon: PawPrint,
        permission: "animales.view",
      },
      {
        label: "Movimientos",
        href: "/dashboard/movimientos",
        icon: ArrowLeftRight,
        permission: "movimientos.view",
      },
      {
        label: "Reproduccion",
        href: "/dashboard/reproduccion",
        icon: HeartPulse,
        permission: "reproduccion.view",
      },
      {
        label: "Leche",
        href: "/dashboard/leche",
        icon: Droplet,
        permission: "leche.view",
      },
      {
        label: "Salud",
        href: "/dashboard/salud",
        icon: Stethoscope,
        permission: "salud.view",
      },
      {
        label: "Potreros",
        href: "/dashboard/potreros",
        icon: Leaf,
        permission: "potreros.view",
      },
      {
        label: "Finanzas",
        href: "/dashboard/finanzas",
        icon: Banknote,
        permission: "finanzas.view",
      },
    ],
  },
  {
    title: "Administracion",
    items: [
      {
        label: "Usuarios",
        href: "/dashboard/usuarios",
        icon: Users,
        permission: "usuarios.view",
      },
      {
        label: "Roles y permisos",
        href: "/dashboard/roles",
        icon: ShieldCheck,
        permission: "roles.view",
      },
    ],
  },
];

function getEmpresaLogo(empresa: EmpresaDTO) {
  return empresa.logo_url ?? empresa.logo ?? null;
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<GanadexSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredSession();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (!stored.empresa_activa_id) {
      router.replace("/select-company");
      return;
    }

    let active = true;
    setSession(stored);
    setLoading(false);

    fetchMe()
      .then((response) => {
        if (!active) return;
        const next =
          updateStoredSession({
            user: response.user ?? stored.user,
            empresas: response.empresas ?? stored.empresas,
            empresa_activa_id:
              response.empresa_activa_id ?? stored.empresa_activa_id,
            permisos: response.permisos ?? stored.permisos,
          }) ?? stored;
        setSession(next);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const empresaActiva = useMemo(() => {
    if (!session) return null;
    return (
      session.empresas.find(
        (empresa) => empresa.id === session.empresa_activa_id
      ) ?? null
    );
  }, [session]);

  const logoUrl = empresaActiva ? getEmpresaLogo(empresaActiva) : null;
  const empresaInitials = empresaActiva?.nombre
    ? empresaActiva.nombre
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "GD";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando sesion...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="text-sm font-semibold text-foreground">
            {empresaActiva?.nombre ?? "Ganadex"}
          </p>
          <div className="flex items-center gap-1">
            <ThemeToggle size="icon-sm" />
            <Button variant="ghost" size="icon-sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border bg-background/80 px-8 py-4 backdrop-blur-sm lg:flex">
          <div />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="px-6 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>

      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-sidebar shadow-xl transition-transform lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-primary/20">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={empresaActiva?.nombre ?? "Empresa"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{empresaInitials}</span>
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Empresa
              </p>
              <p className="text-sm font-semibold text-sidebar-foreground">
                {empresaActiva?.nombre ?? "Sin empresa"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mx-5 h-px bg-border" />

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {navSections.map((section) => {
            const items = section.items.filter((item) =>
              item.permission ? hasPermission(session, item.permission) : true
            );
            if (!items.length) return null;

            return (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border px-4 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        </div>
      </aside>
    </div>
  );
}
