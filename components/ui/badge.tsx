import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary/10 text-primary",
                success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                muted: "bg-muted text-muted-foreground",
                outline: "border border-border bg-transparent text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
