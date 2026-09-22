import { useMemo } from "react";
import { formatNumber, pluralize } from "@/utils/formatter";

export type SalesSeriesPoint = {
  date: string;
  card: number;
  cash: number;
  free: number;
  remote: number;
};
export type MachineListItem = { id: string; code: string; price: string; status: string };
export type ProductListItem = {
  image?: any;
  name: string;
  code: string;
  sales: string;
  price: string;
};

export function useReportsVM(data?: any) {
  const salesSeries: SalesSeriesPoint[] = useMemo(
    () =>
      (data?.sales ?? []).map((p: any) => ({
        date: p.date,
        card: typeof p.card === "number" ? p.card : 0,
        cash: typeof p.cash === "number" ? p.cash : 0,
        free: typeof p.free === "number" ? p.free : 0,
        remote: typeof p.remote === "number" ? p.remote : 0,
      })),
    [data?.sales],
  );

  const topMachinesAll: MachineListItem[] = useMemo(() => {
    const top = data?.topMachines ?? [];
    return top.map((m: any) => ({
      id: m.id,
      code: m.name,
      price: m.totalSalesFormatted ?? "",
      status: m.status || "offline",
    }));
  }, [data?.topMachines]);

  const topProductsAll: ProductListItem[] = useMemo(() => {
    const top = data?.topProducts ?? [];
    return top.map((p: any) => {
      const salesCount = Number(p.sales_count ?? 0) || 0;
      return {
        image: p.imageUrl || "🥤",
        name: p.name,
        code: p.id,
        sales: `${formatNumber(salesCount)} ${pluralize(salesCount, "venta", "ventas")}`,
        price: p.totalSalesFormatted ?? "",
      };
    });
  }, [data?.topProducts]);

  const summary = data?.summary ?? {};
  const totals = {
    totalSales: {
      value: Number(summary?.totalSales ?? 0),
      formatted: summary?.totalSalesFormatted as string | undefined,
    },
    cardAmount: {
      value: Number(summary?.paymentMethods?.card?.amount ?? 0),
      formatted: summary?.paymentMethods?.card?.amountFormatted as string | undefined,
      count: Number(summary?.paymentMethods?.card?.count ?? 0),
    },
    cashAmount: {
      value: Number(summary?.paymentMethods?.cash?.amount ?? 0),
      formatted: summary?.paymentMethods?.cash?.amountFormatted as string | undefined,
      count: Number(summary?.paymentMethods?.cash?.count ?? 0),
    },
    freeAmount: {
      value: Number(summary?.paymentMethods?.free?.amount ?? 0),
      formatted: summary?.paymentMethods?.free?.amountFormatted as string | undefined,
      count: Number(summary?.paymentMethods?.free?.count ?? 0),
    },
    remoteAmount: {
      value: Number(summary?.paymentMethods?.remote?.amount ?? 0),
      formatted: summary?.paymentMethods?.remote?.amountFormatted as string | undefined,
      count: Number(summary?.paymentMethods?.remote?.count ?? 0),
    },
  };

  return { salesSeries, topMachinesAll, topProductsAll, totals };
}
