"use client";

import * as React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ImageUploadProps {
  value?: string | File | null;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
  maxSize?: number; // in bytes, default 5MB
  acceptedFormats?: string[]; // default: image/jpeg, image/png, image/webp
  previewClassName?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_FORMATS = ["image/*"]; // Acepta cualquier tipo de imagen

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  disabled,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  previewClassName,
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const errorId = React.useId();

  // Generate preview from File or URL
  React.useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
      return () => {
        reader.abort();
      };
    } else if (typeof value === "string") {
      setPreview(value);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return "El archivo debe ser una imagen";
    }
    
    // Si hay formatos específicos definidos (no es "image/*"), validarlos
    if (acceptedFormats.length > 0 && !acceptedFormats.includes("image/*")) {
      if (!acceptedFormats.includes(file.type)) {
        return `Formato no válido. Formatos aceptados: ${acceptedFormats.map((f) => f.split("/")[1]).join(", ")}`;
      }
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange?.(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      handleFile(imageFile);
    } else {
      setError("Por favor, arrastra una imagen válida");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onChange?.(null);
    onRemove?.();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "relative block border-2 border-dashed rounded-lg transition-colors",
          isDragging && !disabled
            ? "border-primary bg-primary/5"
            : "border-border bg-background",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive",
          !disabled && "cursor-pointer hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-disabled={disabled}
        aria-describedby={error ? errorId : undefined}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={acceptedFormats.includes("image/*") ? "image/*" : acceptedFormats.join(",")}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className={cn("w-full h-full object-cover", previewClassName)}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
                aria-label="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic para seleccionar"}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFormats.includes("image/*") 
                ? "Cualquier formato de imagen" 
                : acceptedFormats.map((f) => f.split("/")[1]).join(", ").toUpperCase()} hasta {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        )}
      </label>

      {error && (
        <p id={errorId} className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
