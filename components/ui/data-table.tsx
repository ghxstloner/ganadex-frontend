"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

export type DataTableColumn<T> = {
    key: string;
    header: string;
    className?: string;
    render: (item: T, index: number) => ReactNode;
};

export type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    emptyState?: {
        title: string;
        description?: string;
        action?: {
            label: string;
            onClick: () => void;
        };
    };
    className?: string;
};

function SkeletonRow({ columns }: { columns: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-4 w-full max-w-[120px] rounded bg-muted" />
                </td>
            ))}
        </tr>
    );
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    loading = false,
    error = false,
    onRetry,
    emptyState,
    className,
}: DataTableProps<T>) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-border",
                className
            )}
        >
            <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn("px-4 py-3 font-semibold", col.className)}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {loading ? (
                            <>
                                <SkeletonRow columns={columns.length} />
                                <SkeletonRow columns={columns.length} />
                                <SkeletonRow columns={columns.length} />
                            </>
                        ) : error ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <ErrorState onRetry={onRetry} />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <EmptyState
                                        title={emptyState?.title ?? "Sin datos"}
                                        description={emptyState?.description}
                                        action={emptyState?.action}
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className="transition-colors hover:bg-muted/40"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn("px-4 py-4", col.className)}>
                                            {col.render(item, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
