"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Droplet,
  FileText,
  HeartPulse,
  Home,
  Leaf,
  Loader2,
  LogOut,
  Map,
  Menu,
  Package,
  PawPrint,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanySwitcher } from "@/components/ui/company-switcher";
import { GlobalSearch } from "@/components/ui/global-search";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/ui/user-menu";
import { NotificationsMenu } from "@/components/ui/notifications-menu";
import { QuickActions } from "@/components/ui/quick-actions";
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
  href?: string;
  icon: LucideIcon;
  permission?: string | string[];
  children?: NavItem[];
};

const navSections: Array<{
  title: string;
  items: NavItem[];
}> = [
  {
    title: "Operaciones", // Antes: Nivel Operativo
    items: [
      { label: "Inicio", href: "/dashboard", icon: Home },
      {
        label: "Animales",
        icon: PawPrint,
        permission: "animales.view",
        children: [
          {
            label: "Inventario Individual",
            href: "/dashboard/animales",
            icon: PawPrint,
            permission: "animales.view",
          },
          {
            label: "Lotes",
            href: "/dashboard/lotes",
            icon: Package,
            permission: "animales.view",
          },
        ],
      },
      {
        label: "Producción",
        icon: Droplet,
        permission: "leche.view",
        children: [
          {
            label: "Pesajes de Leche",
            href: "/dashboard/leche",
            icon: Droplet,
            permission: "leche.view",
          },
          {
            label: "Entregas a Centro de Acopio",
            href: "/dashboard/leche/entregas",
            icon: Warehouse,
            permission: "leche.view",
          },
          {
            label: "Liquidaciones",
            href: "/dashboard/leche/liquidaciones",
            icon: FileText,
            permission: "leche.view",
          },
        ],
      },
      {
        label: "Reproducción",
        icon: HeartPulse,
        permission: "reproduccion.view",
        children: [
          {
            label: "Eventos",
            href: "/dashboard/reproduccion",
            icon: HeartPulse,
            permission: "reproduccion.view",
          },
          {
            label: "Termos / Genética",
            href: "/dashboard/reproduccion/termos",
            icon: Package,
            permission: "reproduccion.view",
          },
        ],
      },
      {
        label: "Sanidad",
        icon: Stethoscope,
        permission: "salud.view",
        children: [
          {
            label: "Eventos Sanitarios",
            href: "/dashboard/salud",
            icon: Stethoscope,
            permission: "salud.view",
          },
          {
            label: "Tratamientos Activos",
            href: "/dashboard/salud/tratamientos",
            icon: Syringe,
            permission: "salud.view",
          },
          {
            label: "Plan de Vacunación",
            href: "/dashboard/salud/vacunaciones",
            icon: Syringe,
            permission: "salud.view",
          },
          {
            label: "Catálogo de Medicamentos",
            href: "/dashboard/salud/medicamentos",
            icon: Pill,
            permission: "salud.view",
          },
        ],
      },
      {
        label: "Pastoreo",
        icon: Leaf,
        permission: "potreros.view",
        children: [
          {
            label: "Mapa de Potreros",
            href: "/dashboard/potreros",
            icon: Map,
            permission: "potreros.view",
          },
          {
            label: "Ocupación Actual",
            href: "/dashboard/potreros/ocupacion",
            icon: Building2,
            permission: "potreros.view",
          },
          {
            label: "Movimientos",
            href: "/dashboard/movimientos",
            icon: ArrowLeftRight,
            permission: "movimientos.view",
          },
        ],
      },
    ],
  },
  {
    title: "Gestión", // Antes: Nivel Administrativo
    items: [
      {
        label: "Finanzas",
        icon: Banknote,
        permission: "finanzas.view",
        children: [
          {
            label: "Transacciones",
            href: "/dashboard/finanzas",
            icon: Banknote,
            permission: "finanzas.view",
          },
          {
            label: "Categorías de Gastos",
            href: "/dashboard/finanzas/categorias",
            icon: FileText,
            permission: "finanzas.view",
          },
        ],
      },
      {
        label: "Auditorías",
        href: "/dashboard/auditorias",
        icon: ClipboardCheck,
        permission: "auditorias.view",
      },
    ],
  },
  {
    title: "Sistema", // Antes: Nivel Configuración (mucho más limpio)
    items: [
      {
        label: "Configuración",
        icon: Settings,
        children: [
          {
            label: "Datos de la Empresa",
            href: "/dashboard/configuracion/empresa",
            icon: Building2,
            permission: "usuarios.view",
          },
          {
            label: "Gestión de Fincas",
            href: "/dashboard/fincas",
            icon: Building2,
            permission: "usuarios.view",
          },
          {
            label: "Usuarios",
            href: "/dashboard/usuarios",
            icon: Users,
            permission: "usuarios.view",
          },
          {
            label: "Roles y Permisos",
            href: "/dashboard/roles",
            icon: ShieldCheck,
            permission: "roles.view",
          },
          {
            label: "Parámetros del Sistema",
            href: "/dashboard/configuracion/parametros",
            icon: Settings,
            permission: "roles.view",
          },
        ],
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        // Si fetchMe falla con 401, apiRequest ya maneja el logout
        // Solo establecer loading en false si no es un error de autenticación
        if (error?.status !== 401) {
          setLoading(false);
        }
        // Si es 401, el logout en apiRequest redirigirá, así que no hacer nada
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!session) return;
    // Expandir automáticamente el menú padre si alguna de sus rutas hijas está activa
    const toExpand = new Set<string>();
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => {
            if (!child.href) return false;
            // Verificar permisos antes de considerar activo
            if (
              child.permission &&
              !hasPermission(session, child.permission)
            ) {
              return false;
            }
            return (
              pathname === child.href ||
              (child.href !== "/dashboard" && pathname.startsWith(child.href))
            );
          });
          if (hasActiveChild) {
            toExpand.add(item.label);
          }
        }
      });
    });
    if (toExpand.size > 0) {
      setExpandedItems(toExpand);
    }
  }, [pathname, session]);

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

  if (loading || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div
        className={cn("w-full", sidebarCollapsed ? "lg:pl-0" : "lg:pl-72")}
      >
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 shadow-sm lg:hidden w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <CompanySwitcher
                empresas={session.empresas}
                empresaActivaId={session.empresa_activa_id}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <QuickActions />
            <NotificationsMenu />
            <ThemeToggle size="icon-sm" />
            {session.user && <UserMenu user={session.user} />}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-3 shadow-sm lg:flex w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={
                sidebarCollapsed ? "Mostrar sidebar" : "Ocultar sidebar"
              }
            >
              {sidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
            <CompanySwitcher
              empresas={session.empresas}
              empresaActivaId={session.empresa_activa_id}
            />
            <div className="flex-1 max-w-2xl">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <QuickActions />
            <div className="h-6 w-px bg-border" />
            <NotificationsMenu />
            <ThemeToggle />
            {session.user && <UserMenu user={session.user} />}
          </div>
        </header>

        <main className="px-6 py-8 sm:px-8 lg:px-10 w-full overflow-x-hidden">{children}</main>
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
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"
        )}
        style={{ height: '100vh' }}
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
            const items = section.items.filter((item) => {
              if (item.children) {
                // Si tiene hijos, mostrar si al menos uno tiene permisos
                return item.children.some((child) =>
                  child.permission
                    ? hasPermission(session, child.permission)
                    : true
                );
              }
              return item.permission
                ? hasPermission(session, item.permission)
                : true;
            });
            if (!items.length) return null;

            return (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isExpanded = expandedItems.has(item.label);
                    const hasChildren =
                      item.children && item.children.length > 0;

                    // Filtrar hijos por permisos
                    const visibleChildren = hasChildren
                      ? item.children!.filter((child) =>
                          child.permission
                            ? hasPermission(session, child.permission)
                            : true
                        )
                      : [];

                    // Verificar si algún hijo está activo
                    const hasActiveChild = visibleChildren.some((child) => {
                      if (!child.href) return false;
                      return (
                        pathname === child.href ||
                        (child.href !== "/dashboard" &&
                          pathname.startsWith(child.href))
                      );
                    });

                    // Verificar si el item principal está activo (si tiene href)
                    const isActive =
                      item.href &&
                      (pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname.startsWith(item.href)));

                    return (
                      <div key={item.label}>
                        {hasChildren ? (
                          <>
                            <button
                              onClick={() => {
                                setExpandedItems((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(item.label)) {
                                    next.delete(item.label);
                                  } else {
                                    next.add(item.label);
                                  }
                                  return next;
                                });
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                hasActiveChild
                                  ? "bg-primary/10 text-primary"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4" />
                                {item.label}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            {isExpanded && visibleChildren.length > 0 && (
                              <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                                {visibleChildren
                                  .filter((child) => child.href)
                                  .map((child) => {
                                    const href = child.href!;
                                    const isChildActive =
                                      pathname === href ||
                                      (href !== "/dashboard" &&
                                        pathname.startsWith(href));
                                    const ChildIcon = child.icon;
                                    return (
                                      <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                          isChildActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        )}
                                      >
                                        <ChildIcon className="h-3.5 w-3.5" />
                                        {child.label}
                                      </Link>
                                    );
                                  })}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href!}
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-primary/20">
              {session.user.nombre
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session.user.nombre}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </div>
  );
}
