"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
};

export function Pagination({
    page,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => canPrev && onPageChange(page - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
                Anterior
            </Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">
                Página {page} de {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => canNext && onPageChange(page + 1)}
            >
                Siguiente
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
