"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DropdownMenuItem = {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
};

export type DropdownMenuProps = {
    items: DropdownMenuItem[];
    trigger?: ReactNode;
    align?: "left" | "right";
    className?: string;
};

export function DropdownMenu({
    items,
    trigger,
    align = "right",
    className,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div ref={ref} className={cn("relative inline-block", className)}>
            <div onClick={() => setOpen(!open)}>
                {trigger ?? (
                    <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {open && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg",
                        align === "right" ? "right-0" : "left-0"
                    )}
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => {
                                item.onClick();
                                setOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                item.disabled
                                    ? "cursor-not-allowed opacity-50"
                                    : item.variant === "danger"
                                        ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        : "text-foreground hover:bg-muted"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
