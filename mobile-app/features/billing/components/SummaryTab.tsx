import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { useColors, useSpacing } from "@/theme";
import BillingSkeleton from "@/components/shared/skeletons/BillingSkeleton";
import Filter from "@/components/shared/filter/Filter";
import { MachineRow } from "./Tables";

type SummaryTabProps = {
  isLoading: boolean;
  billing: any;
  machines: Array<{ name: string; period: any; status: string; statusLabel: string }>;
  unpaidCount: number;
  filters: {
    year: string;
    monthLabel: string;
    statusLabel: string;
    yearOptions: Array<{ label: string; value: string }>;
    monthOptions: Array<{ label: string; value: string }>;
    statusOptions: Array<{ label: string; value: string }>;
    onYearChange: (value: string) => void;
    onMonthChange: (value: string) => void;
    onStatusChange: (value: string) => void;
  };
  t: any;
};

export const SummaryTab: React.FC<SummaryTabProps> = memo(
  ({ isLoading, billing, machines, unpaidCount, filters, t }) => {
    const colors = useColors();
    const spacing = useSpacing();
    const styles = useStyles();

    if (isLoading) return <BillingSkeleton />;

    return (
      <>
        <View style={styles.section}>
          <ThemeView row style={[styles.filtersContainer, { gap: 8 }]}>
            <Filter
              label={t("billing.filters.year")}
              options={filters.yearOptions}
              selected={filters.year}
              onSelect={filters.onYearChange}
              style={{ flex: 1 }}
            />
            <Filter
              label={t("billing.filters.month")}
              options={filters.monthOptions}
              selected={filters.monthLabel}
              onSelect={filters.onMonthChange}
              style={{ flex: 1 }}
            />
          </ThemeView>
          <ThemeView row style={styles.filtersContainer}>
            <Filter
              label={t("billing.filters.status.title")}
              options={filters.statusOptions}
              selected={filters.statusLabel}
              onSelect={filters.onStatusChange}
              style={{ flex: 1, marginTop: 8 }}
            />
          </ThemeView>
        </View>

        <View style={[styles.section, { flexDirection: "row", gap: 16 }]}>
          <ThemeView
            style={[
              styles.summaryCard,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
            padded="md"
            rounded="md"
          >
            <ThemeText variant="subtitle3" style={{ marginBottom: spacing.md }}>
              {t("billing.summary.totalMachines")}
            </ThemeText>
            <ThemeText variant="h3">
              {String(billing?.summary?.machineCount ?? machines.length)}
            </ThemeText>
          </ThemeView>

          <ThemeView
            style={[
              styles.summaryCard,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
            padded="md"
            rounded="md"
          >
            <ThemeView style={styles.statusSummary}>
              <ThemeView row style={[styles.statusItem, { marginBottom: spacing.md }]}>
                <ThemeView
                  style={[styles.statusIndicator, { backgroundColor: colors.text.secondary }]}
                />
                <ThemeText variant="subtitle3" style={{ marginLeft: spacing.sm }}>
                  {t("billing.summary.unpaid")}
                </ThemeText>
              </ThemeView>
            </ThemeView>
            <ThemeText variant="h3">{String(unpaidCount)}</ThemeText>
          </ThemeView>
        </View>

        <ThemeView
          style={[
            styles.tableContainer,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
          rounded="md"
        >
          <ThemeView row style={[styles.tableHeader, { borderColor: colors.border }]}>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.summary.table.machine")}
              </ThemeText>
            </ThemeView>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.summary.table.period")}
              </ThemeText>
            </ThemeView>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.summary.table.status")}
              </ThemeText>
            </ThemeView>
          </ThemeView>
          {machines.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center", justifyContent: "center" }}>
              <ThemeText variant="body2" color={colors.text.secondary}>
                {t("common.noData", { defaultValue: "No data" })}
              </ThemeText>
            </View>
          ) : (
            machines.map((m, index) => (
              <MachineRow
                key={`machine-${index}`}
                name={m.name}
                period={m.period?.periodFormatted}
                status={m.status}
                statusLabel={m.statusLabel}
              />
            ))
          )}
        </ThemeView>
      </>
    );
  },
);

SummaryTab.displayName = "SummaryTab";

const useStyles = () =>
  StyleSheet.create({
    section: { marginBottom: 16 },
    filtersContainer: { flexDirection: "row", justifyContent: "space-between" },
    summaryCard: { flex: 1, borderWidth: 1 },
    statusSummary: {},
    statusItem: { alignItems: "center" },
    statusIndicator: { width: 12, height: 12, borderRadius: 6 },
    tableContainer: { borderWidth: 1, overflow: "hidden" },
    tableHeader: { borderBottomWidth: 1, padding: 16 },
    tableCell: { flex: 1 },
  });
