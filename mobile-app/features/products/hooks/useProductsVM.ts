import { useMemo } from "react";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  priceFormatted?: string;
  image?: string;
  type: "product";
};

export function useProductsVM(products?: any[]): ProductRow[] {
  return useMemo(
    () =>
      (products ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? "",
        price: p.price ? p.price.valueCents / 100 : 0,
        priceFormatted: p.price?.valueFormatted ?? "$0.00",
        image: p.images?.[0]?.url || undefined,
        type: "product" as const,
      })),
    [products],
  );
}
