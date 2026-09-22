import { useColors } from "@/theme";
import { ThemeText, ThemeView } from "../../primitives";
import { StyleSheet, View } from "react-native";

interface TerminalData {
  label: string;
  value?: number;
  formatted?: string;
  count?: number;
}

interface TerminalCardProps {
  title?: string;
  totalApproved: TerminalData;
  approvedByCard?: TerminalData;
  approvedByCash?: TerminalData;
}

export const TerminalCard = ({
  title,
  totalApproved,
  approvedByCard,
  approvedByCash,
}: TerminalCardProps) => {
  const colors = useColors();

  // Show breakdown only if we have data for both card and cash
  const showBreakdown = approvedByCard?.value !== undefined && approvedByCash?.value !== undefined;

  return (
    <ThemeView
      style={[styles.card, { borderColor: colors.border }]}
      backgroundColor={colors.background.paper}
      rounded="md"
    >
      {/* Optional Title */}
      {title && (
        <View style={styles.titleSection}>
          <ThemeText variant="body2" fontWeight={600} color={colors.text.primary}>
            {title}
          </ThemeText>
        </View>
      )}

      {/* Total Approved - Larger, prominent */}
      <View style={[styles.totalSection, title && styles.totalSectionWithTitle]}>
        <ThemeText variant="body2" color={colors.text.secondary}>
          {totalApproved.label}
        </ThemeText>
        <ThemeText variant="h4" fontWeight={700} color={colors.text.primary}>
          {totalApproved.formatted ?? "-"}
        </ThemeText>
      </View>

      {/* Breakdown - Card vs Cash (optional) */}
      {showBreakdown && (
        <View style={styles.breakdownSection}>
          {/* Card Transactions */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.dot, { backgroundColor: colors.info.main }]} />
              <ThemeText variant="caption1" color={colors.text.secondary}>
                Tarjeta
              </ThemeText>
            </View>
            <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
              {approvedByCard?.formatted ?? "-"}
            </ThemeText>
          </View>

          {/* Cash Transactions */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.dot, { backgroundColor: colors.success.main }]} />
              <ThemeText variant="caption1" color={colors.text.secondary}>
                Efectivo
              </ThemeText>
            </View>
            <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
              {approvedByCash?.formatted ?? "-"}
            </ThemeText>
          </View>
        </View>
      )}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  titleSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  totalSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 4,
  },
  totalSectionWithTitle: {
    paddingTop: 8,
  },
  breakdownSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  breakdownItem: {
    flex: 1,
    minWidth: "40%",
    gap: 4,
  },
  breakdownLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
