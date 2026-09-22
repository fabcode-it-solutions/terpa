import React, { useEffect, useMemo } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomContentPadding } from "@/utils/hooks";
import { useTheme, useColors } from "@/theme/hooks";
import { useTranslation } from "react-i18next";
import { ThemeText, ThemeView } from "@/components";
import { Header } from "@/components/shared/header/header";
// import SeachBar from "@/components/shared/search-bar/search-bar";
import TeamsTable from "@/components/shared/tables/teams-table";
import { useTeams } from "@/hooks/queries/teams";
// import type { Team } from "@/services/api/schemas";
import { router } from "expo-router";
import { useTeamStore } from "@/stores/teamStore";

export default function TeamsScreen() {
  const theme = useTheme();
  const colors = useColors();
  const bottomPad = useBottomContentPadding(80);
  const { t } = useTranslation();
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const { data, isLoading, error } = useTeams();
  // Auto-select when there's exactly one team
  useEffect(() => {
    if (!isLoading && !error && Array.isArray(data) && data.length === 1) {
      const onlyTeam = data[0];
      if (onlyTeam?.id) {
        useTeamStore.getState().setSelectedTeamId(onlyTeam.id);
        router.replace({ pathname: "/(tabs)", params: { teamId: onlyTeam.id } });
      }
    }
  }, [isLoading, error, data]);
  const rows = useMemo(() => {
    return (data ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
  }, [data]);

  const onTeamPress = (team: { id: string }) => {
    // Save team globally and navigate to tabs -> machine list for selected team
    useTeamStore.getState().setSelectedTeamId(team.id);
    router.push({ pathname: "/(tabs)", params: { teamId: team.id } });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.default }}
      edges={["top"]}
    >
      <Header teamId={selectedTeamId} />
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ThemeText variant="h3">{t("teams.title", { defaultValue: "Teams" })}</ThemeText>
      </View>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        {/* <ThemeView style={{ marginBottom: 12 }}>
          <SeachBar />
        </ThemeView> */}

        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <ThemeView
            rounded="md"
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background.paper,
            }}
          >
            <ThemeText variant="body2">
              {t("teams.error", { defaultValue: "Failed to load teams." })}
            </ThemeText>
          </ThemeView>
        ) : Array.isArray(data) && data.length === 1 ? (
          // Brief placeholder while redirecting
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : (
          <TeamsTable data={rows} onPress={onTeamPress} />
        )}

        {/* bottom spacer not needed since we pad for tab bar */}
      </ScrollView>
    </SafeAreaView>
  );
}
