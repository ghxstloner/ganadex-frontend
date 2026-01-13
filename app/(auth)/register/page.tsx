"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  register as registerUser,
  saveSession,
} from "@/lib/auth/auth.service";
import { registerSchema, type RegisterSchema } from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      nombre: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      empresa_id: "",
      empresa_nombre: "",
    },
  });

  const empresaIdValue = watch("empresa_id");
  const empresaNombreValue = watch("empresa_nombre");

  const disableEmpresaNombre = useMemo(
    () => Boolean(empresaIdValue && typeof empresaIdValue === "string" && empresaIdValue.trim().length > 0),
    [empresaIdValue]
  );
  const disableEmpresaId = useMemo(
    () => Boolean(empresaNombreValue && typeof empresaNombreValue === "string" && empresaNombreValue.trim().length > 0),
    [empresaNombreValue]
  );

  useEffect(() => {
    if (disableEmpresaNombre && empresaNombreValue) {
      setValue("empresa_nombre", "", { shouldValidate: false });
    }
  }, [disableEmpresaNombre, empresaNombreValue, setValue]);

  useEffect(() => {
    if (disableEmpresaId && empresaIdValue) {
      setValue("empresa_id", "", { shouldValidate: false });
    }
  }, [disableEmpresaId, empresaIdValue, setValue]);

  const onSubmit = async (values: RegisterSchema) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = values;
      // Limpiar campos vacíos antes de enviar
      const cleanPayload = {
        ...payload,
        telefono: typeof payload.telefono === "string" && payload.telefono.trim() ? payload.telefono.trim() : undefined,
        empresa_id: typeof payload.empresa_id === "string" && payload.empresa_id.trim() ? payload.empresa_id.trim() : undefined,
        empresa_nombre: typeof payload.empresa_nombre === "string" && payload.empresa_nombre.trim() ? payload.empresa_nombre.trim() : undefined,
      };
      const response = await registerUser(cleanPayload);
      saveSession(response);
      toast.success("Bienvenido a Ganadex");
      const hasActiveCompany = Boolean(response.empresa_activa_id);
      const hasMultipleCompanies = response.empresas.length > 1;
      if (!hasActiveCompany && hasMultipleCompanies) {
        router.push("/select-company");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const apiError = error as { status?: number; message?: string };
      const message =
        apiError?.status === 404
          ? "Empresa no encontrada"
          : typeof apiError?.message === "string"
            ? apiError.message
            : "No pudimos completar el registro. Inténtalo nuevamente.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Logo Ganadex"
          width={24}
          height={24}
          className="h-6 w-6"
          priority
        />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Ganadex
        </span>
      </div>

      {/* Form container - centered */}
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur animate-fade-in">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Nuevo acceso
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura tu empresa y empieza a operar con claridad
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Name and Phone row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-sm font-medium text-foreground"
                >
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="telefono"
                  className="text-sm font-medium text-foreground"
                >
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  placeholder="+58912345678"
                  autoComplete="tel"
                  className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <p className="text-xs text-destructive">
                    {errors.telefono.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                autoComplete="email"
                className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Más de 8 caracteres"
                  autoComplete="new-password"
                  className="h-12 border-border bg-background/70 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className="h-12 border-border bg-background/70 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Empresa section */}
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Únete a una empresa existente o crea una nueva
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="empresa_id"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Unirme a empresa
                  </Label>
                  <Input
                    id="empresa_id"
                    placeholder="ID de empresa"
                    disabled={disableEmpresaId}
                    className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-40 dark:bg-background/60"
                    {...register("empresa_id")}
                  />
                  {errors.empresa_id && (
                    <p className="text-xs text-destructive">
                      {errors.empresa_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="empresa_nombre"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Crear nueva empresa
                  </Label>
                  <Input
                    id="empresa_nombre"
                    placeholder="Nombre de empresa"
                    disabled={disableEmpresaNombre}
                    className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-40 dark:bg-background/60"
                    {...register("empresa_nombre")}
                  />
                  {errors.empresa_nombre && (
                    <p className="text-xs text-destructive">
                      {errors.empresa_nombre.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>

          </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 pt-4 text-sm">
        <span className="text-muted-foreground">¿Ya tienes una cuenta?</span>
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/70"
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
