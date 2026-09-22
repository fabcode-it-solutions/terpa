import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().uuid().optional(), // Optional - will be derived from spiral if not provided
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  micromarketCode: z.string().min(1), // micromarket position/code (required)
});

export const micromarketSaleSchema = z.object({
  token: z.string().uuid(),
  isoDate: z.string().datetime(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  cart: z.array(cartItemSchema).min(1),
});

export type MicromarketSaleRequest = z.infer<typeof micromarketSaleSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
