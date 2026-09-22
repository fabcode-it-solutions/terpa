import { ColorPalette } from "@/theme";

/**
 * Inventory Progress Bar Thresholds
 *
 * Single source of truth for inventory level color thresholds:
 * - 0-30%: Red (rojo) - Critical low inventory
 * - 30-60%: Orange (naranja) - Warning level
 * - 60-100%: Green (verde) - Healthy inventory
 */
export const INVENTORY_THRESHOLDS = {
  LOW: 30, // Below this: red
  MEDIUM: 60, // Below this: orange, above LOW: orange, above this: green
} as const;

/**
 * Get inventory progress bar color based on percentage
 *
 * @param percent - Inventory level percentage (0-100)
 * @param colors - Theme color palette
 * @returns Color string for the progress bar
 */
export const getInventoryColor = (percent: number, colors: ColorPalette): string => {
  if (percent < INVENTORY_THRESHOLDS.LOW) return colors.error.main;
  if (percent < INVENTORY_THRESHOLDS.MEDIUM) return colors.warning.main;
  return colors.success.main;
};
