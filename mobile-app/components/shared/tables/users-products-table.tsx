import React, { useMemo, memo, useCallback } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  type StyleProp,
  FlatList,
  type FlatListProps,
} from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { useColors, useTheme } from "@/theme";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { truncateWords } from "@/utils/formatter";

type ThemeColors = ReturnType<typeof useColors>;
type ThemeShape = ReturnType<typeof useTheme>;
type TranslateFn = ReturnType<typeof useTranslation>["t"];

// ============ TYPE DEFINITIONS ============
export type DataType = "products" | "users";

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  type: "product";
}

export interface UserData {
  id: string;
  email: string;
  role: string;
  roleColor?: string;
  type: "user";
}

export type TableData = ProductData | UserData;

export interface ColumnConfig {
  key: string;
  label: string;
  width?: number | string;
  align?: "left" | "center" | "right";
}

export interface CommonTableProps {
  data: TableData[];
  dataType: DataType;
  title?: string;
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
  onItemPress?: (item: TableData) => void;
  listProps?: Partial<FlatListProps<TableData>>;
}

// ============ MEMOIZED SUB-COMPONENTS ============

interface ProductImageProps {
  image?: string;
  colors: ThemeColors;
  theme: ThemeShape;
}

const ProductImage = memo<ProductImageProps>(({ image, colors, theme }) => {
  const imageContainerStyle = useMemo(
    () => ({
      width: 40,
      height: 40,
      borderRadius: theme.spacing.xs,
      backgroundColor: colors.gray[200],
      marginRight: theme.spacing.sm,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      overflow: "hidden" as const,
    }),
    [colors.gray, theme.spacing],
  );

  return (
    <View style={imageContainerStyle}>
      {image ? (
        <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <Feather name="package" size={20} color={colors.text.secondary} />
      )}
    </View>
  );
});

ProductImage.displayName = "ProductImage";

interface ProductRowProps {
  item: ProductData;
  colors: ThemeColors;
  theme: ThemeShape;
  t: TranslateFn;
}

const ProductRow = memo<ProductRowProps>(({ item, colors, theme, t }) => {
  return (
    <ThemeView style={styles.rowContainer}>
      <View style={styles.productInfoContainer}>
        <ProductImage image={item.image} colors={colors} theme={theme} />
        <View>
          <ThemeText
            variant="body2"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.productName}
          >
            {truncateWords(item.name, 3)}
          </ThemeText>
          <ThemeText variant="caption1" color={colors.text.secondary}>
            {t("products.table.sku", { defaultValue: "SKU" })} {item.sku}
          </ThemeText>
        </View>
      </View>
      <View>
        <ThemeText variant="body2" style={styles.productPrice}>
          ${item.price.toFixed(2)}
        </ThemeText>
      </View>
    </ThemeView>
  );
});

ProductRow.displayName = "ProductRow";

interface UserRowProps {
  item: UserData;
  colors: ThemeColors;
  theme: ThemeShape;
}

const UserRow = memo<UserRowProps>(({ item, colors, theme }) => {
  const roleBadgeStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderColor: item.roleColor ?? colors.primary.main,
      borderRadius: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      marginRight: theme.spacing.md,
      justifyContent: "flex-start" as const,
      alignItems: "flex-start" as const,
      alignSelf: "flex-start" as const,
    }),
    [item.roleColor, colors.primary.main, theme.spacing],
  );

  return (
    <ThemeView style={styles.rowContainer}>
      <View style={styles.userInfoContainer}>
        <View style={styles.emailContainer}>
          <ThemeText variant="body1">{item.email}</ThemeText>
        </View>
        <View style={styles.roleContainer}>
          <View style={roleBadgeStyle}>
            <ThemeText
              variant="caption"
              color={item.roleColor ?? colors.primary.main}
              fontWeight={500}
            >
              {item.role}
            </ThemeText>
          </View>
        </View>
      </View>
    </ThemeView>
  );
});

UserRow.displayName = "UserRow";

interface TableHeaderProps {
  columns: ColumnConfig[];
  colors: ThemeColors;
  actionColumnWidth?: number;
}

