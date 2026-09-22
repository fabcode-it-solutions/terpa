import { SalesCard } from "@/components/shared/card/SalesCard";
import { DateNavigator } from "@/components/shared/date-navigator/date-navigator";
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  type FlatListProps,
} from "react-native";
import { useMachineSales } from "@/hooks/queries/vending";
import { useTranslation } from "react-i18next";
import { useBottomContentPadding, useDateNavigator } from "@/utils/hooks";
import { useMachineSalesVM, type SalesRow } from "@/features/machine/hooks/useMachineSalesVM";
import { TransactionItem } from "@/components/shared/items/sales-transaction-item";
import { ThemeText, ThemeView } from "@/components";
import { useColors } from "@/theme";
import { SalesSkeleton } from "@/components/shared/skeletons/SalesSkeleton";

type SalesScreenProps = {
  teamId: string;
  machineId: string;
  listProps?: Partial<FlatListProps<SalesRow>>;
};

export const SalesScreen: React.FC<SalesScreenProps> = ({ teamId, machineId, listProps }) => {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const { selectedDate, setSelectedDate, isoDate, shortFormattedDate, prev, next } =
    useDateNavigator(undefined, i18n.language);
  const { data, isLoading, refetch, isRefetching } = useMachineSales(teamId, machineId, isoDate);
  const { salesData } = useMachineSalesVM({ data, lang: i18n.language, t });
  const bottomPad = useBottomContentPadding(10);

  // Track manual refresh separately from automatic refetches
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const previousDateRef = useRef(isoDate);

  const handleRefresh = () => {
    setIsManualRefreshing(true);
    void refetch();
  };

  // Reset manual refresh state when refetch completes
  useEffect(() => {
    if (!isRefetching && isManualRefreshing) {
      setIsManualRefreshing(false);
    }
  }, [isRefetching, isManualRefreshing]);

  // Track date changes
  useEffect(() => {
    previousDateRef.current = isoDate;
  }, [isoDate]);

  const keyExtractor = (item: SalesRow, index: number) => {
    if (item?.id) return String(item.id);
    const parts = [
      item?.dexNumber,
      item?.mdbNumber,
      item?.date,
      item?.time,
      index.toString(),
    ].filter(Boolean);
    return parts.join("-");
  };

  const SalesCardComponent = useMemo(
    () => (
      <SalesCard
        totalSales={{
          label: t("sales.total", { count: salesData.length }),
          value: data?.summary.totalSales?.valueCents,
          formatted: data?.summary.totalSales?.valueFormatted,
        }}
        cashSales={{
          label: t("sales.cardSales"),
          value: data?.summary.byPaymentMethod?.card?.total?.valueCents,
          formatted: data?.summary.byPaymentMethod?.card?.total?.valueFormatted,
        }}
        effectiveSales={{
          label: t("sales.cashSales"),
          value: data?.summary.byPaymentMethod?.cash?.total?.valueCents,
          formatted: data?.summary.byPaymentMethod?.cash?.total?.valueFormatted,
        }}
      />
    ),
    [t, salesData.length, data?.summary],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <ThemeView
        rounded="md"
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <View style={styles.emptyState}>
          <ThemeText variant="body2" color={colors.text.secondary}>
            {t("sales.empty")}
          </ThemeText>
        </View>
      </ThemeView>
    ),
    [colors, t],
  );

  const {
    contentContainerStyle: externalContentContainerStyle,
    style: externalListStyle,
    ...restListProps
  } = listProps ?? {};

  const ListComponent =
    salesData.length === 0 ? (
      ListEmptyComponent
    ) : (
      <View
        style={[
          styles.transactionsContainer,
          {
            backgroundColor: colors.background.paper,
            borderColor: colors.border,
          },
        ]}
      >
        {salesData.map((item, index) => (
          <View key={keyExtractor(item, index)}>
            <TransactionItem {...item} isLast={index === salesData.length - 1} />
          </View>
        ))}
      </View>
    );

  return (
    <FlatList
      style={[styles.container, externalListStyle]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          marginBottom: Platform.OS === "ios" ? bottomPad : 0,
        },
        externalContentContainerStyle,
      ]}
      data={[null] as any[]}
      keyExtractor={() => "sales-content"}
      renderItem={() => (
        <View>
          {/* Date Navigator - always visible */}
          <DateNavigator
            date={shortFormattedDate}
            value={selectedDate}
            onPrevious={prev}
            onNext={next}
            onDateChange={(date) => setSelectedDate(date)}
          />

          {/* Show skeleton while loading or during date changes (but not manual refresh) */}
          {isLoading || (isRefetching && !isManualRefreshing) ? (
            <SalesSkeleton />
          ) : (
            <View>
              {SalesCardComponent}
              {ListComponent}
            </View>
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />}
      {...restListProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  transactionsContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  emptyContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
