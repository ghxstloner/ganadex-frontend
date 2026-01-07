import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorStateProps = {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
};

export function ErrorState({
    title = "Error al cargar",
    description = "No se pudieron cargar los datos. Intenta de nuevo.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}
        >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {onRetry && (
                <Button variant="outline" className="mt-4" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                </Button>
            )}
        </div>
    );
}
