"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    label?: string;
    className?: string;
};

export function SelectFilter({
    value,
    onChange,
    options,
    placeholder = "Todos",
    label,
    className,
}: SelectFilterProps) {
    const ALL_VALUE = "__all__";
    const selectValue = value || ALL_VALUE;
    const selectLabel = label ?? placeholder;
    
    return (
        <Select 
            value={selectValue} 
            onValueChange={(val) => onChange(val === ALL_VALUE ? "" : val)}
        >
            <SelectTrigger className={cn("w-[180px]", className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL_VALUE}>{selectLabel}</SelectItem>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
