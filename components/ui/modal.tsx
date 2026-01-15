"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  const modalContent = (
    <>
      {/* Overlay - cubre toda la pantalla */}
      <div
        className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal container - centrado en toda la pantalla */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4 pointer-events-none">
        <div
          className={cn(
            "relative z-[100] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-xl pointer-events-auto flex flex-col",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - fijo */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-card-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Content - con scroll */}
          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  );

  // Renderizar en un portal fuera del árbol DOM para evitar problemas de z-index y overflow
  return createPortal(modalContent, document.body);
}
