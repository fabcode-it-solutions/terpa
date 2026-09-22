import React from "react";
import { View, StyleSheet } from "react-native";
import { useColors, useTheme } from "@/theme";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@/components/shared/card/status-card";
import { InventoryCard } from "@/components/shared/card/inventory-card";
import { AmountCard } from "@/components/shared/card/amount-card";
import { ChartCard } from "@/components/shared/card/chart-card";
import InfoListCard from "@/components/shared/tables/InfoListCard";
import { formatRelativeTime } from "@/utils/date";
import { getMachineStatusInfo } from "@/utils/status";
import { formatCurrency } from "@/utils/currency";
import type { ProductItem, RecentSaleItem } from "@/features/machine/hooks/useMachineOverviewVM";

export const StatusSection: React.FC<{
  status: "online" | "warning" | "offline";
  lastPingAt?: string;
  lang?: string;
}> = ({ status, lastPingAt, lang }) => {
  const colors = useColors();
  const { t } = useTranslation();
  const { label, color, textColor } = getMachineStatusInfo(status, t, colors);
  const time = formatRelativeTime(lastPingAt, lang) || "";
  return (
    <StatusCard label={label} status={status} color={color} textColor={textColor} time={time} />
  );
};

export const InventorySection: React.FC<{ percentage: number; onPress?: () => void }> = ({
  percentage,
  onPress,
}) => {
  return <InventoryCard percentage={percentage} onPress={onPress} />;
};

export const KPIsRow: React.FC<{
  salesToday: number;
  currentChange: number;
  onSalesTodayPress?: () => void;
}> = ({ salesToday, currentChange, onSalesTodayPress }) => {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.kpiRow}>
      <AmountCard
        title={t("machine.metrics.salesToday")}
        amount={formatCurrency(salesToday)}
        onPress={onSalesTodayPress}
      />
      <AmountCard title={t("machine.metrics.change")} amount={formatCurrency(currentChange)} />
    </View>
  );
};

export const SalesChartSection: React.FC<{
  title: string;
  caption: string;
  series: { date: string; card: number; cash: number }[];
}> = ({ title, caption, series }) => {
  return <ChartCard showHeader title={title} caption={caption} series={series} />;
};

export const RecentSalesList: React.FC<{
  items: RecentSaleItem[];
  allCount?: number;
  onPressItem?: (sale: RecentSaleItem) => void;
  onViewMore?: () => void;
}> = ({ items, allCount, onPressItem, onViewMore }) => {
  const { t } = useTranslation();
  const remainingCount =
    typeof allCount === "number" ? Math.max(0, allCount - items.length) : undefined;
  return (
    <InfoListCard
      title={t("machine.recentSales.title")}
      subtitle={t("machine.recentSales.subtitle50")}
      data={items}
      type="sales"
      onItemPress={onPressItem}
      viewMoreText={
        remainingCount && remainingCount > 0
          ? t("machine.recentSales.viewMore", { count: remainingCount })
          : undefined
      }
      onViewMore={onViewMore}
    />
  );
};

export const TopProductsList: React.FC<{
  items: ProductItem[];
  allCount?: number;
  onPressItem?: (product: ProductItem) => void;
  onViewMore?: () => void;
}> = ({ items, allCount, onPressItem, onViewMore }) => {
  const { t } = useTranslation();
  const remainingCount =
    typeof allCount === "number" ? Math.max(0, allCount - items.length) : undefined;
  return (
    <InfoListCard
      title={t("machine.topProducts.title")}
      subtitle={t("machine.topProducts.subtitle30")}
      data={items}
      type="product"
      onItemPress={onPressItem}
      viewMoreText={
        remainingCount && remainingCount > 0
          ? t("machine.topProducts.viewMore", { count: remainingCount })
          : undefined
      }
      onViewMore={onViewMore}
    />
  );
};

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    kpiRow: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
  });
};