const TableHeader = memo<TableHeaderProps>(({ columns, colors, actionColumnWidth }) => {
  return (
    <View
      style={[
        styles.tableHeader,
        { borderColor: colors.border, backgroundColor: colors.background.paper },
      ]}
    >
      {columns.map((column) => {
        const alignStyle =
          column.align === "right"
            ? styles.alignRight
            : column.align === "center"
              ? styles.alignCenter
              : styles.alignLeft;

        return (
          <View
            key={column.key}
            style={[
              styles.tableHeaderCell,
              { flex: typeof column.width === "number" ? column.width : 1 },
              styles.justifyCenter,
              alignStyle,
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
        );
      })}
      {actionColumnWidth && <View style={[styles.tableHeaderCell, { width: actionColumnWidth }]} />}
    </View>
  );
});

TableHeader.displayName = "TableHeader";

interface TableRowProps {
  item: TableData;
  index: number;
  colors: ThemeColors;
  theme: ThemeShape;
  t: TranslateFn;
  onItemPress?: (item: TableData) => void;
}

const TableRow = memo<TableRowProps>(({ item, index, colors, theme, t, onItemPress }) => {
  const handlePress = useCallback(() => {
    onItemPress?.(item);
  }, [item, onItemPress]);

  const rowStyle = useMemo(
    () => ({
      backgroundColor: colors.background.paper,
      paddingVertical: 20,
      borderBottomStartRadius: 8,
      borderBottomEndRadius: 8,
      paddingHorizontal: 10,
      borderTopWidth: index === 0 ? 0 : 1,
      borderColor: colors.border,
    }),
    [index, colors.background.paper, colors.border],
  );

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <ThemeView style={rowStyle}>
        {item.type === "product" ? (
          <ProductRow item={item} colors={colors} theme={theme} t={t} />
        ) : (
          <UserRow item={item} colors={colors} theme={theme} />
        )}
      </ThemeView>
    </TouchableOpacity>
  );
});

TableRow.displayName = "TableRow";

// ============ MAIN COMPONENT ============

export const UsersProductsTable: React.FC<CommonTableProps> = memo(
  ({ data, dataType, title, emptyMessage, style, onItemPress, listProps }) => {
    const colors = useColors();
    const theme = useTheme();
    const { t } = useTranslation();

    const columns = useMemo((): ColumnConfig[] => {
      if (dataType === "products") {
        return [
          {
            key: "name",
            align: "left",
            label: t("products.table.name", { defaultValue: "Nombre" }),
            width: 3,
          },
          {
            key: "price",
            label: t("products.table.price", { defaultValue: "Precio" }),
            width: 1,
            align: "center",
          },
        ];
      }

      return [
        { key: "email", label: t("users.table.email", { defaultValue: "Correo" }), width: 1 },
        {
          key: "role",
          label: t("users.table.role", { defaultValue: "Rol" }),
          align: "center",
        },
      ];
    }, [dataType, t]);

    const displayEmptyMessage = useMemo(() => {
      return (
        emptyMessage ??
        (dataType === "products"
          ? t("products.empty", { defaultValue: "No products found" })
          : t("users.empty", { defaultValue: "No users found" }))
      );
    }, [dataType, emptyMessage, t]);

    const keyExtractor = useCallback((item: TableData) => item.id, []);

    const hasExternalHeader = listProps
      ? Object.prototype.hasOwnProperty.call(listProps, "ListHeaderComponent")
      : false;
    const hasExternalStickyHeader = listProps
      ? Object.prototype.hasOwnProperty.call(listProps, "stickyHeaderIndices")
      : false;

    const {
      contentContainerStyle,
      ListEmptyComponent,
      ListHeaderComponent: externalListHeaderComponent,
      stickyHeaderIndices: externalStickyHeaderIndices,
      ...restListProps
    } = listProps ?? {};

    const combinedContentContainerStyle = useMemo(() => {
      const baseStyle = data.length === 0 ? styles.emptyListContent : undefined;
      if (!baseStyle && !contentContainerStyle) return undefined;
      if (baseStyle && contentContainerStyle) {
        return [baseStyle, contentContainerStyle];
      }
      return baseStyle ?? contentContainerStyle;
    }, [contentContainerStyle, data.length]);

    const tableHeaderComponent = useMemo(() => {
      if (hasExternalHeader) return null;
      return <TableHeader columns={columns} colors={colors} />;
    }, [colors, columns, hasExternalHeader]);

    const listHeaderComponent =
      hasExternalHeader || !tableHeaderComponent
        ? externalListHeaderComponent
        : tableHeaderComponent;

    const stickyHeaderIndices = useMemo(() => {
      if (hasExternalStickyHeader) {
        return externalStickyHeaderIndices;
      }
      if (hasExternalHeader || !tableHeaderComponent) {
        return undefined;
      }
      return [0];
    }, [
      externalStickyHeaderIndices,
      hasExternalHeader,
      hasExternalStickyHeader,
      tableHeaderComponent,
    ]);

    const renderItem = useCallback(
      ({ item, index }: { item: TableData; index: number }) => (
        <TableRow
          item={item}
          index={index}
          colors={colors}
          theme={theme}
          t={t}
          onItemPress={onItemPress}
        />
      ),
      [colors, onItemPress, t, theme],
    );

    const fallbackEmptyComponent = useMemo(
      () => (
        <View style={styles.emptyState}>
          <ThemeText variant="body2" color={colors.text.secondary}>
            {displayEmptyMessage}
          </ThemeText>
        </View>
      ),
      [colors.text.secondary, displayEmptyMessage],
    );

    return (
      <ThemeView
        rounded="md"
        backgroundColor={theme.colors.background.elevated}
        style={[styles.tableContainer, { borderColor: colors.border }, style]}
      >
        {title && (
          <View style={[styles.tableTitle, { borderColor: colors.border }]}>
            <ThemeText variant="h6" fontWeight={600}>
              {title}
            </ThemeText>
          </View>
        )}
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeaderComponent}
          stickyHeaderIndices={stickyHeaderIndices}
          ListEmptyComponent={ListEmptyComponent ?? fallbackEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={combinedContentContainerStyle}
          {...restListProps}
        />
      </ThemeView>
    );
  },
);

UsersProductsTable.displayName = "UsersProductsTable";

// ============ STYLES ============

const styles = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  tableTitle: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    zIndex: 1,
  },
  tableHeaderCell: {
    paddingHorizontal: 8,
  },
  headerText: {
    lineHeight: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  productImage: {
    width: 40,
    height: 40,
  },
  productName: {
    marginBottom: 2,
  },
  productPrice: {
    fontWeight: "600",
    paddingRight: 24,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emailContainer: {
    flex: 1,
    marginRight: 16,
  },
  roleContainer: {
    flex: 0,
  },
  justifyCenter: {
    justifyContent: "center",
  },
  alignLeft: {
    alignItems: "flex-start",
  },
  alignCenter: {
    alignItems: "center",
  },
  alignRight: {
    alignItems: "flex-end",
  },
});
