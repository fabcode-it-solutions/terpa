import { numericString } from "@/validation/common";
import { z } from "zod";

const spiralShape = {
  id: z.string().uuid(),
  machineId: z.string().uuid(),
  machineCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  machineMdbCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  machineMicromarketCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  productId: z.string().min(1, "Campo requerido").uuid(),
  currentCount: numericString,
  maxCapacity: numericString,
};

/**
 * Schema used to validate the creation of a new spiral
 */
export const spiralCreateSchema = z
  .object({
    teamSlug: z.string(),
    machineId: spiralShape.machineId,
    machineCode: spiralShape.machineCode,
    machineMdbCode: spiralShape.machineMdbCode,
    machineMicromarketCode: spiralShape.machineMicromarketCode,
    productId: spiralShape.productId,
    currentCount: spiralShape.currentCount,
    maxCapacity: spiralShape.maxCapacity,
    machineType: z.enum(["VENDING", "MICROMARKET"]).optional(),
  })
  .refine((data) => data.currentCount <= data.maxCapacity, {
    message: "La cantidad actual no puede ser mayor a la capacidad máxima",
    path: ["currentCount"],
  })
  .refine(
    (data) => {
      // For micromarket machines, require machineMicromarketCode
      if (data.machineType === "MICROMARKET") {
        return data.machineMicromarketCode !== null;
      }
      // For vending machines, require at least one of DEX or MDB codes
      return data.machineCode !== null || data.machineMdbCode !== null;
    },
    {
      message: "Debe especificar un código de producto",
      path: ["machineCode"],
    },
  );

/**
 * Schema used to validate editing of a spiral
 */
export const spiralEditSchema = z
  .object({
    teamSlug: z.string(),
    machineId: spiralShape.machineId,
    spiralId: spiralShape.id,
    machineCode: spiralShape.machineCode,
    machineMdbCode: spiralShape.machineMdbCode,
    machineMicromarketCode: spiralShape.machineMicromarketCode,
    productId: spiralShape.productId,
    currentCount: spiralShape.currentCount,
    maxCapacity: spiralShape.maxCapacity,
    machineType: z.enum(["VENDING", "MICROMARKET"]).optional(),
  })
  .refine((data) => data.currentCount <= data.maxCapacity, {
    message: "La cantidad actual no puede ser mayor a la capacidad máxima",
    path: ["currentCount"],
  })
  .refine(
    (data) => {
      // For micromarket machines, require machineMicromarketCode
      if (data.machineType === "MICROMARKET") {
        return data.machineMicromarketCode !== null;
      }
      // For vending machines, require at least one of DEX or MDB codes
      return data.machineCode !== null || data.machineMdbCode !== null;
    },
    {
      message: "Debe especificar un código de producto",
      path: ["machineCode"],
    },
  );

/**
 * Schema used to validate the filling of a spiral
 */
export const spiralFillSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  spiralId: spiralShape.id,
});

/**
 * Schema used to validate the emptying of a spiral
 */
export const spiralEmptySchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  spiralId: spiralShape.id,
});

/**
 * Schema used to delete a spiral
 */
export const spiralDeleteSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  spiralId: spiralShape.id,
});

/**
 * Schema used to fill all machine spirals
 */
export const inventoryFillSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to empty all machine spirals
 */
export const inventoryEmptySchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to generate a picklist
 */
export const picklistGenerateSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to edit a picklist
 */
export const picklistEditSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  items: z.record(
    z.string().uuid(),
    z.object({ id: z.string().uuid(), quantity: numericString }),
  ),
});

/**
 * Schema used to delete a picklist
 */
export const picklistDeleteSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to regenerate a picklist
 */
export const picklistRegenerateSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to fill a picklist
 */
export const picklistFillSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to decrement the inventory of a spiral
 */
export const spiralDecrementSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  spiralId: spiralShape.id,
});

/**
 * Schema used to increment the inventory of a spiral
 */
export const spiralIncrementSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
  spiralId: spiralShape.id,
});

/**
 * Schema used to export a picklist
 */
export const picklistExportSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});

/**
 * Schema used to export machine inventory
 */
export const inventoryExportSchema = z.object({
  teamSlug: z.string(),
  machineId: spiralShape.machineId,
});
