"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DropdownMenuItem = {
    label?: string;
    icon?: ReactNode;
    onClick?: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
    type?: "item" | "label" | "separator";
    content?: ReactNode; // Para contenido personalizado como labels
};

export type DropdownMenuProps = {
    items: DropdownMenuItem[];
    trigger?: ReactNode;
    align?: "left" | "right";
    className?: string;
    collisionPadding?: number;
};

export function DropdownMenu({
    items,
    trigger,
    align = "right",
    className,
    collisionPadding = 0,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const menuWidth = 160; // min-w-[160px]
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Use a conservative estimate for menu height
            const estimatedMenuHeight = 120; // Conservative estimate for most dropdowns

            let top = rect.bottom + 4; // Default: below the button with small gap
            let left = align === "right"
                ? rect.right - menuWidth
                : rect.left;

            // Only reposition if there's clearly not enough space below
            const spaceBelow = viewportHeight - rect.bottom - 4;
            if (spaceBelow < estimatedMenuHeight + collisionPadding) {
                // Not enough space below, position above the button
                top = rect.top - estimatedMenuHeight - 4;
                // Ensure it doesn't go off-screen at the top
                if (top < collisionPadding) {
                    top = Math.max(collisionPadding, rect.bottom + 4);
                }
            }

            // Collision detection for horizontal positioning
            if (left + menuWidth + collisionPadding > viewportWidth) {
                left = viewportWidth - menuWidth - collisionPadding;
            }
            if (left < collisionPadding) {
                left = collisionPadding;
            }

            setPosition({ top, left });
        }
    }, [align, collisionPadding]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                triggerRef.current &&
                menuRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        if (open) {
            updatePosition();
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (open) {
            const handleResize = () => updatePosition();
            const handleScroll = () => updatePosition();
            window.addEventListener("resize", handleResize);
            window.addEventListener("scroll", handleScroll, true);
            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("scroll", handleScroll, true);
            };
        }
    }, [open, updatePosition]);

    const menuContent = open && position && (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-[9999] min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg",
            )}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {items.map((item, index) => {
                if (item.type === "separator") {
                    return (
                        <div
                            key={index}
                            className="my-1 h-px bg-border"
                        />
                    );
                }
                if (item.type === "label") {
                    return (
                        <div
                            key={index}
                            className="px-3 py-2 text-xs font-semibold text-muted-foreground"
                        >
                            {item.content || item.label}
                        </div>
                    );
                }
                return (
                    <button
                        key={index}
                        type="button"
                        disabled={item.disabled || !item.onClick}
                        onClick={() => {
                            item.onClick?.();
                            setOpen(false);
                        }}
                        className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            !item.onClick
                                ? "cursor-default"
                                : item.disabled
                                    ? "cursor-not-allowed opacity-50"
                                    : item.variant === "danger"
                                        ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        : "text-foreground hover:bg-muted"
                        )}
                    >
                        {item.icon}
                        {item.content || item.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <>
            <div ref={triggerRef} className={cn("relative inline-block", className)}>
                <div onClick={() => setOpen(!open)}>
                    {trigger ?? (
                        <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            {typeof window !== "undefined" && open && position && createPortal(menuContent, document.body)}
        </>
    );
}
