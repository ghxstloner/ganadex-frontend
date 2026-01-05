import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().min(1, "Ingresa un correo").email("Ingresa un correo válido"),
    nombre: z.string().min(2, "Ingresa tu nombre completo"),
    telefono: z.string().optional(),
    password: z
      .string()
      .min(9, "La contraseña debe tener más de 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "La contraseña debe tener mayúscula, minúscula, número y símbolo"
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    empresa_id: z.string().optional(),
    empresa_nombre: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validar teléfono si está presente y no está vacío
      const telefono = typeof data.telefono === "string" ? data.telefono.trim() : "";
      if (telefono.length > 0) {
        return telefono.length >= 7;
      }
      return true;
    },
    {
      message: "Ingresa un teléfono válido",
      path: ["telefono"],
    }
  )
  .refine(
    (data) => {
      // Validar empresa_id si está presente y no está vacío
      const empresaId = typeof data.empresa_id === "string" ? data.empresa_id.trim() : "";
      if (empresaId.length > 0) {
        return empresaId.length >= 1;
      }
      return true;
    },
    {
      message: "Ingresa un ID de empresa válido",
      path: ["empresa_id"],
    }
  )
  .refine(
    (data) => {
      // Validar empresa_nombre si está presente y no está vacío
      const empresaNombre = typeof data.empresa_nombre === "string" ? data.empresa_nombre.trim() : "";
      if (empresaNombre.length > 0) {
        return empresaNombre.length >= 2;
      }
      return true;
    },
    {
      message: "Ingresa un nombre de empresa válido",
      path: ["empresa_nombre"],
    }
  )
  .refine(
    (data) => {
      // Al menos uno de los campos de empresa debe estar presente
      const empresaId = typeof data.empresa_id === "string" ? data.empresa_id.trim() : "";
      const empresaNombre = typeof data.empresa_nombre === "string" ? data.empresa_nombre.trim() : "";
      return !!(empresaId || empresaNombre);
    },
    {
      message: "Debes proporcionar un ID de empresa o crear una nueva",
      path: ["empresa_id"],
    }
  )
  .refine(
    (data) => {
      // No pueden estar ambos campos llenos a la vez
      const empresaId = typeof data.empresa_id === "string" ? data.empresa_id.trim() : "";
      const empresaNombre = typeof data.empresa_nombre === "string" ? data.empresa_nombre.trim() : "";
      return !(empresaId && empresaNombre);
    },
    {
      message: "Solo puedes unirte a una empresa o crear una nueva, no ambas",
      path: ["empresa_nombre"],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().min(1, "Ingresa un correo").email("Ingresa un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
