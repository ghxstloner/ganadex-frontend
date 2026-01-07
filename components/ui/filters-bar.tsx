"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export type FiltersBarProps = {
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    children?: ReactNode;
    onClear?: () => void;
    showClear?: boolean;
    className?: string;
};

export function FiltersBar({
    search,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    children,
    onClear,
    showClear = false,
    className,
}: FiltersBarProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-3",
                className
            )}
        >
            {onSearchChange !== undefined && (
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search ?? ""}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-9"
                    />
                </div>
            )}
            {children}
            {showClear && onClear && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                    <X className="h-4 w-4" />
                    Limpiar filtros
                </Button>
            )}
        </div>
    );
}

export type SelectFilterProps = {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
};

export function SelectFilter({
    value,
    onChange,
    options,
    placeholder = "Todos",
    className,
}: SelectFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                className
            )}
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
