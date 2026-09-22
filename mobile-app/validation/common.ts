import { z } from "zod";

export const numericString = z
  .union([
    z.number().int().min(0),
    z.string().trim().regex(/^\d+$/, "Número Inválido").trim().min(1),
  ])
  .transform((v) => (typeof v === "string" ? parseInt(v) : v));
