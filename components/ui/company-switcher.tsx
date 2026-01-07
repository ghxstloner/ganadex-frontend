"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { setActiveCompany } from "@/lib/auth/auth.service";
import { updateStoredSession } from "@/lib/auth/storage";
import type { EmpresaDTO } from "@/lib/types/auth";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { DropdownMenu, type DropdownMenuItem } from "./dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

interface CompanySwitcherProps {
  empresas: EmpresaDTO[];
  empresaActivaId: string | null;
  onCompanyChange?: (empresa: EmpresaDTO) => void;
}

export function CompanySwitcher({
  empresas,
  empresaActivaId,
  onCompanyChange,
}: CompanySwitcherProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const empresaActiva = empresas.find((emp) => emp.id === empresaActivaId);

  const handleCompanyChange = async (empresa: EmpresaDTO) => {
    if (empresa.id === empresaActivaId) return;

    setLoading(empresa.id);
    try {
      const session = await setActiveCompany(empresa.id);
      updateStoredSession(session);
      onCompanyChange?.(empresa);
      // Recargar la página para asegurar que todos los componentes se actualicen
      window.location.reload();
    } catch (error) {
      console.error("Error cambiando empresa:", error);
    } finally {
      setLoading(null);
    }
  };

  const getInitials = (nombre: string) => {
    return nombre
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "EM";
  };

  if (empresas.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
        <Avatar className="h-5 w-5">
          <AvatarImage
            src={empresaActiva?.logo_url || empresaActiva?.logo}
            alt={empresaActiva?.nombre}
          />
          <AvatarFallback className="text-xs font-semibold">
            {getInitials(empresaActiva?.nombre || "")}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-32">{empresaActiva?.nombre}</span>
      </div>
    );
  }

  const dropdownItems: DropdownMenuItem[] = empresas.map((empresa) => ({
    label: empresa.nombre,
    icon: (
      <div className="flex items-center gap-2 w-full">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage
            src={empresa.logo_url || empresa.logo}
            alt={empresa.nombre}
          />
          <AvatarFallback className="text-xs font-semibold">
            {getInitials(empresa.nombre)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate">{empresa.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {empresa.rol_nombre}
          </span>
        </div>
        {loading === empresa.id && (
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        )}
        {empresaActivaId === empresa.id && loading !== empresa.id && (
          <Check className="h-4 w-4 flex-shrink-0" />
        )}
      </div>
    ),
    onClick: () => handleCompanyChange(empresa),
    disabled: loading === empresa.id,
  }));

  return (
    <DropdownMenu
      items={dropdownItems}
      align="left"
      trigger={
        <Button
          variant="ghost"
          className="w-full justify-between px-2 py-1.5 h-auto max-w-48"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-5 w-5 flex-shrink-0">
              <AvatarImage
                src={empresaActiva?.logo_url || empresaActiva?.logo}
                alt={empresaActiva?.nombre}
              />
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(empresaActiva?.nombre || "")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {empresaActiva?.nombre}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      }
    />
  );
}