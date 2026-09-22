import React from "react";
import { View } from "react-native";
import MachineFilter from "@/components/shared/filter/machine-filter";
import DateRangeFilter from "@/components/shared/filter/date-range-filter";
import { useTranslation } from "react-i18next";
import { SalesCard } from "@/components/shared/card/SalesCard";
import { ChartCard } from "@/components/shared/card/chart-card";
import { useReportsVM } from "@/features/dashboard/hooks/useReportsVM";
import { TopMachinesList, TopProductsList } from "./OverviewSections";
import type { MachineListItem } from "@/features/dashboard/hooks/useDashboardVM";

/**
 * Adjusts end time to include full minute when user picks 11:59 PM
 * Otherwise returns exact time user selected
 */
const adjustEndTime = (date: Date): Date => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // If user picked 11:59 PM, set to 11:59:59.999 to encompass whole day
  if (hours === 23 && minutes === 59) {
    const adjusted = new Date(date);
    adjusted.setSeconds(59, 999);
    return adjusted;
  }

  // Otherwise, use exact time user picked
  return date;
};

export const ReportsTab: React.FC<{
  data?: unknown;
  reportStart: Date;
  reportEnd: Date;
  selectedMachineId?: string;
  onMachineChange: (id?: string) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onMachinePress: (machine: MachineListItem) => void;
}> = ({
  data,
  reportStart,
  reportEnd,
  selectedMachineId,
  onMachineChange,
  onRangeChange,
  onMachinePress,
}) => {
  const { t } = useTranslation();
  const vm = useReportsVM(data);
  const machineOptions = React.useMemo(() => {
    if (!data || !Array.isArray((data as { availableMachines?: unknown[] }).availableMachines)) {
      return [];
    }
    return ((data as { availableMachines: unknown[] }).availableMachines ?? [])
      .filter(
        (machine): machine is { id: string; name: string } =>
          typeof machine === "object" &&
          machine !== null &&
          typeof (machine as { id?: unknown }).id === "string" &&
          typeof (machine as { name?: unknown }).name === "string",
      )
      .map((machine) => ({
        id: machine.id,
        name: machine.name,
      }));
  }, [data]);
  const [showAllMachines, setShowAllMachines] = React.useState(false);
  const [showAllProducts, setShowAllProducts] = React.useState(false);

  const machines = React.useMemo(
    () => (showAllMachines ? vm.topMachinesAll : vm.topMachinesAll.slice(0, 5)),
    [vm.topMachinesAll, showAllMachines],
  );
  const products = React.useMemo(
    () => (showAllProducts ? vm.topProductsAll : vm.topProductsAll.slice(0, 5)),
    [vm.topProductsAll, showAllProducts],
  );

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${m}/${y}`;
  };
  const rangeLabel = `${formatDate(reportStart)} – ${formatDate(reportEnd)}`;

  return (
    <>
      <View style={{ flexDirection: "column", gap: 0, alignItems: "center", marginBottom: 8 }}>
        <MachineFilter
          machines={machineOptions}
          value={selectedMachineId}
          onValueChange={onMachineChange}
          style={{
            width: "100%",
          }}
        />
        <DateRangeFilter
          value={{ start: reportStart, end: reportEnd }}
          onChange={({ start, end }) => onRangeChange(start, adjustEndTime(end))}
          style={{
            width: "100%",
          }}
        />
      </View>

      <SalesCard
        totalSales={{
          label: t("dashboard.salesCard.total"),
          value: vm.totals.totalSales.value,
          formatted: vm.totals.totalSales.formatted,
        }}
        cashSales={{
          label: t("dashboard.salesCard.card"),
          value: vm.totals.cardAmount.value,
          formatted: vm.totals.cardAmount.formatted,
          count: vm.totals.cardAmount.count,
        }}
        effectiveSales={{
          label: t("dashboard.salesCard.cash"),
          value: vm.totals.cashAmount.value,
          formatted: vm.totals.cashAmount.formatted,
          count: vm.totals.cashAmount.count,
        }}
        freeSales={
          vm.totals.freeAmount.count > 0
            ? {
                label: t("dashboard.salesCard.free"),
                value: vm.totals.freeAmount.value,
                formatted: vm.totals.freeAmount.formatted,
                count: vm.totals.freeAmount.count,
              }
            : undefined
        }
        remoteSales={
          vm.totals.remoteAmount.count > 0
            ? {
                label: t("dashboard.salesCard.remote"),
                value: vm.totals.remoteAmount.value,
                formatted: vm.totals.remoteAmount.formatted,
                count: vm.totals.remoteAmount.count,
              }
            : undefined
        }
      />

      <ChartCard
        showHeader
        title={t("dashboard.chart.title")}
        caption={rangeLabel}
        series={vm.salesSeries}
      />

      <TopMachinesList
        title={t("dashboard.lists.topMachines")}
        subtitle={rangeLabel}
        items={machines}
        allCount={vm.topMachinesAll.length}
        onItemPress={onMachinePress}
        onViewMore={() => setShowAllMachines(true)}
      />

      <TopProductsList
        title={t("dashboard.lists.topProducts")}
        subtitle={rangeLabel}
        items={products}
        allCount={vm.topProductsAll.length}
        onItemPress={() => {}}
        onViewMore={() => setShowAllProducts(true)}
      />
    </>
  );
};
