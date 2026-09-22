import React, { useMemo, useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useColors, useTheme } from "@/theme/hooks";
import { ThemeText } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomContentPadding } from "@/utils/hooks";
import { Header } from "@/components/shared/header/header";
import { TabSelector } from "@/components/shared/tab/tab";
import { useTeamStore } from "@/stores/teamStore";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useBillingSummary, useBillingListing } from "@/hooks/queries/billing";
import { useTranslation } from "react-i18next";
import { monthOptionsForLocale } from "@/utils/date";
import { useBillingVM } from "@/features/billing/hooks/useBillingVM";
import { SummaryTab } from "@/features/billing/components/SummaryTab";
import { HistoryTab } from "@/features/billing/components/HistoryTab";

// Summary Tab component - Separated for better code organization

export const BillingScreen: React.FC = () => {
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const bottomPad = useBottomContentPadding(100);

  // Initialize with current date once
  const initialDate = useMemo(() => new Date(), []);
  const initialYear = String(initialDate.getFullYear());
  const initialMonth = String(initialDate.getMonth() + 1);

  // Summary tab filters
  const [summaryYear, setSummaryYear] = useState(initialYear);
  const [summaryMonthValue, setSummaryMonthValue] = useState(initialMonth);
  const [summaryStatusValue, setSummaryStatusValue] = useState("ALL");

  // History tab filters
  const [historyYear, setHistoryYear] = useState(initialYear);
  const [historyMonthValue, setHistoryMonthValue] = useState(initialMonth);
  const [historyStatusValue, setHistoryStatusValue] = useState("ALL");

  // Options - memoized
  const currentYear = initialDate.getFullYear();
  const yearOptions = useMemo(
    () =>
      [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
        label: String(y),
        value: String(y),
      })),
    [currentYear],
  );
  const monthOptions = useMemo(() => monthOptionsForLocale(i18n.language), [i18n.language]);
  const statusOptions = useMemo(
    () => [
      { label: t("billing.filters.status.all"), value: "ALL" },
      { label: t("billing.filters.status.paid"), value: "PAYMENT_SUCCESS" },
      // Map UI "Pending" to the backend's verification pending status
      { label: t("billing.filters.status.pending"), value: "PAYMENT_VERIFICATION_PENDING" },
      { label: t("billing.filters.status.unpaid"), value: "PAYMENT_PENDING" },
    ],
    [t],
  );

  type BillingTabKey = "summary" | "history";
  const [activeTabKey, setActiveTabKey] = useState<BillingTabKey>("summary");
  const [page, setPage] = useState(1);

  // Mapping helpers - memoized
  // Selected values are passed; Filter component displays labels
  const summaryMonthLabel = useMemo(() => summaryMonthValue, [summaryMonthValue]);
  const summaryStatusLabel = useMemo(() => summaryStatusValue, [summaryStatusValue]);
  const historyMonthLabel = useMemo(() => historyMonthValue, [historyMonthValue]);
  const historyStatusLabel = useMemo(() => historyStatusValue, [historyStatusValue]);

  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const teamId = useMemo(() => selectedTeamId ?? DEFAULT_TEAM_ID ?? "team-123", [selectedTeamId]);

  // API calls
  const normalizeStatus = useCallback((value?: string) => {
    if (!value || value === "ALL") return undefined;
    return value;
  }, []);

  const {
    data: billing,
    isLoading,
    refetch: refetchSummary,
  } = useBillingSummary(teamId, {
    year: Number(summaryYear),
    month: Number(summaryMonthValue),
    // Backend ignores status on summary; safe to include normalized value
    status: normalizeStatus(summaryStatusValue),
  });

  const {
    data: listing,
    isLoading: isListingLoading,
    refetch: refetchListing,
  } = useBillingListing(teamId, {
    page,
    year: Number(historyYear),
    month: Number(historyMonthValue),
    status: normalizeStatus(historyStatusValue),
  });

  // Derived data - memoized
  const { machines, unpaidCount } = useBillingVM(billing);
  // Apply client-side status filtering for summary (backend ignores status here)
  const filteredMachines = useMemo(() => {
    if (!summaryStatusValue || summaryStatusValue === "ALL") return machines;
    const target =
      summaryStatusValue === "PAYMENT_VERIFICATION_PENDING" || "PAYMENT_PENDING"
        ? "NOT_INVOICED"
        : summaryStatusValue;
    console.log("Filtering machines by status:", target);
    return machines.filter((m) => (m.status ?? "").toString() === target);
  }, [machines, summaryStatusValue]);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTabKey === "summary") {
        await refetchSummary();
      } else {
        await refetchListing();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTabKey, refetchSummary, refetchListing]);

  // Tabs config with stable keys
  const tabs = useMemo(
    () => [
      { key: "summary" as const, label: t("billing.tabs.summary") },
      { key: "history" as const, label: t("billing.tabs.history") },
    ],
    [t],
  );

  const activeTabLabel = useMemo(
    () => tabs.find((x) => x.key === activeTabKey)?.label ?? tabs[0].label,
    [tabs, activeTabKey],
  );

  // Callbacks - memoized
  const handleTabPress = useCallback(
    (label: string) => {
      const found = tabs.find((x) => x.label === label)?.key ?? "summary";
      setActiveTabKey(found);
    },
    [tabs],
  );

  const handleSummaryYearChange = useCallback((v: string) => setSummaryYear(v), []);
  const handleSummaryMonthChange = useCallback((v: string) => setSummaryMonthValue(v), []);
  const handleSummaryStatusChange = useCallback((v: string) => setSummaryStatusValue(v), []);

  const handleHistoryYearChange = useCallback((v: string) => {
    setPage(1);
    setHistoryYear(v);
  }, []);
  const handleHistoryMonthChange = useCallback((v: string) => {
    setPage(1);
    setHistoryMonthValue(v);
  }, []);
  const handleHistoryStatusChange = useCallback((v: string) => {
    setPage(1);
    setHistoryStatusValue(v);
  }, []);

  // Filter props objects - memoized
  const summaryFilters = useMemo(
    () => ({
      year: summaryYear,
      monthLabel: summaryMonthLabel,
      statusLabel: summaryStatusLabel,
      yearOptions,
      monthOptions,
      statusOptions,
      onYearChange: handleSummaryYearChange,
      onMonthChange: handleSummaryMonthChange,
      onStatusChange: handleSummaryStatusChange,
    }),
    [
      summaryYear,
      summaryMonthLabel,
      summaryStatusLabel,
      yearOptions,
      monthOptions,
      statusOptions,
      handleSummaryYearChange,
      handleSummaryMonthChange,
      handleSummaryStatusChange,
    ],
  );

  const historyFilters = useMemo(
    () => ({
      year: historyYear,
      monthLabel: historyMonthLabel,
      statusLabel: historyStatusLabel,
      yearOptions,
      monthOptions,
      statusOptions,
      onYearChange: handleHistoryYearChange,
      onMonthChange: handleHistoryMonthChange,
      onStatusChange: handleHistoryStatusChange,
    }),
    [
      historyYear,
      historyMonthLabel,
      historyStatusLabel,
      yearOptions,
      monthOptions,
      statusOptions,
      handleHistoryYearChange,
      handleHistoryMonthChange,
      handleHistoryStatusChange,
    ],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      edges={["top"]}
    >
      <View style={[{ backgroundColor: colors.background.default }]}>
        <Header teamId={selectedTeamId} />
        <View style={styles.titleContainer}>
          <ThemeText variant="h3">{t("navigation.tabs.billing")}</ThemeText>
        </View>

        <View style={styles.tabContainer}>
          <TabSelector
            tabs={tabs.map((x) => x.label)}
            activeTab={activeTabLabel}
            onTabPress={handleTabPress}
          />
        </View>
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTabKey === "summary" ? (
          <SummaryTab
            isLoading={isLoading}
            billing={billing}
            machines={filteredMachines}
            unpaidCount={unpaidCount}
            filters={summaryFilters}
            t={t}
          />
        ) : activeTabKey === "history" ? (
          <HistoryTab
            isLoading={isListingLoading}
            listing={listing}
            page={page}
            setPage={setPage}
            filters={historyFilters}
            t={t}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabContainer: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default BillingScreen;
