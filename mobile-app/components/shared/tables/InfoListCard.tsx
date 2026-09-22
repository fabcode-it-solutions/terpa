import React, { useCallback, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  type FlatListProps,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/theme";
import { ThemeText, ThemeView } from "@/components/primitives";
import { useTranslation } from "react-i18next";
import { Box } from "lucide-react-native";

type MachineItemData = { id?: string; code: string; price?: string; status: string };
type ProductItemData = {
  image?: string | ImageSourcePropType;
  name: string;
  code?: string;
  sales?: string;
  price?: string;
};
type SalesItemData = {
  device: string;
  product: string;
  price?: string;
  time: string;
  image?: string;
};

type InfoListType = "machine" | "product" | "sales";

type ItemByType = {
  machine: MachineItemData;
  product: ProductItemData;
  sales: SalesItemData;
};

interface InfoListCardProps<T extends InfoListType> {
  title: string;
  subtitle?: string;
  data: ItemByType[T][];
  type: T;
  viewMoreText?: string;
  onViewMore?: () => void;
  onItemPress?: (item: ItemByType[T]) => void;
  listProps?: Partial<FlatListProps<ItemByType[T]>>;
}

const InfoListCard = <T extends InfoListType>({
  title,
  subtitle,
  data,
  type,
  viewMoreText,
  onViewMore,
  onItemPress,
  listProps,
}: InfoListCardProps<T>) => {
  const colors = useColors();
  const { t } = useTranslation();

  const renderListItem = useCallback(
    ({ item, index }: { item: ItemByType[T]; index: number }) => {
      const commonProps = { onPress: () => onItemPress?.(item) };
      let element: React.ReactNode = null;
      if (type === "machine") {
        element = <MachineItem {...(item as ItemByType["machine"])} {...commonProps} />;
      } else if (type === "product") {
        element = <ProductItem {...(item as ItemByType["product"])} {...commonProps} />;
      } else if (type === "sales") {
        element = <SalesItem {...(item as ItemByType["sales"])} {...commonProps} />;
      }
      if (!element) return null;

      return (
        <View
          style={{
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: colors.border,
          }}
        >
          {element}
        </View>
      );
    },
    [colors.border, onItemPress, type],
  );

  const keyExtractor = useCallback(
    (item: ItemByType[T], index: number) => {
      if (type === "machine") {
        const machine = item as ItemByType["machine"];
        return `machine-${machine.code ?? "code"}-${index}`;
      }
      if (type === "product") {
        const product = item as ItemByType["product"];
        return `product-${product.name ?? "product"}-${index}`;
      }
      if (type === "sales") {
        const sale = item as ItemByType["sales"];
        return `sales-${sale.device ?? "device"}-${sale.time ?? "time"}-${index}`;
      }
      return `item-${index}`;
    },
    [type],
  );

  const { contentContainerStyle, ...restListProps } = listProps ?? {};

  const combinedContentStyle = useMemo(() => {
    if (!contentContainerStyle) {
      return styles.listContent;
    }
    if (Array.isArray(contentContainerStyle)) {
      return [styles.listContent, ...contentContainerStyle];
    }
    return [styles.listContent, contentContainerStyle];
  }, [contentContainerStyle]);

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <ThemeText variant="body2" color={colors.text.secondary}>
          {t("common.noData", { defaultValue: "No data" })}
        </ThemeText>
      </View>
    ),
    [colors.text.secondary, t],
  );

  return (
    <ThemeView
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.background.paper },
      ]}
      rounded="md"
    >
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <ThemeText variant="h6">{title}</ThemeText>
        {subtitle && (
          <ThemeText
            style={{
              paddingTop: 8,
            }}
            variant="caption"
            color={colors.text.secondary}
          >
            {subtitle}
          </ThemeText>
        )}
      </View>

      <FlatList<ItemByType[T]>
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderListItem}
        scrollEnabled={false}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={combinedContentStyle}
        {...restListProps}
      />

      {viewMoreText && (
        <TouchableOpacity
          style={[styles.viewMoreButton, { borderTopColor: colors.border }]}
          onPress={onViewMore}
        >
          <ThemeText variant="body2Bold">{viewMoreText}</ThemeText>
        </TouchableOpacity>
      )}
    </ThemeView>
  );
};

