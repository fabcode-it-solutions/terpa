import { ThemeText, ThemeView } from "@/components";
import { InfoRow } from "@/components/shared/row/info-row";
import { useColors, useTheme } from "@/theme";
import React, { useMemo, useCallback, useState } from "react";
import { FlatList, StyleSheet, View, type FlatListProps } from "react-native";
import type { VendingMachine } from "@/services/api/schemas";
import { useTranslation } from "react-i18next";
import {
  useMachineOverviewVM,
  type ProductItem,
  type RecentSaleItem,
} from "@/features/machine/hooks/useMachineOverviewVM";
import {
  InventorySection,
  KPIsRow,
  RecentSalesList,
  SalesChartSection,
  StatusSection,
  TopProductsList,
} from "@/features/machine/components/OverviewSections";

type SectionItem = {
  key: string;
  element: React.ReactElement;
};

type GeneralScreenProps = {
  machine?: VendingMachine;
  latestSales?: unknown[];
  topProducts?: unknown[];
  salesByDay?: unknown[];
  listProps?: Partial<FlatListProps<SectionItem>>;
  onTabChange?: (tab: "general" | "sales" | "terminal" | "inventory") => void;
};

export const GeneralScreen: React.FC<GeneralScreenProps> = ({
  machine,
  latestSales = [],
  topProducts = [],
  salesByDay = [],
  listProps,
  onTabChange,
}) => {
  const theme = useTheme();
  const colors = useColors();
  const { t, i18n } = useTranslation();

  const vm = useMachineOverviewVM({
    machine,
    latestSales,
    topProducts,
    salesByDay,
    language: i18n.language,
  });

  const handleProductPress = useCallback((_product: ProductItem) => {}, []);
  const handleRecentSalePress = useCallback(
    (_sale: RecentSaleItem) => {
      onTabChange?.("sales");
    },
    [onTabChange],
  );
  const [showAllRecentSales, setShowAllRecentSales] = useState(false);
  const [showAllTopProducts, setShowAllTopProducts] = useState(false);

  const recentSalesItems = useMemo(
    () => (showAllRecentSales ? vm.recentSales : vm.recentSales.slice(0, 5)),
    [showAllRecentSales, vm.recentSales],
  );

  const topProductsItems = useMemo(
    () => (showAllTopProducts ? vm.products : vm.products.slice(0, 5)),
    [showAllTopProducts, vm.products],
  );

  const handleViewMoreRecentSales = useCallback(() => {
    setShowAllRecentSales(true);
  }, []);

  const handleViewMoreTopProducts = useCallback(() => {
    setShowAllTopProducts(true);
  }, []);

  const handleInventoryPress = useCallback(() => {
    onTabChange?.("inventory");
  }, [onTabChange]);

  const handleSalesTodayPress = useCallback(() => {
    onTabChange?.("sales");
  }, [onTabChange]);
  const infoRows = useMemo(
    () => [
      {
        icon: require("@/assets/images/modelinfo.png"),
        label: t("machine.info.model"),
        value: machine?.machineModel ?? "-",
      },
      {
        icon: require("@/assets/images/versioninfo.png"),
        label: t("machine.info.version"),
        value: machine?.machineVersion ?? "-",
      },
      {
        icon: require("@/assets/images/calculatorInfo.png"),
        label: t("machine.info.controller"),
        value: machine?.machineSerial ?? "-",
      },
      {
        icon: require("@/assets/images/terminalIcon.png"),
        label: t("machine.info.terminal"),
        value: machine?.terminalSerialNumber ?? machine?.pharosTerminalCode ?? "-",
      },
      {
        icon: require("@/assets/images/versionAPK.png"),
        label: t("machine.info.apkVersion"),
        value: machine?.versionCode ?? "-",
      },
      {
        icon: require("@/assets/images/calendar.png"),
        label: t("machine.info.vigencia"),
        value: machine?.activeUntilDate
          ? new Date(machine.activeUntilDate).toLocaleDateString(
              i18n.language?.startsWith("es") ? "es-ES" : (i18n.language ?? "en-US"),
              { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
            )
          : "-",
        isLink: !!machine?.activeUntilDate,
        isLinkValue: machine?.subscriptionExpired ? t("machine.info.renew") : undefined,
      },
    ],
    [
      i18n.language,
      machine?.activeUntilDate,
      machine?.machineModel,
      machine?.machineSerial,
      machine?.machineVersion,
      machine?.pharosTerminalCode,
      machine?.subscriptionExpired,
      machine?.terminalSerialNumber,
      machine?.versionCode,
      t,
    ],
  );

  const sections = useMemo<SectionItem[]>(
    () => [
      {
        key: "status",
        element: (
          <View style={styles.sectionContainer}>
            <StatusSection status={vm.status} lastPingAt={vm.lastPingAt} lang={i18n.language} />
          </View>
        ),
      },
      {
        key: "inventory",
        element: (
          <View style={styles.sectionContainer}>
            <InventorySection percentage={vm.inventoryPercent} onPress={handleInventoryPress} />
          </View>
        ),
      },
      {
        key: "kpis",
        element: (
          <View style={styles.sectionContainer}>
            <KPIsRow
              salesToday={vm.kpis.salesToday}
              currentChange={vm.kpis.currentChange}
              onSalesTodayPress={handleSalesTodayPress}
            />
          </View>
        ),
      },
      {
        key: "info",
        element: (
          <ThemeView
            style={[styles.informationSectionContainer, { borderColor: colors.border }]}
            backgroundColor={theme.colors.background.elevated}
            padded="lg"
            rounded="md"
          >
            <View style={{ marginBottom: 16 }}>
              <ThemeText variant="h6" color={colors.text.primary}>
                {t("machine.info.title")}
              </ThemeText>
            </View>

            <View style={styles.infoContainer}>
              {infoRows.map((item, index, arr) => (
                <InfoRow
                  key={`${item.label}-${index}`}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  isLink={item.isLink}
                  isLinkValue={item.isLinkValue}
                  hasMore={false}
                  isLast={index === arr.length - 1}
                />
              ))}
            </View>
          </ThemeView>
        ),
      },
      {
        key: "chart",
        element: (
          <View style={styles.sectionContainer}>
            <SalesChartSection
              title={t("machine.chart.title")}
              caption={t("machine.chart.caption")}
              series={vm.salesSeries}
            />
          </View>
        ),
      },
      {
        key: "recentSales",
        element: (
          <View style={styles.sectionContainer}>
            <RecentSalesList
              items={recentSalesItems}
              allCount={vm.recentSales.length}
              onPressItem={handleRecentSalePress}
              onViewMore={showAllRecentSales ? undefined : handleViewMoreRecentSales}
            />
          </View>
        ),
      },
      {
        key: "topProducts",
        element: (
          <View style={styles.sectionContainer}>
            <TopProductsList
              items={topProductsItems}
              allCount={vm.products.length}
              onPressItem={handleProductPress}
              onViewMore={showAllTopProducts ? undefined : handleViewMoreTopProducts}
            />
          </View>
        ),
      },
    ],
    [
      colors.border,
      colors.text.primary,
      handleProductPress,
      handleRecentSalePress,
      handleInventoryPress,
      handleSalesTodayPress,
      infoRows,
      i18n.language,
      t,
      theme.colors.background.elevated,
      vm.inventoryPercent,
      vm.kpis.currentChange,
      vm.kpis.salesToday,
      vm.lastPingAt,
      vm.salesSeries,
      vm.status,
      vm.recentSales,
      vm.products,
      showAllRecentSales,
      showAllTopProducts,
      recentSalesItems,
      topProductsItems,
      handleViewMoreRecentSales,
      handleViewMoreTopProducts,
    ],
  );

  const renderItem = useCallback(
    ({ item }: { item: SectionItem }): React.ReactElement => item.element,
    [],
  );

  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  const { contentContainerStyle, ...restListProps } = listProps ?? {};

  const combinedContentContainerStyle = useMemo(() => {
    if (!contentContainerStyle) {
      return styles.listContentContainer;
    }
    if (Array.isArray(contentContainerStyle)) {
      return [styles.listContentContainer, ...contentContainerStyle];
    }
    return [styles.listContentContainer, contentContainerStyle];
  }, [contentContainerStyle]);

  return (
    <FlatList
      data={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={combinedContentContainerStyle}
      {...restListProps}
    />
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 16,
  },
  listContentContainer: {
    paddingBottom: 16,
  },
  salesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  informationSectionContainer: {
    marginBottom: 16,
    borderWidth: 1,
    // borderColor provided via component usage
  },
  infoContainer: {
    // background via ThemeView parent
  },
});
