import { ThemeText } from "@/components/primitives";
import { ProgressBar } from "@/components/shared/progress/ProgressBar";
import { getInventoryColor } from "@/constants/inventory";
import { useColors } from "@/theme";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Box } from "lucide-react-native";

interface InventoryItemProps {
  imageUrl?: string;
  title: string;
  sku?: string;
  dexNumber: string;
  mdbNumber: string;
  micromarketCode?: string;
  price: string; // Formatted price like "$12.50"
  currentCount: number;
  maxCapacity: number;
  percent: number;
  machineType: "VENDING" | "MICROMARKET";
  onPress?: () => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  imageUrl,
  title,
  dexNumber,
  mdbNumber,
  micromarketCode,
  price,
  currentCount,
  maxCapacity,
  percent,
  machineType,
  onPress,
}) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.inventoryItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.contentRow}>
        {/* Product Image */}
        <View style={[styles.productImage, { backgroundColor: colors.gray[100] }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Box size={20} color={colors.text.secondary} />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productDetails}>
          {/* Line 1: Product Name */}
          <ThemeText variant="subtitle4" fontWeight={600} numberOfLines={1}>
            {title}
          </ThemeText>

          {/* Line 2: DEX, MDB, Cost */}
          <View style={styles.metadataRow}>
            {machineType === "MICROMARKET" && micromarketCode ? (
              <ThemeText variant="caption2" color={colors.text.secondary}>
                MICROMARKET #{micromarketCode}
              </ThemeText>
            ) : (
              <>
                {dexNumber && dexNumber !== "-" && (
                  <ThemeText variant="caption2" color={colors.text.secondary}>
                    DEX #{dexNumber}
                  </ThemeText>
                )}
                {mdbNumber && mdbNumber !== "-" && (
                  <ThemeText variant="caption2" color={colors.text.secondary}>
                    MDB #{mdbNumber}
                  </ThemeText>
                )}
              </>
            )}
            <ThemeText variant="caption2" color={colors.text.secondary}>
              {price || "$0.00"}
            </ThemeText>
          </View>

          {/* Line 3: Current/Total with Progress Bar and Percentage */}
          <View style={styles.progressRow}>
            <View style={styles.countContainer}>
              <ThemeText variant="caption2" color={colors.text.secondary}>
                {currentCount} / {maxCapacity}
              </ThemeText>
            </View>
            <View style={styles.progressContainer}>
              <ProgressBar percent={percent} height={6} />
            </View>
            <ThemeText
              variant="caption2"
              color={getInventoryColor(percent, colors)}
              fontWeight={500}
            >
              {Math.round(percent)}%
            </ThemeText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inventoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productDetails: {
    flex: 1,
    gap: 4,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countContainer: {
    width: 50,
  },
  progressContainer: {
    flex: 1,
  },
});
