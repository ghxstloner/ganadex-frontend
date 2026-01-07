import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricCardProps = {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: string;
        positive?: boolean;
    };
    className?: string;
};

export function MetricCard({
    label,
    value,
    icon,
    trend,
    className,
}: MetricCardProps) {
    return (
        <Card className={cn("border-border bg-card", className)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                        <p className="text-2xl font-semibold text-card-foreground">
                            {value}
                        </p>
                        {trend && (
                            <p
                                className={cn(
                                    "text-xs font-medium",
                                    trend.positive ? "text-emerald-600" : "text-red-600"
                                )}
                            >
                                {trend.value}
                            </p>
                        )}
                    </div>
                    {icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export type MetricCardsProps = {
    metrics: MetricCardProps[];
    className?: string;
};

export function MetricCards({ metrics, className }: MetricCardsProps) {
    return (
        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
            {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
            ))}
        </div>
    );
}
