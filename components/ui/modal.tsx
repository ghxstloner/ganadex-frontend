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

type ModalProps = {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  className,
}: ModalProps) {
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
        aria-label={!hasHeading ? "Modal" : undefined}
        className={cn(
          "w-full max-w-2xl max-h-[90vh] overflow-hidden p-0",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex-1 min-w-0">
            {title && (
              <DialogTitle className="text-lg font-semibold text-card-foreground">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="flex-shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
