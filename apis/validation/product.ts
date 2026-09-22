import { currency, optionalCurrency } from "@/validation/common";
import { z } from "zod";

const productShape = {
  /**
   * The product name
   */
  name: z
    .string()
    .min(4, "Al menos 4 caracteres")
    .max(50, "Máximo 50 caracteres")
    .trim(),
  /**
   * The product price
   */
  price: currency,
  /**
   * The product purchase cost (optional)
   */
  purchaseCost: optionalCurrency,
  /**
   * The product SKU
   */
  sku: z
    .union([z.string().trim().max(255), z.null()])
    .transform((value) => value || null)
    .optional(),
  /**
   * The product barcode
   */
  barcode: z
    .union([z.string().trim().max(255), z.null()])
    .transform((value) => value || null)
    .optional(),
  /**
   * The product image (optional)
   */
  image: z
    .custom<File>()
    .refine(
      (file) => !file || file instanceof File,
      "Por favor selecciona una imagen válida",
    )
    .refine(
      (file) => !file || file.size <= 2 * 1024 * 1024,
      "La imagen no puede ser mayor a 2MB",
    )
    .refine(
      (file) =>
        !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Solo se aceptan archivos JPG, PNG o WebP",
    )
    .optional(),
};

/**
 * Schema used to validate the product creation action
 */
export const productCreateSchema = z.object({
  /**
   * The team's slug where the product will be created
   */
  teamSlug: z.string(),
  /**
   * The product name
   */
  name: productShape.name,
  /**
   * The product price
   */
  price: productShape.price,
  /**
   * The product purchase cost
   */
  purchaseCost: productShape.purchaseCost,
  /**
   * The product SKU
   */
  sku: productShape.sku,
  /**
   * The product barcode
   */
  barcode: productShape.barcode,
  /**
   * The product image
   */
  image: productShape.image,
});

/**
 * Schema used to validate the product edition action
 */
export const productEditSchema = z.object({
  /**
   * The team's slug where the product will be eduted
   */
  teamSlug: z.string(),
  /**
   * The product ID
   */
  productId: z.string().uuid(),
  /**
   * The product name
   */
  name: productShape.name,
  /**
   * The product price
   */
  price: productShape.price,
  /**
   * The product purchase cost
   */
  purchaseCost: productShape.purchaseCost,
  /**
   * The product SKU
   */
  sku: productShape.sku,
  /**
   * The product barcode
   */
  barcode: productShape.barcode,
  /**
   * The product image
   */
  image: productShape.image,
});

/**
 * Schema used to validate the product deletion action
 */
export const productDeleteSchema = z.object({
  /**
   * The team's slug where the product will be deleted
   */
  teamSlug: z.string(),
  /**
   * The product ID
   */
  productId: z.string().uuid(),
});
