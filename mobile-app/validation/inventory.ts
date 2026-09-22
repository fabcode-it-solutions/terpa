import { numericString } from "@/validation/common";
import { z } from "zod";

const spiralShape = {
  spiralId: z.string().uuid(),
  machineId: z.string().uuid(),
  teamId: z.string(),
  machineCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  machineMdbCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  machineMicromarketCode: z
    .union([z.string().trim(), z.null()])
    .transform((value) => (value === "" ? null : value)),
  productId: z.string().min(1, "Producto requerido").uuid("ID de producto inválido"),
  maxCapacity: numericString,
};

/**
 * Schema used to validate editing of a spiral
 */
export const spiralEditSchema = z
  .object({
    ...spiralShape,
    machineType: z.enum(["VENDING", "MICROMARKET"]).optional(),
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
      message: "Debe especificar un código de producto (DEX o MDB)",
      path: ["machineCode"],
    },
  );

export type SpiralEditFormData = z.infer<typeof spiralEditSchema>;
