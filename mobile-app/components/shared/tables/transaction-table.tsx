import React, { useMemo, useCallback } from "react";
import type { ComponentProps } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { TransactionItem } from "@/components/shared/items/sales-transaction-item";
import { useColors } from "@/theme";

export interface ColumnConfig {
  key: string;
  label: string;
  width?: number | string;
  align?: "left" | "center" | "right";
}

type TransactionItemData = ComponentProps<typeof TransactionItem>;

export interface TransactionTableProps {
  data: TransactionItemData[];
  columns: ColumnConfig[];
  title?: string;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  listProps?: Partial<FlatListProps<TransactionItemData>>;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  data,
  columns,
  title,
  emptyMessage = "No transactions found",
  style,
  listProps,
}) => {
  const colors = useColors();

  const {
    contentContainerStyle,
    ListEmptyComponent,
    ListHeaderComponent: externalListHeaderComponent,
    ...restListProps
  } = listProps ?? {};

  const combinedContentContainerStyle = useMemo(() => {
    const base = data.length === 0 ? styles.emptyListContent : undefined;
    if (!base && !contentContainerStyle) return undefined;
    if (base && contentContainerStyle) {
      return [base, contentContainerStyle];
    }
    return base ?? contentContainerStyle;
  }, [contentContainerStyle, data.length]);

  const keyExtractor = useCallback((item: TransactionItemData, index: number) => {
    if (item?.id) return String(item.id);
    const parts = [
      item?.dexNumber,
      item?.mdbNumber,
      item?.date,
      item?.time,
      index.toString(),
    ].filter(Boolean);
    return parts.join("-");
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: TransactionItemData }) => <TransactionItem {...item} />,
    [],
  );

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <ThemeText variant="body2" color={colors.text.secondary}>
          {emptyMessage}
        </ThemeText>
      </View>
    ),
    [colors.text.secondary, emptyMessage],
  );

  return (
    <ThemeView
      rounded="md"
      style={[
        styles.transactionTable,
        { backgroundColor: colors.background.paper, borderColor: colors.border },
        style,
      ]}
    >
      {title && (
        <ThemeView style={styles.tableTitle} backgroundColor="background.secondary">
          <ThemeText variant="h6" fontWeight={600}>
            {title}
          </ThemeText>
        </ThemeView>
      )}

      <View
        style={[
          styles.tableHeader,
          {
            borderColor: colors.border,
            backgroundColor: colors.background.paper,
          },
        ]}
      >
        {columns.map((column) => (
          <View
            key={column.key}
            style={[
              styles.tableHeaderCell,
              { flex: typeof column.width === "number" ? column.width : 1 },
              column.align && {
                alignItems:
                  column.align === "left"
                    ? "flex-start"
                    : column.align === "center"
                      ? "center"
                      : "flex-end",
              },
            ]}
          >
            <ThemeText
              style={styles.headerText}
              variant="h7"
              fontWeight={600}
              color={colors.text.secondary}
            >
              {column.label}
            </ThemeText>
          </View>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={externalListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent ?? listEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={combinedContentContainerStyle}
        {...restListProps}
      />
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  transactionTable: {
    marginTop: 8,
    borderWidth: 1,
    padding: 0,
    marginBottom: 30,
  },
  tableTitle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopEndRadius: 8,
    borderTopStartRadius: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopEndRadius: 8,
    borderTopStartRadius: 8,
    marginBottom: 8,
    gap: 16,
    borderBottomWidth: 1,
    alignItems: "center",
    zIndex: 1,
  },
  tableHeaderCell: {
    // Flex property will be set dynamically
  },
  headerText: {
    lineHeight: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
