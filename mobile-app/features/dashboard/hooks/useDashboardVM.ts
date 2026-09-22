import { useMemo } from "react";
import { formatNumber, pluralize } from "@/utils/formatter";
import type { ImageSourcePropType } from "react-native";
import type { TeamDashboard } from "@/services/repositories/dashboard";

export type SalesSeriesPoint = {
  date: string;
  card: number;
  cash: number;
  free: number;
  remote: number;
};
export type MachineListItem = { id?: string; code: string; price?: string; status: string };
export type ProductListItem = {
  image?: string | ImageSourcePropType;
  name: string;
  code?: string;
  sales?: string;
  price?: string;
};

export function useDashboardVM(dashboard?: TeamDashboard) {
  const kpis = useMemo(() => {
    const summary = dashboard?.summary ?? {};
    return {
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
      machineCounts: {
        total: Number(summary?.machineCount ?? 0),
        online: Number(summary?.machineCounts?.online ?? 0),
        warning: Number(summary?.machineCounts?.warning ?? 0),
        offline: Number(summary?.machineCounts?.offline ?? 0),
      },
    };
  }, [dashboard?.summary]);

  const salesSeries: SalesSeriesPoint[] = useMemo(
    () =>
      (dashboard?.sales ?? []).map((p) => ({
        date: p.date,
        card: typeof p.card === "number" ? p.card : 0,
        cash: typeof p.cash === "number" ? p.cash : 0,
        free: typeof p.free === "number" ? p.free : 0,
        remote: typeof p.remote === "number" ? p.remote : 0,
      })),
    [dashboard?.sales],
  );

  const topMachinesAll: MachineListItem[] = useMemo(() => {
    const top = dashboard?.topMachines ?? [];
    return top.map((m) => ({
      id: m.id,
      code: m.name,
      price: m.totalSalesFormatted ?? "",
      status: m.status ?? "offline",
    }));
  }, [dashboard?.topMachines]);

  const topProductsAll: ProductListItem[] = useMemo(() => {
    const top = dashboard?.topProducts ?? [];
    return top.map((p) => {
      const salesCount = Number(p.sales_count ?? 0) || 0;
      return {
        image: p.imageUrl || "🥤",
        name: p.name,
        code: p.id,
        sales: `${formatNumber(salesCount)} ${pluralize(salesCount, "venta", "ventas")}`,
        price: p.totalSalesFormatted ?? "",
      };
    });
  }, [dashboard?.topProducts]);

  const teamName = dashboard?.team?.name as string | undefined;

  return { teamName, kpis, salesSeries, topMachinesAll, topProductsAll };
}
