"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
    <div className="flex min-h-screen flex-col px-8 py-8 sm:px-12 lg:px-16">
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
        <span className="text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Ganadex
        </span>
      </div>

      {/* Form container - centered */}
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-light italic tracking-tight text-gray-900 dark:text-gray-100">
              Crea tu cuenta
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
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
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500 dark:text-red-400">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="telefono"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  placeholder="+58912345678"
                  autoComplete="tel"
                  className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.telefono.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                autoComplete="email"
                className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Más de 8 caracteres"
                autoComplete="new-password"
                className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Empresa section */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Empresa</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Únete a una empresa existente o crea una nueva
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="empresa_id"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Unirme a empresa
                  </Label>
                  <Input
                    id="empresa_id"
                    placeholder="ID de empresa"
                    disabled={disableEmpresaId}
                    className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-500 dark:disabled:opacity-30"
                    {...register("empresa_id")}
                  />
                  {errors.empresa_id && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {errors.empresa_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="empresa_nombre"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Crear nueva empresa
                  </Label>
                  <Input
                    id="empresa_nombre"
                    placeholder="Nombre de empresa"
                    disabled={disableEmpresaNombre}
                    className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-500 dark:disabled:opacity-30"
                    {...register("empresa_nombre")}
                  />
                  {errors.empresa_nombre && (
                    <p className="text-xs text-red-500 dark:text-red-400">
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
              className="h-12 w-full bg-gray-900 font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
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

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 pt-4 text-sm">
        <span className="text-gray-500 dark:text-gray-400">¿Ya tienes una cuenta?</span>
        <Link
          href="/login"
          className="font-medium text-gray-900 underline underline-offset-4 transition-colors hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
