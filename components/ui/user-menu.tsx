"use client";

import { LogOut, Settings, User } from "lucide-react";
import { logout } from "@/lib/auth/auth.service";
import type { UserDTO } from "@/lib/types/auth";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import { DropdownMenu, type DropdownMenuItem } from "./dropdown-menu";

interface UserMenuProps {
  user: UserDTO;
}

export function UserMenu({ user }: UserMenuProps) {
  const userInitials = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const menuItems: DropdownMenuItem[] = [
    {
      type: "label",
      content: (
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.nombre}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
        </div>
      ),
    },
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Perfil",
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implementar navegación a perfil
      },
    },
    {
      type: "item",
      label: "Configuración",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implementar navegación a configuración
      },
    },
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Cerrar sesión",
      icon: <LogOut className="h-4 w-4" />,
      onClick: logout,
      variant: "danger",
    },
  ];

  return (
    <DropdownMenu
      items={menuItems}
      align="right"
      trigger={
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      }
    />
  );
}