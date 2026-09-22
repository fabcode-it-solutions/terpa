import { ThemeText } from "@/components/primitives";
import { ProgressBar } from "@/components/shared/progress/ProgressBar";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface InventoryCardProps {
  percentage: number;
  onPress?: () => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ percentage, onPress }) => {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.statusCard,
        { borderColor: colors.border, backgroundColor: colors.background.paper },
      ]}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <ThemeText variant="h6" color={colors.text.primary} style={styles.inventoryTitle}>
            {t("inventory.title")}
          </ThemeText>
          <Ionicons name="chevron-forward" size={22} color={colors.text.primary} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <ProgressBar percent={percentage} height={4} />
          </View>
          <ThemeText variant="subtitle4" color={colors.text.primary} style={styles.percentageText}>
            {percentage}%
          </ThemeText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inventoryTitle: {
    marginBottom: 8,
    marginTop: 4,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "column-reverse",
    width: 70,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
  },
  percentageText: {
    fontWeight: "600",
  },
});
