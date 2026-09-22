import { useColors } from "@/theme";
import { ThemeText, ThemeView } from "../../primitives";
import { StyleSheet, View } from "react-native";

interface SalesData {
  label: string;
  value?: number;
  formatted?: string;
  count?: number;
}

interface SalesCardProps {
  title?: string;
  totalSales: SalesData;
  cashSales: SalesData;
  effectiveSales: SalesData;
  freeSales?: SalesData;
  remoteSales?: SalesData;
}

export const SalesCard = ({
  title,
  totalSales,
  cashSales,
  effectiveSales,
  freeSales,
  remoteSales,
}: SalesCardProps) => {
  const colors = useColors();

  // Only show payment methods with sales (count > 0)
  const hasFreeSales = freeSales?.count && freeSales.count > 0;
  const hasRemoteSales = remoteSales?.count && remoteSales.count > 0;

  return (
    <ThemeView
      style={[styles.card, { borderColor: colors.border }]}
      backgroundColor={colors.background.paper}
      rounded="md"
    >
      {/* Optional Title - when provided (e.g., Dashboard: "Ventas últimos 30 días") */}
      {title && (
        <View style={styles.titleSection}>
          <ThemeText variant="body2" fontWeight={600} color={colors.text.primary}>
            {title}
          </ThemeText>
        </View>
      )}

      {/* Total Sales - Larger, prominent */}
      <View style={[styles.totalSection, title && styles.totalSectionWithTitle]}>
        <ThemeText variant="body2" color={colors.text.secondary}>
          {totalSales.label}
        </ThemeText>
        <ThemeText variant="h4" fontWeight={700} color={colors.text.primary}>
          {totalSales.formatted ?? "-"}
        </ThemeText>
      </View>

      {/* Breakdown - Flexible row layout supporting 2-4 payment methods */}
      <View style={styles.breakdownSection}>
        {/* Card Sales */}
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLabel}>
            <View style={[styles.dot, { backgroundColor: colors.info.main }]} />
            <ThemeText variant="caption1" color={colors.text.secondary}>
              Tarjeta
            </ThemeText>
          </View>
          <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
            {cashSales.formatted ?? "-"}
          </ThemeText>
        </View>

        {/* Cash Sales */}
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLabel}>
            <View style={[styles.dot, { backgroundColor: colors.success.main }]} />
            <ThemeText variant="caption1" color={colors.text.secondary}>
              Efectivo
            </ThemeText>
          </View>
          <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
            {effectiveSales.formatted ?? "-"}
          </ThemeText>
        </View>

        {/* Free Sales - Conditionally rendered */}
        {hasFreeSales && (
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.dot, { backgroundColor: colors.gray[500] }]} />
              <ThemeText variant="caption1" color={colors.text.secondary}>
                Gratis
              </ThemeText>
            </View>
            <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
              {freeSales?.formatted ?? "-"}
            </ThemeText>
          </View>
        )}

        {/* Remote Sales - Conditionally rendered */}
        {hasRemoteSales && (
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.dot, { backgroundColor: colors.purple[500] }]} />
              <ThemeText variant="caption1" color={colors.text.secondary}>
                Remoto
              </ThemeText>
            </View>
            <ThemeText variant="subtitle4" fontWeight={600} color={colors.text.primary}>
              {remoteSales?.formatted ?? "-"}
            </ThemeText>
          </View>
        )}
      </View>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  // Optional title section - small gray text at top
  titleSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  // Total sales section - left-aligned, prominent
  totalSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 4,
  },
  // Reduced top padding when title is present
  totalSectionWithTitle: {
    paddingTop: 8,
  },
  // Breakdown section - horizontal row with wrapping for 3-4 items
  breakdownSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  // Individual breakdown item - minimum width ensures proper wrapping
  breakdownItem: {
    flex: 1,
    minWidth: "40%", // Allows 2 per row, wrapping to next row for 3-4 items
    gap: 4,
  },
  // Label with dot indicator
  breakdownLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Color indicator dot
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
