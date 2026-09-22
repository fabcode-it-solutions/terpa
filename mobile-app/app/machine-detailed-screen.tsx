"use client";

import React from "react";
import { ScrollView, View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useTheme, useColors } from "@/theme/hooks";
import { ThemeText } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomContentPadding } from "@/utils/hooks";
import { Header } from "@/components/shared/header/header";
import { TabSelector } from "@/components/shared/tab/tab";
import { GeneralScreen } from "@/screens/machine/GeneralScreen";
import { InventoryScreen } from "@/screens/machine/InventoryScreen";
import { SalesScreen } from "@/screens/machine/SalesScreen";
import { TerminalScreen } from "@/screens/machine/TerminalScreen";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTeamStore } from "@/stores/teamStore";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useMachineOverview } from "@/hooks/queries/vending";
import MachineDetailSkeleton from "@/components/shared/skeletons/MachineDetailSkeleton";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { InventoryBottomSheetProvider } from "@/provider/InventoryBottomSheetProvider";
import { useQueryClient } from "@tanstack/react-query";

// Main Detail Screen Component
const DetailScreen = () => {
  const theme = useTheme();
  const bottomPad = useBottomContentPadding(80);
  const colors = useColors();
  const queryClient = useQueryClient();
  type DetailTabKey = "general" | "sales" | "terminal" | "inventory";
  const { id: idParam, tab: tabParam } = useLocalSearchParams<{ id?: string; tab?: string }>();
  const [activeTabKey, setActiveTabKey] = React.useState<DetailTabKey>(() => {
    const t = (Array.isArray(tabParam) ? tabParam[0] : tabParam) ?? "general";
    return t === "sales" || t === "terminal" || t === "inventory" ? (t as DetailTabKey) : "general";
  });
  React.useEffect(() => {
    const t = (Array.isArray(tabParam) ? tabParam[0] : tabParam) ?? "";
    if (t === "sales" || t === "terminal" || t === "inventory") {
      setActiveTabKey(t as DetailTabKey);
    }
  }, [tabParam]);
  const { t } = useTranslation();
  const router = useRouter();

  // Params and team context
  // idParam is already defined above with tabParam
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const machineIdParam = Array.isArray(idParam) ? idParam[0] : idParam;
  const machineId = typeof machineIdParam === "string" ? machineIdParam : undefined;
  const teamId = selectedTeamId ?? DEFAULT_TEAM_ID ?? "team-123";

  // Fetch machine detail
  const {
    data: overview,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useMachineOverview(teamId, machineId ?? "");

  const tabs = [
    { key: "general" as const, label: t("machine.tabs.general") },
    { key: "sales" as const, label: t("machine.tabs.sales") },
    { key: "terminal" as const, label: t("machine.tabs.terminal") },
    { key: "inventory" as const, label: t("machine.tabs.inventory") },
  ];

  const baseContentStyle = React.useMemo(() => ({ paddingBottom: bottomPad }), [bottomPad]);

  const generalListProps = React.useMemo(
    () => ({
      contentContainerStyle: baseContentStyle,
      style: styles.list,
      refreshing: Boolean(isRefetching),
      onRefresh: () => {
        void refetch();
      },
    }),
    [baseContentStyle, isRefetching, refetch],
  );

  const sharedListProps = React.useMemo(
    () => ({
      contentContainerStyle: baseContentStyle,
      style: styles.list,
    }),
    [baseContentStyle],
  );

  const overviewRefreshing = Boolean(isRefetching);
  const handleOverviewRefresh = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  // Handler to refetch inventory when bottom sheet opens
  const handleInventoryItemOpen = () => {
    void queryClient.invalidateQueries({
      queryKey: ["machines", machineId, "inventory", teamId],
    });
  };

  const renderTabContent = () => {
    switch (activeTabKey) {
      case "general":
        return (
          <GeneralScreen
            machine={overview?.machine}
            latestSales={overview?.latestSales}
            topProducts={overview?.topProducts}
            salesByDay={overview?.salesByDay}
            listProps={generalListProps}
            onTabChange={setActiveTabKey}
          />
        );
      case "inventory":
        return (
          <InventoryScreen teamId={teamId} machineId={machineId!} listProps={sharedListProps} />
        );
      case "sales":
        return <SalesScreen teamId={teamId} machineId={machineId!} listProps={sharedListProps} />;
      case "terminal":
        return (
          <TerminalScreen teamId={teamId} machineId={machineId!} listProps={sharedListProps} />
        );
      default:
        return (
          <GeneralScreen
            machine={overview?.machine}
            latestSales={overview?.latestSales}
            topProducts={overview?.topProducts}
            salesByDay={overview?.salesByDay}
            listProps={generalListProps}
            onTabChange={setActiveTabKey}
          />
        );
    }
  };

  const title = overview?.machine?.name ?? t("machine.title");

  if (!machineId) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.default }]}
        edges={["top"]}
      >
        <Header teamId={selectedTeamId} />
        <View style={styles.titleContainer}>
          <ThemeText variant="h3" color={colors.text.primary}>
            Machine
          </ThemeText>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: theme.colors.error.light,
              borderRadius: 8,
            }}
          >
            <ThemeText variant="body2">Invalid or missing machine id.</ThemeText>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <InventoryBottomSheetProvider
      teamId={teamId}
      machineId={machineId ?? ""}
      onItemOpen={handleInventoryItemOpen}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.default }]}
        edges={["top"]}
      >
        <Header teamId={selectedTeamId} />

        <View style={styles.titleContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.back", { defaultValue: "Back" })}
              onPress={() => router.back()}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </Pressable>
            <ThemeText variant="h3" color={colors.text.primary}>
              {title}
            </ThemeText>
          </View>
        </View>

        {isLoading ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad }}
            refreshControl={
              <RefreshControl refreshing={overviewRefreshing} onRefresh={handleOverviewRefresh} />
            }
          >
            <MachineDetailSkeleton />
          </ScrollView>
        ) : error ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad }}
            refreshControl={
              <RefreshControl refreshing={overviewRefreshing} onRefresh={handleOverviewRefresh} />
            }
          >
            <View
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: theme.colors.error.light,
                borderRadius: 8,
              }}
            >
              <ThemeText variant="body2">
                {t("machineDetail.error", { defaultValue: "Failed to load machine details." })}
              </ThemeText>
            </View>
          </ScrollView>
        ) : (
          <>
            {(() => {
              const activeLabel = tabs.find((x) => x.key === activeTabKey)?.label ?? tabs[0].label;
              return (
                <TabSelector
                  tabs={tabs.map((x) => x.label)}
                  activeTab={activeLabel}
                  onTabPress={(label) => {
                    const found = tabs.find((x) => x.label === label)?.key ?? "general";
                    setActiveTabKey(found);
                  }}
                />
              );
            })()}
            <View style={styles.content}>{renderTabContent()}</View>
          </>
        )}
      </SafeAreaView>
    </InventoryBottomSheetProvider>
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
  content: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
});

export default DetailScreen;
