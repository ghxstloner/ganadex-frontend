"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DropdownMenuItem = {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  type?: "item" | "label" | "separator";
  content?: React.ReactNode;
};

export type DropdownMenuProps = {
  items: DropdownMenuItem[];
  trigger?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  collisionPadding?: number;
};

export function DropdownMenu({
  items,
  trigger,
  align = "right",
  className,
  collisionPadding = 8,
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <div className={cn("inline-block", className)}>
        <DropdownMenuPrimitive.Trigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="icon-sm" aria-label="Abrir menú">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          )}
        </DropdownMenuPrimitive.Trigger>
      </div>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align === "right" ? "end" : "start"}
          sideOffset={4}
          collisionPadding={collisionPadding}
          className="z-[9999] min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {items.map((item, index) => {
            if (item.type === "separator") {
              return (
                <DropdownMenuPrimitive.Separator
                  key={`separator-${index}`}
                  className="my-1 h-px bg-border"
                />
              );
            }

            if (item.type === "label") {
              return (
                <DropdownMenuPrimitive.Label
                  key={`label-${index}`}
                  className="px-3 py-2 text-xs font-semibold text-muted-foreground"
                >
                  {item.content || item.label}
                </DropdownMenuPrimitive.Label>
              );
            }

            const content = item.content ?? (
              <>
                {item.icon}
                {item.label}
              </>
            );

            return (
              <DropdownMenuPrimitive.Item
                key={`item-${index}`}
                disabled={item.disabled || !item.onClick}
                onSelect={(event) => {
                  if (item.disabled || !item.onClick) {
                    event.preventDefault();
                    return;
                  }
                  item.onClick();
                }}
                className={cn(
                  "flex w-full cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  item.variant === "danger"
                    ? "text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                    : "text-foreground"
                )}
              >
                {content}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
