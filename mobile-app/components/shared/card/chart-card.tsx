import type { ReactNode } from "react";
import { useColors } from "@/theme";
import { useTranslation } from "react-i18next";
import { ThemeText, ThemeView } from "../../primitives";
import { StackedBarChart } from "react-native-chart-kit";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SeriesPoint = { date?: string; card?: number; cash?: number; free?: number; remote?: number };

type ChartCardProps = {
  showHeader?: boolean;
  title?: ReactNode;
  caption?: ReactNode;
  series?: SeriesPoint[];
};

export const ChartCard = ({ showHeader = false, title, caption, series = [] }: ChartCardProps) => {
  const colors = useColors();
  const { t } = useTranslation();

  // Map incoming series to the expected chart-kit stacked data format
  const { mapped, hasAnyPositive, hasSeries, hasFreeSales, hasRemoteSales } = (() => {
    const points = Array.isArray(series) ? series : [];
    const toNumber = (value?: number) =>
      typeof value === "number" && Number.isFinite(value) ? value : 0;
    const normalized = points.map((p) => ({
      card: toNumber(p?.card),
      cash: toNumber(p?.cash),
      free: toNumber(p?.free),
      remote: toNumber(p?.remote),
    }));

    // Check if we have any free or remote sales across all points
    const hasFreeSales = normalized.some((p) => p.free > 0);
    const hasRemoteSales = normalized.some((p) => p.remote > 0);

    const hasAnyPositive = normalized.some(
      (p) => p.card > 0 || p.cash > 0 || p.free > 0 || p.remote > 0,
    );
    const hasSeries = points.length > 0;

    // Only build chart data if there's anything > 0 to render.
    // This avoids iOS CGPathAddRoundedRect NaN crashes when all values are zero.
    const pointsForChart = hasAnyPositive ? normalized : []; // empty forces us to render a placeholder instead of the chart

    // Build legend and data arrays dynamically based on which payment methods have data
    const legend: string[] = [];
    const barColors: string[] = [];

    // Always show card and cash
    legend.push(t("dashboard.chart.legend.card"));
    barColors.push(colors.blue[500]);

    legend.push(t("dashboard.chart.legend.cash"));
    barColors.push(colors.emerald[500]);

    if (hasFreeSales) {
      legend.push(t("dashboard.chart.legend.free"));
      barColors.push(colors.gray[500]);
    }

    if (hasRemoteSales) {
      legend.push(t("dashboard.chart.legend.remote"));
      barColors.push(colors.purple[500]);
    }

    const mapped = {
      labels: pointsForChart.map(() => ""),
      legend,
      data: pointsForChart.map((p) => {
        const dataArray = [p.card || 0, p.cash || 0];
        if (hasFreeSales) dataArray.push(p.free || 0);
        if (hasRemoteSales) dataArray.push(p.remote || 0);
        return dataArray;
      }),
      barColors,
    };

    return { mapped, hasAnyPositive, hasSeries, hasFreeSales, hasRemoteSales };
  })();

  return (
    <ThemeView
      style={[
        styles.card,
        { backgroundColor: colors.background.paper, borderColor: colors.border },
      ]}
      rounded="md"
      padded="md"
    >
      {showHeader && (
        <View style={styles.chartHeader}>
          <ThemeText variant="h6" color={colors.text.primary} style={styles.chartTitle}>
            {title}
          </ThemeText>
          <ThemeText variant="caption" color={colors.text.secondary}>
            {caption}
          </ThemeText>
        </View>
      )}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.blue[500] }]} />
          <ThemeText variant="subtitle4">{t("dashboard.chart.legend.card")}</ThemeText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.emerald[500] }]} />
          <ThemeText variant="subtitle4">{t("dashboard.chart.legend.cash")}</ThemeText>
        </View>
        {hasFreeSales && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.gray[500] }]} />
            <ThemeText variant="subtitle4">{t("dashboard.chart.legend.free")}</ThemeText>
          </View>
        )}
        {hasRemoteSales && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.purple[500] }]} />
            <ThemeText variant="subtitle4">{t("dashboard.chart.legend.remote")}</ThemeText>
          </View>
        )}
      </View>

      {hasAnyPositive ? (
        <StackedBarChart
          data={mapped}
          width={SCREEN_WIDTH}
          height={200}
          chartConfig={{
            backgroundColor: colors.background.paper,
            backgroundGradientFrom: colors.background.paper,
            backgroundGradientTo: colors.background.paper,
            decimalPlaces: 0,
            color: () => colors.text.primary,
            labelColor: () => colors.text.secondary,
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeWidth: 0,
            },
            barPercentage: 0.3,
          }}
          style={{
            marginVertical: 8,
            marginLeft: -70,
            borderRadius: 16,
            marginBottom: -51,
          }}
          fromZero
          withHorizontalLabels={false}
          withInnerLines={false}
          hideLegend={true}
          withVerticalLabels={false}
        />
      ) : (
        <View style={styles.emptyChart}>
          <ThemeText variant="caption" color={colors.text.secondary}>
            {hasSeries ? "No sales" : "No data available"}
          </ThemeText>
        </View>
      )}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    // borderColor via ThemeView wrapping style
  },
  emptyChart: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 4,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 30,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartContainer: {
    marginVertical: 8,
  },
});
