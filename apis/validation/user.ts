import { z } from "zod";

export const userProfileSchema = z.object({
  firstName: z
    .union([z.string().trim().min(1, "El nombre es requerido"), z.null()])
    .transform((val) => (val === "" ? null : val)),

  lastName: z
    .union([z.string().trim().min(1, "El apellido es requerido"), z.null()])
    .transform((val) => (val === "" ? null : val)),

  email: z.string().email("Correo electrónico inválido"),

  phoneNumber: z
    .union([
      z
        .string()
        .trim()
        .min(10, "El número debe tener 10 dígitos")
        .max(10, "El número debe tener 10 dígitos")
        .regex(/^\d+$/, "Solo se permiten números"),
      z.null(),
    ])
    .transform((val) => (val === "" ? null : val)),
});

export const adminUserUpdateSchema = z.object({
  firstName: z
    .union([z.string().trim().min(1, "El nombre es requerido"), z.null()])
    .transform((val) => (val === "" ? null : val)),

  lastName: z
    .union([z.string().trim().min(1, "El apellido es requerido"), z.null()])
    .transform((val) => (val === "" ? null : val)),

  email: z.string().email("Correo electrónico inválido"),

  phoneNumber: z
    .union([
      z
        .string()
        .trim()
        .min(10, "El número debe tener 10 dígitos")
        .max(10, "El número debe tener 10 dígitos")
        .regex(/^\d+$/, "Solo se permiten números"),
      z.null(),
    ])
    .transform((val) => (val === "" ? null : val)),
});

export const teamMemberShowFinancialsSchema = z.object({
  userId: z.string().min(1, "ID de usuario requerido"),
  teamSlug: z.string().min(1, "Slug de equipo requerido"),
  showFinancials: z.boolean(),
});
