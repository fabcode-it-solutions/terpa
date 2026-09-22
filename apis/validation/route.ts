import { z } from "zod";

export const routeCreateSchema = z.object({
  teamSlug: z.string().min(1, "El slug del equipo es requerido"),
  name: z
    .string()
    .min(1, "El nombre de la ruta es requerido")
    .max(100, "El nombre de la ruta no puede exceder 100 caracteres"),
});

export const routeDeleteSchema = z.object({
  teamSlug: z.string().min(1, "El slug del equipo es requerido"),
  routeId: z.string().min(1, "El ID de la ruta es requerido"),
});

export const routeSettingsSchema = z.object({
  name: z.string().min(1, "El nombre de la ruta es requerido"),
  routeId: z.string().min(1, "El ID de la ruta es requerido"),
  teamSlug: z.string().min(1, "El slug del equipo es requerido"),
});

export type RouteSettingsInput = z.infer<typeof routeSettingsSchema>;

export const routeMachineAddSchema = z.object({
  routeId: z.string().min(1, "El ID de la ruta es requerido"),
  machineId: z.string().min(1, "El ID de la máquina es requerido"),
  teamSlug: z.string().min(1, "El slug del equipo es requerido"),
});
