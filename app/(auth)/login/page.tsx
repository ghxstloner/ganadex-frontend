"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { login, saveSession } from "@/lib/auth/auth.service";
import { loginSchema, type LoginSchema } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setIsSubmitting(true);
    try {
      const response = await login(values);
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
        typeof apiError?.message === "string"
          ? apiError.message
          : "No pudimos iniciar sesión. Inténtalo nuevamente.";
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
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-light italic tracking-tight text-gray-900 dark:text-gray-100">
              Bienvenido de vuelta!
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Ingresa tus credenciales para acceder a tu panel de control
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                placeholder="Ingresa tu correo"
                autoComplete="email"
                className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

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
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:border-gray-600"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="border-gray-300 data-[state=checked]:border-gray-900 data-[state=checked]:bg-gray-900 dark:border-gray-600 dark:data-[state=checked]:border-gray-100 dark:data-[state=checked]:bg-gray-100"
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-gray-600 dark:text-gray-400"
                >
                  Recordarme
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>

          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 pt-8 text-sm">
        <span className="text-gray-500 dark:text-gray-400">¿No tienes una cuenta?</span>
        <Link
          href="/register"
          className="font-medium text-gray-900 underline underline-offset-4 transition-colors hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
