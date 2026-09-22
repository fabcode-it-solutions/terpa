import { ThemeText, ThemeView } from "@/components";
import { InventoryItem } from "@/components/shared/items/inventory-item";
import { InventorySkeleton } from "@/components/shared/skeletons/InventorySkeleton";
import { useColors } from "@/theme";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type FlatListProps,
} from "react-native";
import { useMachineInventory } from "@/hooks/queries/vending";
import { useTranslation } from "react-i18next";
import {
  useMachineInventoryVM,
  type InventoryRow,
} from "@/features/machine/hooks/useMachineInventoryVM";
import { useBottomContentPadding } from "@/utils/hooks";
import { useInventoryBottomSheet } from "@/provider/InventoryBottomSheetProvider";

type InventoryScreenProps = {
  teamId: string;
  machineId: string;
  listProps?: Partial<FlatListProps<InventoryRow>>;
};

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  teamId,
  machineId,
  listProps,
}) => {
  const colors = useColors();
  const { t } = useTranslation();
  const { openQuickAdjust } = useInventoryBottomSheet();

  const { data, isLoading, error, refetch, isRefetching } = useMachineInventory(teamId, machineId);
  const { inventoryData } = useMachineInventoryVM({ data });

  const bottomPad = useBottomContentPadding(10);

  // Track manual refresh separately from automatic refetches (polling)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const headerSubtitle = useMemo(() => {
    if (data?.summary?.formattedSummary) {
      return data.summary.formattedSummary;
    }
    return undefined;
  }, [data?.summary?.formattedSummary]);

  const keyExtractor = useCallback(
    (item: InventoryRow, index: number) => item.id || `${index}`,
    [],
  );

  const {
    contentContainerStyle: externalContentContainerStyle,
    style: externalListStyle,
    ...restListProps
  } = listProps ?? {};

  const handleRefresh = useCallback(() => {
    setIsManualRefreshing(true);
    void refetch();
  }, [refetch]);

  // Reset manual refresh state when refetch completes
  useEffect(() => {
    if (!isRefetching && isManualRefreshing) {
      setIsManualRefreshing(false);
    }
  }, [isRefetching, isManualRefreshing]);

  const InventoryListComponent =
    inventoryData.length === 0 ? (
      <ThemeView
        rounded="md"
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <View style={styles.emptyState}>
          <ThemeText variant="body2" color={colors.text.secondary}>
            {t("common.noData", { defaultValue: "No data" })}
          </ThemeText>
        </View>
      </ThemeView>
    ) : (
      <View
        style={[
          styles.inventoryContainer,
          {
            backgroundColor: colors.background.paper,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.inventoryHeader,
            { borderBottomColor: colors.border, backgroundColor: colors.background.paper },
          ]}
        >
          <View>
            <ThemeText variant="h6" fontWeight={700}>
              {t("inventory.title")}
            </ThemeText>
            {headerSubtitle && (
              <ThemeText variant="body2" color={colors.text.secondary}>
                {headerSubtitle}
              </ThemeText>
            )}
          </View>
        </View>

        {/* Inventory Items */}
        {inventoryData.map((item, index) => (
          <View key={keyExtractor(item, index)}>
            <InventoryItem
              imageUrl={item.imageUrl}
              title={item.title}
              sku={item.sku}
              dexNumber={item.dexNumber}
              mdbNumber={item.mdbNumber}
              micromarketCode={item.micromarketCode}
              price={item.price}
              currentCount={item.currentCount}
              maxCapacity={item.maxCapacity}
              percent={item.percent}
              machineType={item.machineType}
              onPress={() => openQuickAdjust(item)}
            />
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
      keyExtractor={() => "inventory-content"}
      renderItem={() => (
        <View>
          {/* Show error state */}
          {error && (
            <ThemeView rounded="md" style={[styles.errorContainer, { borderColor: colors.border }]}>
              <View style={{ padding: 16 }}>
                <ThemeText variant="body2">{t("inventory.error")}</ThemeText>
              </View>
            </ThemeView>
          )}

          {/* Show skeleton only on initial load when there's no data */}
          {!error && isLoading && inventoryData.length === 0 ? (
            <InventorySkeleton />
          ) : (
            !error && InventoryListComponent
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
  inventoryContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  inventoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
});