const MachineItem: React.FC<{
  code: string;
  price?: string;
  status: string;
  onPress?: () => void;
}> = ({ code, price, status, onPress }) => {
  const colors = useColors();
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "online":
        return colors.status.online;
      case "offline":
        return colors.status.offline;
      case "warning":
      case "intermittent":
        return colors.status.warning;
      default:
        return colors.gray[400];
    }
  };

  return (
    <TouchableOpacity style={styles.machineItem} onPress={onPress}>
      <View style={styles.machineLeft}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
        <View>
          <ThemeText variant="subtitle3">{code}</ThemeText>
          <ThemeText variant="caption1" color={colors.text.secondary}>
            {price ?? "-"}
          </ThemeText>
        </View>
      </View>
      <Ionicons
        style={[styles.icon, { borderColor: colors.border }]}
        name="chevron-forward"
        size={16}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
  );
};

const ProductItem: React.FC<{
  image?: string | ImageSourcePropType;
  name: string;
  code?: string;
  sales?: string;
  price?: string;
  onPress?: () => void;
}> = ({ image, name, code: _code, sales, price, onPress }) => {
  const colors = useColors();

  const remoteImage =
    typeof image === "string" && image.startsWith("http") ? { uri: image } : undefined;
  const staticImage =
    typeof image === "number" || (image && typeof image === "object") ? image : undefined;
  const imageSource: ImageSourcePropType | undefined = remoteImage ?? staticImage;

  return (
    <TouchableOpacity
      style={[styles.productItem, { borderTopColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.productLeft}>
        <View style={[styles.productImage, { backgroundColor: colors.gray[200] }]}>
          {typeof image === "string" && !image.startsWith("http") ? (
            <Box size={16} color={colors.text.secondary} />
          ) : imageSource ? (
            <Image source={imageSource} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Box size={16} color={colors.text.secondary} />
          )}
        </View>
        <View style={styles.productInfo}>
          <ThemeText variant="subtitle3" numberOfLines={1}>
            {name}
          </ThemeText>
          <ThemeText variant="caption" color={colors.text.secondary}>
            {sales} · {price ?? "-"}
          </ThemeText>
        </View>
      </View>
      <Ionicons
        style={[styles.icon, { borderColor: colors.border }]}
        name="chevron-forward"
        size={16}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
  );
};

const SalesItem: React.FC<{
  device: string;
  product: string;
  price?: string;
  time: string;
  image?: string;
  onPress?: () => void;
}> = ({ device: _device, product, price, time, image, onPress }) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.salesItem, { borderTopColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.salesContent}>
        <View style={[styles.productImage, { backgroundColor: colors.gray[200] }]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Box size={16} color={colors.text.secondary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.salesHeader}>
            <ThemeText variant="caption" color={colors.text.secondary}>
              {price ?? "-"} · {time}
            </ThemeText>
          </View>
          <ThemeText variant="subtitle3" style={styles.salesProduct}>
            {product}
          </ThemeText>
        </View>
      </View>
      <Ionicons
        style={[styles.icon, { borderColor: colors.border }]}
        name="chevron-forward"
        size={16}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 0,
    padding: 16,
    borderBottomWidth: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  listContent: {
    flexGrow: 1,
  },
  machineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  machineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  productLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productInfo: {
    flex: 1,
  },
  salesItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  salesContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  salesHeader: {
    marginBottom: 4,
  },
  salesProduct: {
    fontWeight: "600",
  },
  viewMoreButton: {
    borderTopWidth: 1,
    alignItems: "center",
    paddingVertical: 18,
    marginTop: 8,
  },
  icon: {
    padding: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
});

export default InfoListCard;
