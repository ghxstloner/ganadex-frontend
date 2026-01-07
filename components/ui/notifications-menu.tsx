"use client";

import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { DropdownMenu, type DropdownMenuItem } from "./dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "info" | "warning" | "success" | "error";
}

interface NotificationsMenuProps {
  notifications?: Notification[];
  className?: string;
}

// Datos de ejemplo - en producción vendrían de una API
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Nuevo animal registrado",
    message: "Se ha registrado un nuevo animal en el sistema",
    time: "Hace 5 minutos",
    read: false,
    type: "success",
  },
  {
    id: "2",
    title: "Recordatorio de vacunación",
    message: "Hay animales que requieren vacunación esta semana",
    time: "Hace 1 hora",
    read: false,
    type: "warning",
  },
  {
    id: "3",
    title: "Producción de leche",
    message: "La producción de hoy ha sido registrada exitosamente",
    time: "Hace 2 horas",
    read: true,
    type: "info",
  },
];

export function NotificationsMenu({
  notifications = mockNotifications,
  className,
}: NotificationsMenuProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const menuItems: DropdownMenuItem[] = [
    {
      type: "label",
      content: (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs">
              {unreadCount} nuevas
            </Badge>
          )}
        </div>
      ),
    },
    {
      type: "separator",
    },
    ...notifications.slice(0, 5).map((notification) => ({
      type: "item" as const,
      content: (
        <div
          className={cn(
            "flex flex-col gap-1 w-full",
            !notification.read && "font-medium"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-tight">{notification.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {notification.time}
              </p>
            </div>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
        </div>
      ),
      onClick: () => {
        // TODO: Marcar como leída y navegar
        console.log("Notification clicked:", notification.id);
      },
    })),
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Ver todas las notificaciones",
      onClick: () => {
        // TODO: Navegar a página de notificaciones
        console.log("Ver todas");
      },
    },
  ];

  return (
    <DropdownMenu
      items={menuItems}
      align="right"
      className={className}
      trigger={
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      }
    />
  );
}
