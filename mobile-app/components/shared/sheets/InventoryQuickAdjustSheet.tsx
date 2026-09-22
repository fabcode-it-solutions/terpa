import { ThemeText, ThemeTouchable } from "@/components/primitives";
import { ProgressBar } from "@/components/shared/progress/ProgressBar";
import { getInventoryColor } from "@/constants/inventory";
import { useColors } from "@/theme";
import { Image, StyleSheet, View } from "react-native";
import { Box, Minus, Plus, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { InventoryRow } from "@/features/machine/hooks/useMachineInventoryVM";
import { useMachineInventoryVM } from "@/features/machine/hooks/useMachineInventoryVM";
import { useIncrementSpiral, useDecrementSpiral } from "@/hooks/mutations/useInventoryMutations";
import { useMachineInventory } from "@/hooks/queries/vending";

interface InventoryQuickAdjustSheetProps {
  item: InventoryRow;
  teamId: string;
  machineId: string;
  onEditDetails: () => void;
  onClose: () => void;
}

export const InventoryQuickAdjustSheet: React.FC<InventoryQuickAdjustSheetProps> = ({
  item,
  teamId,
  machineId,
  onEditDetails,
  onClose,
}) => {
  const colors = useColors();

  // Subscribe to live inventory data
  const { data } = useMachineInventory(teamId, machineId);
  const { inventoryData } = useMachineInventoryVM({ data });

  // Find the current item from live query data, fallback to prop
  const currentItem = inventoryData.find((i) => i.id === item.id) ?? item;

  const incrementMutation = useIncrementSpiral(teamId, machineId, currentItem.id);
  const decrementMutation = useDecrementSpiral(teamId, machineId, currentItem.id);

  const isLoading = incrementMutation.isPending || decrementMutation.isPending;

  const handleIncrement = () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementMutation.mutate();
  };

  const handleDecrement = () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    decrementMutation.mutate();
  };

  const progressColor = getInventoryColor(currentItem.percent, colors);

  // Check if we should show machine codes
  const isMicromarket = currentItem.machineType === "MICROMARKET";
  const hasDexCode = currentItem.dexNumber && currentItem.dexNumber !== "-";
  const hasMdbCode = currentItem.mdbNumber && currentItem.mdbNumber !== "-";
  const hasMicromarketCode = currentItem.micromarketCode && currentItem.micromarketCode !== "";
  const shouldShowCodes = isMicromarket ? hasMicromarketCode : hasDexCode || hasMdbCode;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.paper }]}>
      {/* Header with Image, Title, Close */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.productImage, { backgroundColor: colors.background.elevated }]}>
            {currentItem.imageUrl ? (
              <Image
                source={{ uri: currentItem.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <Box size={24} color={colors.text.secondary} />
            )}
          </View>
          <ThemeText variant="subtitle2" fontWeight={600} numberOfLines={1} style={styles.title}>
            {currentItem.title}
          </ThemeText>
        </View>
        <ThemeTouchable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          style={styles.closeButton}
        >
          <X size={24} color={colors.text.secondary} />
        </ThemeTouchable>
      </View>

      {/* Machine Codes Row (conditional) */}
      {shouldShowCodes && (
        <View style={styles.codesRow}>
          {isMicromarket ? (
            hasMicromarketCode && (
              <ThemeText variant="caption1" color={colors.text.secondary}>
                Código: {currentItem.micromarketCode}
              </ThemeText>
            )
          ) : (
            <>
              {hasDexCode && (
                <ThemeText variant="caption1" color={colors.text.secondary}>
                  DEX #{currentItem.dexNumber}
                </ThemeText>
              )}
              {hasDexCode && hasMdbCode && (
                <ThemeText variant="caption1" color={colors.text.secondary}>
                  •
                </ThemeText>
              )}
              {hasMdbCode && (
                <ThemeText variant="caption1" color={colors.text.secondary}>
                  MDB #{currentItem.mdbNumber}
                </ThemeText>
              )}
            </>
          )}
        </View>
      )}

      {/* Price, Percentage, Progress Row */}
      <View style={styles.statsRow}>
        {/* Price */}
        <ThemeText variant="body1" fontWeight={600} style={styles.price}>
          {currentItem.price}
        </ThemeText>

        {/* Percentage Badge */}
        <View
          style={[
            styles.percentageBadge,
            {
              backgroundColor:
                currentItem.percent < 30
                  ? `${colors.red[500]}33` // 20% opacity in hex (inverse of 80% background opacity)
                  : currentItem.percent < 60
                    ? `${colors.orange[500]}33`
                    : `${colors.emerald[500]}33`,
            },
          ]}
        >
          <ThemeText variant="body2" fontWeight={600} color={progressColor}>
            {Math.round(currentItem.percent)}%
          </ThemeText>
        </View>

        {/* Mini Progress Bar */}
        <View style={styles.miniProgressBar}>
          <ProgressBar percent={currentItem.percent} height={4} />
        </View>
      </View>

      {/* Counter Controls Row (Large) */}
      <View style={styles.counterRow}>
        {/* Minus Button */}
        <ThemeTouchable
          onPress={handleDecrement}
          disabled={currentItem.currentCount === 0 || isLoading}
          style={[
            styles.largeActionButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.background.paper,
            },
            (currentItem.currentCount === 0 || isLoading) && { opacity: 0.4 },
          ]}
        >
          <Minus size={28} color={colors.text.primary} strokeWidth={2.5} />
        </ThemeTouchable>

        {/* Count Display */}
        <ThemeText variant="h6" fontWeight={600} style={styles.largeCountText}>
          {currentItem.currentCount} / {currentItem.maxCapacity}
        </ThemeText>

        {/* Plus Button */}
        <ThemeTouchable
          onPress={handleIncrement}
          disabled={currentItem.currentCount >= currentItem.maxCapacity || isLoading}
          style={[
            styles.largeActionButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.background.paper,
            },
            (currentItem.currentCount >= currentItem.maxCapacity || isLoading) && { opacity: 0.4 },
          ]}
        >
          <Plus size={28} color={colors.text.primary} strokeWidth={2.5} />
        </ThemeTouchable>
      </View>

      {/* Edit Details Button */}
      <ThemeTouchable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEditDetails();
        }}
        style={[styles.editButton, { backgroundColor: colors.background.elevated }]}
      >
        <ThemeText variant="body2" fontWeight={600} color={colors.text.dark}>
          Editar Espiral
        </ThemeText>
      </ThemeTouchable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  codesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  price: {
    minWidth: 70,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  miniProgressBar: {
    flex: 1,
    minWidth: 60,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 12,
  },
  largeActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  largeCountText: {
    minWidth: 100,
    textAlign: "center",
  },
  editButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
  },
});
