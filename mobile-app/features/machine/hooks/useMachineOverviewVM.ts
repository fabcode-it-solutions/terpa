import { useMemo } from "react";
import type { VendingMachine } from "@/services/api/schemas";
import { formatCurrency } from "@/utils/currency";
import { formatRelativeTime } from "@/utils/date";
import { formatNumber, pluralize } from "@/utils/formatter";

export type SalesSeriesPoint = { date: string; card: number; cash: number };
export type RecentSaleItem = {
  device: string;
  product: string;
  price: string;
  time: string;
  image?: string;
};
export type ProductItem = { image?: string; name: string; sales: string; price: string };

export function useMachineOverviewVM(args: {
  machine?: VendingMachine;
  latestSales?: any[];
  topProducts?: any[];
  salesByDay?: any[];
  language?: string;
}) {
  const { machine, latestSales = [], topProducts = [], salesByDay = [], language } = args;

  const inventoryPercent = useMemo(
    () => Math.max(0, Math.min(100, Math.round(machine?.inventoryPercent ?? 0))),
    [machine?.inventoryPercent],
  );

  const salesSeries: SalesSeriesPoint[] = useMemo(
    () =>
      (salesByDay ?? []).map((p: any) => ({
        date: p.date,
        card:
          typeof p.card === "number"
            ? p.card
            : (p.paymentMethods?.card?.amount ?? p.cardAmount ?? 0),
        cash:
          typeof p.cash === "number"
            ? p.cash
            : (p.paymentMethods?.cash?.amount ?? p.cashAmount ?? 0),
      })),
    [salesByDay],
  );

  const recentSales: RecentSaleItem[] = useMemo(() => {
    return (latestSales ?? []).slice(0, 50).map((s: any) => ({
      device:
        s.device || s.terminal || s.mdbCode
          ? `Dev #${s.dexNumber ?? "-"} MDB #${s.mdbNumber ?? s.mdbCode ?? "-"}`
          : "Terminal",
      product: s.productName || s.product?.name || s.name || "Producto",
      price: formatCurrency(s.machineProductCost || 0),
      time: formatRelativeTime(s.isoDate || s.createdAt, language),
      image: s.product?.productImages?.[0]?.fileUrl || undefined,
    }));
  }, [latestSales, language]);

  const products: ProductItem[] = useMemo(
    () =>
      (topProducts ?? []).map((p: any) => {
        const salesCount = Number(p.sales_count ?? p.sales ?? p.count ?? 0) || 0;
        const imageCandidate =
          typeof p.image === "string" ? p.image : (p.images?.[0]?.url as string | undefined);
        return {
          image: imageCandidate ?? "🥤",
          name: p.name || p.productName || "Producto",
          sales: `${formatNumber(salesCount)} ${pluralize(salesCount, "venta", "ventas")}`,
          price: formatCurrency(p.total_sales_value || 0),
        };
      }),
    [topProducts],
  );

  const kpis = {
    salesToday: typeof machine?.salesToday === "number" ? machine?.salesToday : 0,
    currentChange: typeof machine?.currentChange === "number" ? machine?.currentChange : 0,
  };

  const status = (machine?.status as "online" | "warning" | "offline" | undefined) ?? "offline";
  const lastPingAt = machine?.lastPingAt;

  return {
    status,
    lastPingAt,
    inventoryPercent,
    salesSeries,
    recentSales,
    products,
    kpis,
  };
}
