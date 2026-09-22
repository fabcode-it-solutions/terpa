import { z } from "zod";

export const numericString = z
  .union([
    z.number().int().min(0),
    z.string().trim().regex(/^\d+$/, "Número Inválido").trim().min(1),
  ])
  .transform((v) => (typeof v === "string" ? parseInt(v) : v));

export const decimalString = z
  .union([
    z.number().min(0),
    z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Número decimal inválido"),
  ])
  .transform((v) => (typeof v === "string" ? parseFloat(v) : v));

export const currency = z.union([
  z.number().min(1, "La cantidad no es válida").int(),
  z
    .string()
    .regex(/^(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$/, "La cantidad no es válida")
    .refine(
      (value) => parseFloat(value.replace(/,/g, "")) > 0,
      "La cantidad debe ser mayor a 0",
    )
    .transform((value): number =>
      Math.round(parseFloat(value.replace(/,/g, "")) * 100),
    ),
]);

export const currencyFromZero = z.union([
  z.number().min(0, "La cantidad no es válida").int(),
  z
    .string()
    .regex(/^(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$/, "La cantidad no es válida")
    .refine(
      (value) => parseFloat(value.replace(/,/g, "")) >= 0,
      "La cantidad debe ser mayor o igual a 0",
    )
    .transform((value): number =>
      Math.round(parseFloat(value.replace(/,/g, "")) * 100),
    ),
]);

export const optionalStringFloat = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => {
    if (v === "") return null;
    const parsed = parseFloat(v as string);
    if (isNaN(parsed)) return null;
    return parsed;
  })
  .default(null);

export const optionalCurrency = z
  .union([z.number().min(0).int().nullable(), z.string(), z.null()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    if (typeof value === "number") {
      return value;
    }
    // Handle string input
    const cleaned = value.replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("La cantidad no es válida");
    }
    return Math.round(parsed * 100);
  })
  .refine(
    (value) => value === null || (typeof value === "number" && value >= 0),
    "La cantidad debe ser mayor o igual a 0",
  )
  .optional();
