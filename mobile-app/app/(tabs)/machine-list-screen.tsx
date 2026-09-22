import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useTheme } from "@/theme/hooks";
import { ThemeText, ThemeView } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomContentPadding, useDebounce } from "@/utils/hooks";
import { Header } from "@/components/shared/header/header";
import { StatCard } from "@/components/shared/card/stat-card";
import SearchBar from "@/components/shared/search-bar/search-bar";
import StatusFilter from "@/components/shared/filter/status-filter";
import MachineListTable, {
  type MachineListRow,
} from "@/components/shared/tables/machine-list-table";
import { useMachines } from "@/hooks/queries/vending";
import { useMachineFilters } from "@/hooks/useMachineFilters";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useLocalSearchParams } from "expo-router";
import { useTeamStore } from "@/stores/teamStore";
import { useTranslation } from "react-i18next";
import type { VendingMachine } from "@/services/api/schemas";

type SectionItem = {
  key: string;
  element: React.ReactElement;
};

const MachineScreen: React.FC = () => {
  const theme = useTheme();
  const bottomPad = useBottomContentPadding(100);
  const { t } = useTranslation();
  const { teamId: teamIdParam } = useLocalSearchParams<{ teamId?: string }>();
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const teamId =
    (teamIdParam as string | undefined) ?? selectedTeamId ?? DEFAULT_TEAM_ID ?? "team-123";

  const { status, query, setStatus, setQuery } = useMachineFilters();
  const debouncedQuery = useDebounce(query, 300);
  const debouncedParams = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      query: debouncedQuery?.trim() || undefined,
    }),
    [status, debouncedQuery],
  );
  const { data, isLoading, error, refetch, isRefetching } = useMachines(teamId, debouncedParams);

  const machines: MachineListRow[] = useMemo(() => {
    if (!data?.machines) return [];
    return data.machines.map((machine: VendingMachine): MachineListRow => {
      const normalizedStatus: MachineListRow["status"] =
        machine.status === "online" ||
        machine.status === "offline" ||
        machine.status === "warning" ||
        machine.status === "intermittent"
          ? machine.status
          : "intermittent";
      return {
        id: machine.id,
        name: machine.name,
        inventory: machine.inventoryPercent ?? 0,
        status: normalizedStatus,
        salesToday: typeof machine.salesToday === "number" ? machine.salesToday : 0,
        currentChange: typeof machine.currentChange === "number" ? machine.currentChange : 0,
      };
    });
  }, [data?.machines]);

  const counts = data?.counts ?? { total: 0, online: 0, warning: 0, offline: 0 };

  const machineListContent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      );
    }

    if (error) {
      return (
        <ThemeView
          style={[
            styles.errorBox,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.error.light,
            },
          ]}
          rounded="md"
        >
          <ThemeText variant="body2">{t("machineList.error")}</ThemeText>
        </ThemeView>
      );
    }

    return <MachineListTable machineData={machines} />;
  }, [error, isLoading, machines, t, theme.colors.border, theme.colors.error.light]);

  const sections = useMemo<SectionItem[]>(
    () => [
      {
        key: "statsRow1",
        element: (
          <View style={styles.statsRow}>
            <StatCard title="Total" value={counts.total.toString()} subtitle="" icon={undefined} />
            <StatCard
              title={t("dashboard.stats.offline")}
              value={counts.offline.toString()}
              subtitle=""
              icon="error"
            />
          </View>
        ),
      },
      {
        key: "statsRow2",
        element: (
          <View style={styles.statsRow}>
            <StatCard
              title={t("dashboard.stats.warning")}
              value={counts.warning.toString()}
              subtitle=""
              icon="warning"
            />
            <StatCard
              title={t("dashboard.stats.online")}
              value={counts.online.toString()}
              subtitle=""
              icon="check-circle"
            />
          </View>
        ),
      },
      {
        key: "search",
        element: (
          <View style={styles.section}>
            <SearchBar value={query} onChangeText={setQuery} />
          </View>
        ),
      },
      {
        key: "filter",
        element: (
          <View style={styles.section}>
            <StatusFilter value={status} onValueChange={setStatus} />
          </View>
        ),
      },
      {
        key: "machineList",
        element: <View style={styles.section}>{machineListContent}</View>,
      },
    ],
    [
      counts.offline,
      counts.online,
      counts.total,
      counts.warning,
      machineListContent,
      query,
      setQuery,
      setStatus,
      status,
      t,
    ],
  );

  const renderSection = useCallback(
    ({ item }: { item: SectionItem }): React.ReactElement => item.element,
    [],
  );
  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      edges={["top"]}
    >
      <Header teamId={selectedTeamId} />

      <View style={styles.titleContainer}>
        <ThemeText variant="h3">{t("navigation.tabs.machine")}</ThemeText>
      </View>

      <FlatList
        style={styles.content}
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshing={Boolean(isRefetching)}
        onRefresh={refetch}
      />
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
  content: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  errorBox: {
    padding: 16,
    borderWidth: 1,
    // borderColor + backgroundColor applied via theme in component usage
  },
});

export default MachineScreen;
