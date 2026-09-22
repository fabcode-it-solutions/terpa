import { useColors } from "@/theme";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { getInventoryColor, INVENTORY_THRESHOLDS } from "@/constants/inventory";

interface ProgressBarProps {
  percent: number;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, height = 6, style }) => {
  const colors = useColors();

  const clampedPercent = Math.max(0, Math.min(100, percent));
  // Color thresholds defined in @/constants/inventory
  const progressColor = getInventoryColor(clampedPercent, colors);

  // Get tinted background color matching progress bar color with 20% opacity
  // This works well in both light and dark modes
  let backgroundColor: string;
  let shadowColor: string;
  if (clampedPercent < INVENTORY_THRESHOLDS.LOW) {
    backgroundColor = `${colors.red[500]}33`; // Red with 20% opacity
    shadowColor = colors.red[500]; // Red shadow
  } else if (clampedPercent < INVENTORY_THRESHOLDS.MEDIUM) {
    backgroundColor = `${colors.orange[500]}33`; // Orange with 20% opacity
    shadowColor = colors.orange[500]; // Orange shadow
  } else {
    backgroundColor = `${colors.emerald[500]}33`; // Green with 20% opacity
    shadowColor = colors.emerald[500]; // Green shadow
  }

  return (
    <View
      style={[
        styles.progressBar,
        {
          backgroundColor,
          height,
          // Inset shadow for embossed effect (like web's shadow-inner)
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            backgroundColor: progressColor,
            width: `${clampedPercent}%`,
            height,
            // Subtle outer glow matching the progress color
            shadowColor: shadowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    width: "100%",
    borderRadius: 999, // Fully rounded like web's rounded-full
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999, // Fully rounded
  },
});
