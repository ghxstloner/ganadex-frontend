"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
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
  useEffect(() => {
    if (open) {
      // Calcular el ancho de la barra de scroll antes de ocultarla
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      
      // Guardar los estilos originales
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Bloquear scroll y compensar el padding para evitar desplazamiento
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Limpiar al cerrar el modal
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay - cubre toda la pantalla */}
      <div
        className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal container - centrado solo en área de contenido */}
      <div className="fixed inset-y-0 left-0 right-0 lg:left-72 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div
          className={cn(
            "relative z-50 w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl pointer-events-auto",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-card-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}
