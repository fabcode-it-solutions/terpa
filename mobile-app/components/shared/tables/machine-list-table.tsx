import { ThemeText, ThemeTouchable, ThemeView } from "@/components/primitives";
import { useColors, useTheme } from "@/theme";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { formatCurrency } from "@/utils/currency";
import { getInventoryColor } from "@/constants/inventory";

export type MachineListRow = {
  id: string;
  name: string;
  inventory: number;
  status: "online" | "offline" | "warning" | "intermittent";
  salesToday?: number;
  currentChange?: number;
};

interface MachineItemProps {
  machine: MachineListRow;
}

const MachineItem: React.FC<MachineItemProps & { isFirst?: boolean }> = ({ machine, isFirst }) => {
  const colors = useColors();
  const theme = useTheme();
  const { t } = useTranslation();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "online":
        return colors.status.online;
      case "offline":
        return colors.status.offline;
      case "intermittent":
        return colors.status.warning;
      default:
        return colors.gray[400];
    }
  };

  const handlePress = () => {
    router.push(`/machine-detailed-screen?id=${machine.id}`);
  };

  return (
    <ThemeTouchable
      style={{
        backgroundColor: colors.background.paper,
        padding: theme.spacing.md,
        paddingVertical: 18,
        borderTopWidth: isFirst ? 0 : 1,
        borderColor: colors.border,
        marginHorizontal: 0,
      }}
      onPress={handlePress}
    >
      <View style={{ flexDirection: "column", gap: theme.spacing.sm }}>
        {/* Row 1: Name with status indicator */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 6,
              backgroundColor: getStatusColor(machine.status),
              marginRight: theme.spacing.sm,
            }}
          />
          <ThemeText variant="subtitle3" style={{ flex: 1 }}>
            {machine.name}
          </ThemeText>
        </View>

        {/* Row 2: Inventory levels */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <ThemeText variant="caption" color={colors.text.secondary} style={{ minWidth: 80 }}>
            {t("inventory.title", { defaultValue: "Inventario" })}:
          </ThemeText>
          <ThemeText variant="caption" style={{ minWidth: 35 }}>
            {machine.inventory}%
          </ThemeText>
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: colors.gray[200],
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${machine.inventory}%`,
                height: "100%",
                backgroundColor: getInventoryColor(machine.inventory, colors),
              }}
            />
          </View>
        </View>

        {/* Row 3: Sales & Change */}
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemeText variant="caption" color={colors.text.secondary}>
              {t("machine.metrics.salesToday", { defaultValue: "Ventas Hoy" })}:{" "}
            </ThemeText>
            <ThemeText variant="caption">{formatCurrency(machine.salesToday ?? 0)}</ThemeText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemeText variant="caption" color={colors.text.secondary}>
              {t("machine.metrics.change", { defaultValue: "Cambio" })}:{" "}
            </ThemeText>
            <ThemeText variant="caption">{formatCurrency(machine.currentChange ?? 0)}</ThemeText>
          </View>
        </View>
      </View>
    </ThemeTouchable>
  );
};

const MachineListTable = ({ machineData }: { machineData: MachineListRow[] }) => {
  const colors = useColors();

  return (
    <ThemeView
      style={[styles.card, { borderColor: colors.border, overflow: "hidden" }]}
      rounded="md"
      backgroundColor={colors.background.elevated}
    >
      {machineData?.map((machine, index) => (
        <MachineItem key={machine.id} isFirst={index === 0} machine={machine} />
      ))}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});

export default MachineListTable;
