"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { login, saveSession } from "@/lib/auth/auth.service";
import { loginSchema, type LoginSchema } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur animate-fade-in">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Acceso seguro
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para volver a tu panel de control
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
                placeholder="Ingresa tu correo"
                autoComplete="email"
                className="h-12 border-border bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-background/60"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

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
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Recordarme
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>

          </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1 pt-8 text-sm">
        <span className="text-muted-foreground">¿No tienes una cuenta?</span>
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/70"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}
