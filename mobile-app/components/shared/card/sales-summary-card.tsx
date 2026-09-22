import { ThemeText, ThemeView } from "@/components/primitives";
import { useColors } from "@/theme";
import { StyleSheet, View } from "react-native";

// Sales Summary Card Component
interface SalesSummaryProps {
  title: string;
  totalSales: { label: string; value: number };
  cashSales: { label: string; value: number };
  effectiveSales: { label: string; value: number };
}

export const SalesSummaryCard: React.FC<SalesSummaryProps> = ({
  title,
  totalSales,
  cashSales,
  effectiveSales,
}) => {
  const colors = useColors();

  return (
    <ThemeView
      style={styles.salesCard}
      backgroundColor={colors.background.paper}
      elevation={1}
      rounded="md"
    >
      <ThemeText variant="h5" fontWeight={700} style={styles.salesCardTitle}>
        {title}
      </ThemeText>

      <View style={styles.salesMetric}>
        <ThemeText variant="caption" color={colors.text.secondary}>
          {totalSales.label}
        </ThemeText>
        <ThemeText variant="h4" fontWeight={700}>
          ${totalSales.value.toFixed(2)}
        </ThemeText>
      </View>

      <View style={styles.salesMetric}>
        <ThemeText variant="caption" color={colors.text.secondary}>
          {cashSales.label}
        </ThemeText>
        <ThemeText variant="h4" fontWeight={700}>
          ${cashSales.value.toFixed(2)}
        </ThemeText>
      </View>

      <View style={styles.salesMetric}>
        <ThemeText variant="caption" color={colors.text.secondary}>
          {effectiveSales.label}
        </ThemeText>
        <ThemeText variant="h4" fontWeight={700}>
          ${effectiveSales.value.toFixed(2)}
        </ThemeText>
      </View>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  // Sales Card Styles
  salesCard: {
    margin: 16,
    padding: 20,
  },
  salesCardTitle: {
    marginBottom: 16,
  },
  salesMetric: {
    marginBottom: 16,
  },
});
