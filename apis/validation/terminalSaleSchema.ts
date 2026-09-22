import { PaymentMethod, SaleType } from "@prisma/client";
import { z } from "zod";

export const terminalSaleSchema = z.object({
  token: z.string().uuid(),
  cost: z.number().min(0),
  comission: z.number().min(0).optional(),
  serviceCharge: z.number().min(0).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  type: z.nativeEnum(SaleType).default(SaleType.PRODUCT),
  isoDate: z.string().datetime(),
  mdbCode: z.string().trim().optional(),
  taecelServiceId: z.string().trim().optional(),
  taecelTransactionId: z.string().trim().optional(),
  taecelApiResponse: z.string().trim().optional(),
  description: z.string().trim().optional(),
});
