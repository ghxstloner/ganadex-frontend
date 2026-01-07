import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Breadcrumb = {
    label: string;
    href?: string;
};

export type PageHeaderProps = {
    title: string;
    subtitle?: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    subtitle,
    description,
    breadcrumbs,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="flex items-center gap-1">
                            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-foreground">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    {subtitle && (
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
        </div>
    );
}
