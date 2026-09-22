import { ThemeText } from "@/components";
import { Header } from "@/components/shared/header/header";
import DashboardSkeleton, { SkeletonBlock } from "@/components/shared/skeletons/DashboardSkeleton";
import { TabSelector } from "@/components/shared/tab/tab";
import {
  KPIGrid,
  SalesChart,
  SalesSummary,
  TopMachinesList,
  TopProductsList,
} from "@/features/dashboard/components/OverviewSections";
import { ReportsTab } from "@/features/dashboard/components/ReportsTab";
import type { MachineListItem, ProductListItem } from "@/features/dashboard/hooks/useDashboardVM";
import { useDashboardVM } from "@/features/dashboard/hooks/useDashboardVM";
import { useTeamDashboard, useTeamReports } from "@/hooks/queries/dashboard";
import { useTeamStore } from "@/stores/teamStore";
import { useColors, useTheme } from "@/theme/hooks";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useBottomContentPadding } from "@/utils/hooks";
import { getMonthStart, getMonthEnd } from "@/utils/timezone";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const theme = useTheme();
  const colors = useColors();
  const bottomPad = useBottomContentPadding(100);
  const { t } = useTranslation();
  type HomeTabKey = "general" | "reports";
  const [activeTabKey, setActiveTabKey] = React.useState<HomeTabKey>("general");
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const teamId = selectedTeamId ?? DEFAULT_TEAM_ID ?? "team-123";

  // Dashboard API defaults to last 30 days, no need to pass dates
  const {
    data: dashboard,
    isLoading,
    refetch: refetchDashboard,
    isRefetching: isRefetchingDashboard,
  } = useTeamDashboard(teamId);
  const vm = useDashboardVM(dashboard);

  // Reports filters - default to current month in progress (America/Monterrey timezone)
  const [reportStart, setReportStart] = React.useState<Date>(() => getMonthStart());
  const [reportEnd, setReportEnd] = React.useState<Date>(() => getMonthEnd());
  const [selectedMachineId, setSelectedMachineId] = React.useState<string | undefined>(undefined);
  const reportParams = React.useMemo(() => {
    return {
      startTime: reportStart.toISOString(),
      endTime: reportEnd.toISOString(),
      machineId: selectedMachineId,
    };
  }, [reportStart, reportEnd, selectedMachineId]);
  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
    isRefetching: isRefetchingReports,
  } = useTeamReports(teamId, reportParams);

  const [showAllMachines, setShowAllMachines] = React.useState(false);
  const machines = useMemo(
    () => (showAllMachines ? vm.topMachinesAll : vm.topMachinesAll.slice(0, 5)),
    [vm.topMachinesAll, showAllMachines],
  );

  const [showAllProducts, setShowAllProducts] = React.useState(false);
  const products = useMemo(
    () => (showAllProducts ? vm.topProductsAll : vm.topProductsAll.slice(0, 5)),
    [vm.topProductsAll, showAllProducts],
  );

  const handleMachinePress = (machine: MachineListItem) => {
    if (machine?.id) {
      router.push(`/machine-detailed-screen?id=${encodeURIComponent(machine.id)}`);
    }
  };

  const handleViewMoreMachines = () => {
    setShowAllMachines(true);
  };

  const handleProductPress = (_product: ProductListItem) => {};

  const handleViewMoreProducts = () => {
    setShowAllProducts(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background.default }]}>
        <Header teamId={selectedTeamId} />

        <View style={styles.titleContainer}>
          {isLoading ? (
            <SkeletonBlock height={32} width={200} />
          ) : (
            <ThemeText variant="h3">{vm.teamName ?? t("dashboard.title")}</ThemeText>
          )}
        </View>

        {(() => {
          const tabs = [
            { key: "general" as const, label: t("machine.tabs.general") },
            { key: "reports" as const, label: t("reports") },
          ];
          const activeTabLabel = tabs.find((x) => x.key === activeTabKey)?.label ?? tabs[0].label;
          return (
            <TabSelector
              tabs={tabs.map((x) => x.label)}
              activeTab={activeTabLabel}
              onTabPress={(label) => {
                const found = tabs.find((x) => x.label === label)?.key ?? "general";
                setActiveTabKey(found);
              }}
            />
          );
        })()}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(
                activeTabKey === "general" ? isRefetchingDashboard : isRefetchingReports,
              )}
              onRefresh={activeTabKey === "general" ? refetchDashboard : refetchReports}
            />
          }
        >
          {activeTabKey === "general" ? (
            isLoading && !dashboard ? (
              <DashboardSkeleton />
            ) : (
              <>
                <View style={styles.section}>
                  <SalesSummary
                    title={t("dashboard.salesCard.title")}
                    total={vm.kpis.totalSales}
                    card={vm.kpis.cardAmount}
                    cash={vm.kpis.cashAmount}
                    free={vm.kpis.freeAmount}
                    remote={vm.kpis.remoteAmount}
                  />
                </View>

                <View style={styles.section}>
                  <SalesChart series={vm.salesSeries} />
                </View>

                <View style={styles.section}>
                  <KPIGrid counts={vm.kpis.machineCounts} />
                </View>

                <View style={styles.section}>
                  <TopMachinesList
                    title={t("dashboard.lists.topMachines")}
                    subtitle={t("dashboard.lists.subtitle30d")}
                    items={machines}
                    allCount={vm.topMachinesAll.length}
                    onItemPress={handleMachinePress}
                    onViewMore={handleViewMoreMachines}
                  />
                </View>

                <View style={styles.section}>
                  <TopProductsList
                    title={t("dashboard.lists.topProducts")}
                    subtitle={t("dashboard.lists.subtitle30d")}
                    items={products}
                    allCount={vm.topProductsAll.length}
                    onItemPress={handleProductPress}
                    onViewMore={handleViewMoreProducts}
                  />
                </View>
              </>
            )
          ) : reportsLoading && !reportsData ? (
            <DashboardSkeleton />
          ) : (
            <ReportsTab
              data={reportsData}
              reportStart={reportStart}
              reportEnd={reportEnd}
              onRangeChange={(start, end) => {
                setReportStart(start);
                setReportEnd(end);
              }}
              selectedMachineId={selectedMachineId}
              onMachineChange={setSelectedMachineId}
              onMachinePress={handleMachinePress}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
});
