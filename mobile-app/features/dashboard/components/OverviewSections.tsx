import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { SalesCard } from "@/components/shared/card/SalesCard";
import { ChartCard } from "@/components/shared/card/chart-card";
import { StatCard } from "@/components/shared/card/stat-card";
import InfoListCard from "@/components/shared/tables/InfoListCard";
import type { MachineListItem, ProductListItem } from "@/features/dashboard/hooks/useDashboardVM";

export const SalesSummary: React.FC<{
  title: string;
  total: { value: number; formatted?: string };
  card: { value: number; formatted?: string; count?: number };
  cash: { value: number; formatted?: string; count?: number };
  free?: { value: number; formatted?: string; count?: number };
  remote?: { value: number; formatted?: string; count?: number };
}> = ({ title, total, card, cash, free, remote }) => {
  const { t } = useTranslation();
  return (
    <SalesCard
      title={title}
      totalSales={{
        label: t("dashboard.salesCard.total"),
        value: total.value,
        formatted: total.formatted,
      }}
      cashSales={{
        label: t("dashboard.salesCard.card"),
        value: card.value,
        formatted: card.formatted,
        count: card.count,
      }}
      effectiveSales={{
        label: t("dashboard.salesCard.cash"),
        value: cash.value,
        formatted: cash.formatted,
        count: cash.count,
      }}
      freeSales={
        free && free.count && free.count > 0
          ? {
              label: t("dashboard.salesCard.free"),
              value: free.value,
              formatted: free.formatted,
              count: free.count,
            }
          : undefined
      }
      remoteSales={
        remote && remote.count && remote.count > 0
          ? {
              label: t("dashboard.salesCard.remote"),
              value: remote.value,
              formatted: remote.formatted,
              count: remote.count,
            }
          : undefined
      }
    />
  );
};

export const SalesChart: React.FC<{
  series: { date: string; card: number; cash: number; free: number; remote: number }[];
  title?: string;
  caption?: string;
}> = ({ series, title, caption }) => {
  return <ChartCard showHeader={!!title} title={title} caption={caption} series={series} />;
};

export const KPIGrid: React.FC<{
  counts: { total: number; online: number; warning: number; offline: number };
}> = ({ counts }) => {
  const { t } = useTranslation();
  const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 16 } });
  return (
    <>
      <View style={[styles.row, { marginBottom: 16 }]}>
        <StatCard
          title={t("dashboard.stats.totalMachines")}
          value={String(counts.total)}
          subtitle=""
          icon="dashboard"
        />
        <StatCard
          title={t("dashboard.stats.offline")}
          value={String(counts.offline)}
          subtitle=""
          icon="error"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          title={t("dashboard.stats.warning")}
          value={String(counts.warning)}
          subtitle=""
          icon="warning"
        />
        <StatCard
          title={t("dashboard.stats.online")}
          value={String(counts.online)}
          subtitle=""
          icon="check-circle"
        />
      </View>
    </>
  );
};

export const TopMachinesList: React.FC<{
  title: string;
  subtitle: string;
  items: MachineListItem[];
  allCount: number;
  onItemPress: (machine: MachineListItem) => void;
  onViewMore: () => void;
}> = ({ title, subtitle, items, allCount, onItemPress, onViewMore }) => {
  const { t } = useTranslation();
  return (
    <InfoListCard
      title={title}
      subtitle={subtitle}
      data={items}
      type="machine"
      viewMoreText={
        allCount > items.length
          ? t("dashboard.lists.viewMoreMachines", { count: allCount - items.length })
          : undefined
      }
      onItemPress={onItemPress}
      onViewMore={onViewMore}
    />
  );
};

export const TopProductsList: React.FC<{
  title: string;
  subtitle: string;
  items: ProductListItem[];
  allCount: number;
  onItemPress: (product: ProductListItem) => void;
  onViewMore: () => void;
}> = ({ title, subtitle, items, allCount, onItemPress, onViewMore }) => {
  const { t } = useTranslation();
  return (
    <InfoListCard
      title={title}
      subtitle={subtitle}
      data={items}
      type="product"
      viewMoreText={
        allCount > items.length
          ? t("dashboard.lists.viewMoreProducts", { count: allCount - items.length })
          : undefined
      }
      onItemPress={onItemPress}
      onViewMore={onViewMore}
    />
  );
};
