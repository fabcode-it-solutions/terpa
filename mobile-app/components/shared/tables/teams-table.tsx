import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { useColors, useTheme } from "@/theme";
import { useTranslation } from "react-i18next";

export interface TeamRow {
  id: string;
  name: string;
  slug?: string;
}

interface TeamsTableProps {
  data: TeamRow[];
  title?: string;
  emptyMessage?: string;
  onPress?: (team: TeamRow) => void;
}

export const TeamsTable: React.FC<TeamsTableProps> = ({ data, title, emptyMessage, onPress }) => {
  const colors = useColors();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemeView
      style={[styles.card, { borderColor: colors.border }]}
      rounded="md"
      backgroundColor={colors.background.elevated}
    >
      {title && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: theme.spacing.md,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ThemeText variant="h6" fontWeight={600}>
            {title || t("teams.title", { defaultValue: "Teams" })}
          </ThemeText>
        </View>
      )}

      {/* Header */}
      <View style={[styles.headerRow, { borderColor: colors.border }]}>
        <ThemeText
          variant="subtitle2"
          color={colors.text.secondary}
          fontWeight={600}
          style={styles.headerName}
        >
          {t("products.table.name", { defaultValue: "Nombre" })}
        </ThemeText>
        <ThemeText
          variant="subtitle2"
          color={colors.text.secondary}
          fontWeight={600}
          style={styles.headerSlug}
        >
          {t("teams.slug", { defaultValue: "Slug" })}
        </ThemeText>
      </View>

      {data.length === 0 ? (
        <View style={{ padding: 16, alignItems: "center" }}>
          <ThemeText variant="body2" color={colors.text.secondary}>
            {emptyMessage ?? t("teams.empty", { defaultValue: "No teams found" })}
          </ThemeText>
        </View>
      ) : (
        data.map((team, idx) => (
          <TouchableOpacity key={team.id} onPress={() => onPress?.(team)} activeOpacity={0.75}>
            <ThemeView
              style={{
                backgroundColor: colors.background.paper,
                paddingVertical: 16,
                paddingHorizontal: theme.spacing.md,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ThemeText variant="body1" style={styles.cellName}>
                  {team.name}
                </ThemeText>
                <ThemeText variant="body2" color={colors.text.secondary} style={styles.cellSlug}>
                  {team.slug ?? "—"}
                </ThemeText>
              </View>
            </ThemeView>
          </TouchableOpacity>
        ))
      )}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderWidth: 1,
    // borderColor provided via ThemeView usage or inline where needed
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerName: { flex: 2 },
  headerSlug: { flex: 1, textAlign: "right" as const },
  cellName: { flex: 2 },
  cellSlug: { flex: 1, textAlign: "right" as const },
});

export default TeamsTable;
