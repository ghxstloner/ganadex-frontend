"use client";

import { Plus, ArrowLeftRight, Droplet, HeartPulse } from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, type DropdownMenuItem } from "./dropdown-menu";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();

  const menuItems: DropdownMenuItem[] = [
    {
      type: "label",
      label: "Acciones rápidas",
    },
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Nuevo animal",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/animales?action=create"),
    },
    {
      type: "item",
      label: "Registrar movimiento",
      icon: <ArrowLeftRight className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/movimientos?action=create"),
    },
    {
      type: "item",
      label: "Registrar producción de leche",
      icon: <Droplet className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/leche?action=create"),
    },
    {
      type: "item",
      label: "Nuevo registro de reproducción",
      icon: <HeartPulse className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/reproduccion?action=create"),
    },
  ];

  return (
    <DropdownMenu
      items={menuItems}
      align="left"
      className={className}
      trigger={
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      }
    />
  );
}
