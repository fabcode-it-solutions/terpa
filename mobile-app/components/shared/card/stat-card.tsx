import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors } from "@/theme";
import { StyleSheet, View } from "react-native";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon?: "warning" | "check-circle" | "error" | "intermittent" | "dashboard";
}

export const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  const colors = useColors();

  // Define dot colors based on status
  const getDotColor = (icon: StatCardProps["icon"]) => {
    switch (icon) {
      case "warning":
        return colors.warning.main;
      case "check-circle":
        return colors.success.main;
      case "error":
        return colors.error.main;
      case "intermittent":
        return colors.info.main;
      case "dashboard":
        return colors.text.secondary; // Default gray for dashboard
      case undefined:
        return colors.text.secondary; // Default gray
      default:
        return colors.text.secondary; // Default gray
    }
  };

  return (
    <ThemeView
      style={[
        styles.statCard,
        { backgroundColor: colors.background.paper, borderColor: colors.border },
      ]}
      rounded="md"
      padded="md"
    >
      <ThemeText variant="subtitle2">{title}</ThemeText>
      <View style={styles.statContent}>
        {icon && <View style={[styles.statusDot, { backgroundColor: getDotColor(icon) }]} />}
        <ThemeText variant="meta" color={colors.text.secondary}>
          {value} {subtitle}
        </ThemeText>
      </View>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderWidth: 1,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
