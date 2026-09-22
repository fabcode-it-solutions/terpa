import { ThemeText } from "@/components/primitives";
import { useColors } from "@/theme";
import { StyleSheet, View } from "react-native";

interface StatusCardProps {
  label: string;
  status?: string; // Not used in component but passed by parent
  color: string;
  textColor: string;
  time?: string;
}

export const StatusCard = ({ label, color, textColor, time }: StatusCardProps) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.statusCard,
        { borderColor: colors.border, backgroundColor: colors.background.paper },
      ]}
    >
      <ThemeText variant="h6" color={colors.text.primary} style={styles.sectionTitle}>
        Comunicacion
      </ThemeText>

      <View style={styles.statusCardContent}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <View>
          <ThemeText variant="body2" color={textColor}>
            {label}
          </ThemeText>
          {time && (
            <ThemeText variant="caption1" color={colors.text.secondary} style={styles.statusTime}>
              {time}
            </ThemeText>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  statusCardContent: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  statusTime: {
    marginTop: 2,
  },
});
