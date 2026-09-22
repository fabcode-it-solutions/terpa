import { InvoicePaymentMethod, ManualPaymentMethod } from "@prisma/client";
import { z } from "zod";
import { currencyFromZero } from "./common";
import { CreateClientRequestSchema } from "@/lib/facturama/validation";

export const createInvoiceSchema = z.object({
  teamSlug: z.string(),
  machineIds: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos una máquina"),
  months: z.number().int().min(1).max(12),
  paymentMethod: z.nativeEnum(InvoicePaymentMethod),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const paymentProofSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "El archivo es muy grande")
    .refine(
      (file) =>
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "Formato de archivo no soportado",
    ),
  invoiceId: z.string(),
});

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;

export const rejectPaymentSchema = z.object({
  invoiceId: z.string(),
  teamSlug: z.string(),
});

export const approvePaymentSchema = z.object({
  invoiceId: z.string(),
  teamSlug: z.string(),
  adjustedAmountCents: currencyFromZero,
  manualPaymentMethod: z
    .nativeEnum(ManualPaymentMethod)
    .default(ManualPaymentMethod.BANK_TRANSFER),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string(),
  teamSlug: z.string(),
});

export const facturamaClientSchema = CreateClientRequestSchema.extend({
  teamSlug: z
    .string({ required_error: "El slug del equipo es requerido" })
    .min(1, "El slug del equipo es requerido"),
});

export type FacturamaClientInput = z.infer<typeof facturamaClientSchema>;
