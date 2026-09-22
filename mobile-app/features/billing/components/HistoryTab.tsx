import React, { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { useColors } from "@/theme";
import ListingSkeleton from "@/components/shared/skeletons/ListingSkeleton";
import Filter from "@/components/shared/filter/Filter";
import { InvoiceRow } from "./Tables";

type HistoryTabProps = {
  isLoading: boolean;
  listing: any;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
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

export const HistoryTab: React.FC<HistoryTabProps> = memo(
  ({ isLoading, listing, page, setPage, filters, t }) => {
    const colors = useColors();
    const styles = useStyles();

    const handlePrevPage = useCallback(() => {
      if (listing?.pagination?.hasPreviousPage) {
        setPage((p) => Math.max(1, p - 1));
      }
    }, [listing?.pagination?.hasPreviousPage, setPage]);

    const handleNextPage = useCallback(() => {
      if (listing?.pagination?.hasNextPage) {
        setPage((p) => p + 1);
      }
    }, [listing?.pagination?.hasNextPage, setPage]);

    if (isLoading) return <ListingSkeleton />;

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
                {t("billing.history.table.machine")}
              </ThemeText>
            </ThemeView>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.history.table.period")}
              </ThemeText>
            </ThemeView>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.history.table.amount")}
              </ThemeText>
            </ThemeView>
            <ThemeView style={styles.tableCell}>
              <ThemeText
                color={colors.text.secondary}
                style={{ lineHeight: 16 }}
                variant="subtitle3"
              >
                {t("billing.history.table.status")}
              </ThemeText>
            </ThemeView>
          </ThemeView>
          {(listing?.invoices ?? []).length === 0 ? (
            <View style={{ padding: 16 }}>
              <ThemeText color={colors.text.secondary} variant="body2">
                {t("billing.history.empty")}
              </ThemeText>
            </View>
          ) : (
            (listing?.invoices ?? []).map((inv: any) => (
              <InvoiceRow key={inv.id ?? `invoice-${inv.number}`} invoice={inv} />
            ))
          )}
        </ThemeView>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ThemeView
            rounded="sm"
            padded="xs"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              opacity: listing?.pagination?.hasPreviousPage ? 1 : 0.5,
            }}
          >
            <ThemeText variant="body2" onPress={handlePrevPage}>
              ← {t("billing.history.prev")}
            </ThemeText>
          </ThemeView>
          <ThemeText variant="caption" color={colors.text.secondary}>
            {t("billing.history.pageOf", {
              page: listing?.pagination?.page ?? page,
              total: listing?.pagination?.totalPages ?? 1,
            })}
          </ThemeText>
          <ThemeView
            rounded="sm"
            padded="xs"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              opacity: listing?.pagination?.hasNextPage ? 1 : 0.5,
            }}
          >
            <ThemeText variant="body2" onPress={handleNextPage}>
              {t("billing.history.next")} →
            </ThemeText>
          </ThemeView>
        </View>
      </>
    );
  },
);

HistoryTab.displayName = "HistoryTab";

const useStyles = () =>
  StyleSheet.create({
    section: { marginBottom: 16 },
    filtersContainer: { flexDirection: "row", justifyContent: "space-between" },
    tableContainer: { marginBottom: 16, borderWidth: 1, overflow: "hidden" },
    tableHeader: { borderBottomWidth: 1, padding: 16 },
    tableCell: { flex: 1 },
  });
