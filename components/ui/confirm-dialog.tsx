"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    variant?: "default" | "destructive";
};

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = "Confirmar acción",
    description = "¿Estás seguro de que deseas continuar?",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    loading = false,
    variant = "destructive",
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} description={description}>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button
                    variant={variant}
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
