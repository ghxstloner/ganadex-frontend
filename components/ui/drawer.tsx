"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Drawer({
  open,
  title,
  description,
  children,
  onClose,
  className,
}: DrawerProps) {
  const hasHeading = Boolean(title || description);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-label={!hasHeading ? "Panel" : undefined}
        className={cn(
          "ml-auto h-full w-full max-w-lg gap-0 overflow-hidden rounded-none border-l border-border p-0 shadow-2xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            {title && (
              <DialogTitle className="text-lg font-semibold text-card-foreground">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex h-[calc(100%-64px)] flex-col px-6 py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
