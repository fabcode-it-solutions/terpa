import { ThemeText } from "@/components/primitives";
import { useColors, useTheme } from "@/theme";
import { StyleSheet, View, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

// Sales Transaction Item Component
interface TransactionItemProps {
  id?: string | number;
  productName: string;
  productImage?: string;
  dexNumber: string;
  mdbNumber: string;
  price: number;
  paymentMethod: string;
  date: string;
  time: string;
  status?: string;
  isLast?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  productName,
  productImage,
  dexNumber,
  mdbNumber,
  price,
  paymentMethod,
  date,
  time,
  isLast = false,
}) => {
  const colors = useColors();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.transactionItem,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Product Image and Content Container */}
      <View style={styles.mainContainer}>
        {/* Product Image */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.gray[200],
              borderRadius: theme.spacing.xs,
            },
          ]}
        >
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Feather name="package" size={20} color={colors.text.secondary} />
          )}
        </View>

        {/* Content Column */}
        <View style={styles.contentColumn}>
          {/* Row 1: DEX and MDB codes */}
          <View style={styles.row1}>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              Dex #{dexNumber}
            </ThemeText>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              •
            </ThemeText>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              MDB #{mdbNumber}
            </ThemeText>
          </View>

          {/* Row 2: Product name and price */}
          <View style={styles.row2}>
            <ThemeText
              color={colors.text.primary}
              variant="subtitle4"
              fontWeight={600}
              style={styles.productName}
            >
              {productName}
            </ThemeText>
            <View style={styles.priceContainer}>
              <ThemeText color={colors.text.primary} variant="subtitle4" fontWeight={600}>
                ${price.toFixed(2)}
              </ThemeText>
              <ThemeText color={colors.success.main} style={styles.checkmark}>
                ✓
              </ThemeText>
            </View>
          </View>

          {/* Row 3: Payment method and date/time */}
          <View style={styles.row3}>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              {paymentMethod}
            </ThemeText>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              •
            </ThemeText>
            <ThemeText variant="caption2" color={colors.text.secondary}>
              {date} {time}
            </ThemeText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Transaction item (no borders, just padding and layout)
  transactionItem: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  // Main container with image and content
  mainContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  // Product image container
  imageContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImage: {
    width: 40,
    height: 40,
  },
  // Content column (everything except image)
  contentColumn: {
    flex: 1,
    gap: 4,
  },
  // Row 1: DEX and MDB codes
  row1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Row 2: Product name and price
  row2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  productName: {
    flex: 1,
    flexShrink: 1,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkmark: {
    fontSize: 14,
  },
  // Row 3: Payment method and date/time
  row3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
