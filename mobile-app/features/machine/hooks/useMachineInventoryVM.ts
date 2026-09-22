import { useMemo } from "react";
import type { InventoryItem, MachineInventoryResponse } from "@/services/api/schemas";

export type InventoryRow = {
  id: string;
  imageUrl?: string;
  title: string;
  sku?: string;
  dexNumber: string;
  mdbNumber: string;
  micromarketCode?: string;
  price: string;
  currentCount: number;
  maxCapacity: number;
  percent: number;
  machineType: "VENDING" | "MICROMARKET";
  productId?: string;
};

export function useMachineInventoryVM(args: { data?: MachineInventoryResponse }) {
  const { data } = args;

  const inventoryData: InventoryRow[] = useMemo(() => {
    if (!data?.inventory) return [];

    const machineType = data.machine.type;

    const rows = data.inventory.map((item: InventoryItem) => ({
      id: item.id,
      imageUrl: item.product?.images?.[0]?.url,
      title: item.product?.name || "Sin producto",
      sku: item.product?.sku || undefined,
      dexNumber: item.machineCode || "-",
      mdbNumber: item.machineMdbCode || "-",
      micromarketCode: item.machineMicromarketCode || undefined,
      price: item.product?.price?.valueFormatted || "$0.00",
      currentCount: item.currentCount,
      maxCapacity: item.maxCapacity,
      percent: item.percent,
      machineType,
      productId: item.product?.id,
    }));

    // Sort by machine code (DEX) - numeric if all numeric, otherwise string
    // This matches the web implementation for consistent ordering
    const allNumeric = rows.every((row) => {
      const code = row.dexNumber;
      return code !== "-" && !isNaN(parseInt(code));
    });

    if (allNumeric) {
      // Numeric sort
      return rows.sort((a, b) => {
        const aCode = a.dexNumber === "-" ? 0 : parseInt(a.dexNumber);
        const bCode = b.dexNumber === "-" ? 0 : parseInt(b.dexNumber);
        return aCode - bCode;
      });
    } else {
      // String sort
      return rows.sort((a, b) => a.dexNumber.localeCompare(b.dexNumber));
    }
  }, [data]);

  return { inventoryData } as const;
}
