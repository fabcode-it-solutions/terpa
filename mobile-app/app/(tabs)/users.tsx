import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { FlatListProps } from "react-native";
import { useColors } from "@/theme/hooks";
import { ThemeText } from "@/components";
import { Header } from "@/components/shared/header/header";
import SeachBar from "@/components/shared/search-bar/search-bar";
import { UsersList, type UserRow } from "@/features/users/components/UsersList";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTeamStore } from "@/stores/teamStore";
import { DEFAULT_TEAM_ID } from "@/utils/config";
import { useTeamUsers } from "@/hooks/queries/users";
import { useBottomContentPadding } from "@/utils/hooks";

type SectionItem = {
  key: string;
  element: React.ReactElement;
};

const UsersScreen: React.FC = () => {
  const colors = useColors();
  const bottomPad = useBottomContentPadding(100);
  const { t, i18n } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const selectedTeamId = useTeamStore((s) => s.selectedTeamId);
  const teamId = selectedTeamId ?? DEFAULT_TEAM_ID ?? "team-123";

  const { data, refetch } = useTeamUsers(teamId, {
    query: searchText.trim() || undefined,
  });

  const userData = useMemo<UserRow[]>(() => {
    const lang = i18n.language || "en";
    const toRole = (r?: string) => {
      if (!r) return "";
      if (lang.startsWith("es"))
        return r === "OWNER" ? "Propietario" : r === "OPERATOR" ? "Operador" : r;
      return r === "OWNER" ? "Owner" : r === "OPERATOR" ? "Operator" : r;
    };
    const roleColor = (r?: string) =>
      r === "OWNER" ? colors.red[500] : r === "OPERATOR" ? colors.blue[500] : undefined;
    const members = data?.members ?? [];
    return members.map((m) => ({
      id: m.userId,
      email: m.email,
      role: toRole(m.role),
      roleColor: roleColor(m.role),
      type: "user" as const,
    }));
  }, [data?.members, i18n.language, colors.red, colors.blue]);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Props for nested UsersList - scrolling disabled since main FlatList handles it
  const listProps = useMemo<Partial<FlatListProps<UserRow>>>(
    () => ({
      scrollEnabled: false,
    }),
    [],
  );

  const handleItemPress = (_item: UserRow) => {};

  const sections = useMemo<SectionItem[]>(
    () => [
      {
        key: "search",
        element: (
          <View style={styles.section}>
            <SeachBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("users.searchPlaceholder")}
            />
          </View>
        ),
      },
      {
        key: "usersList",
        element: (
          <View style={styles.section}>
            <UsersList data={userData} onItemPress={handleItemPress} listProps={listProps} />
          </View>
        ),
      },
    ],
    [searchText, setSearchText, t, userData, listProps],
  );

  const renderSection = useCallback(
    ({ item }: { item: SectionItem }): React.ReactElement => item.element,
    [],
  );
  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.default }]}
      edges={["top"]}
    >
      <Header teamId={selectedTeamId} />

      <View style={styles.titleContainer}>
        <ThemeText variant="h3">{t("navigation.tabs.users")}</ThemeText>
      </View>

      <FlatList
        style={styles.content}
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
};

export default UsersScreen;

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
});
