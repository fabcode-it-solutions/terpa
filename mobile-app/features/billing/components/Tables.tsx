import React, { memo, useMemo } from "react";
import { ThemeText, ThemeView } from "@/components";
import { useColors } from "@/theme";
import { StyleSheet } from "react-native";
import { getBillingStatusColor } from "@/utils/status";

export const StatusBadge: React.FC<{ status: string; statusLabel: string }> = memo(
  ({ status, statusLabel }) => {
    const colors = useColors();
    const statusColor = useMemo(
      () => getBillingStatusColor(status, colors as any),
      [status, colors],
    );

    return (
      <ThemeView
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusColor + "20",
            borderColor: statusColor,
          },
        ]}
        padded="xs"
        rounded="sm"
      >
        <ThemeText variant="caption1" style={{ color: statusColor }}>
          {statusLabel ?? status}
        </ThemeText>
      </ThemeView>
    );
  },
);

StatusBadge.displayName = "StatusBadge";

export const MachineRow: React.FC<{
  name: string;
  period: string;
  status: string;
  statusLabel: string;
}> = memo(({ name, period, status, statusLabel }) => {
  const colors = useColors();
  return (
    <ThemeView row style={[styles.tableRow, { borderColor: colors.border }]}>
      <ThemeView style={styles.tableCell}>
        <ThemeText variant="body2">{name}</ThemeText>
      </ThemeView>
      <ThemeView style={styles.tableCell}>
        <ThemeText variant="body2">{period || "N/A"}</ThemeText>
      </ThemeView>
      <ThemeView style={styles.tableCell}>
        <StatusBadge statusLabel={statusLabel} status={status} />
      </ThemeView>
    </ThemeView>
  );
});

MachineRow.displayName = "MachineRow";

export const InvoiceRow: React.FC<{ invoice: any }> = memo(({ invoice }) => {
  const colors = useColors();
  const items = invoice.invoiceItems ?? [];
  const hasItems = Array.isArray(items) && items.length > 0;
  const periods = hasItems
    ? items.map((item: any) => item.periodFormatted)
    : invoice?.period?.periodFormatted
      ? [invoice.period.periodFormatted]
      : [];
  const machineNames = hasItems
    ? items.map((item: any) => item.machine?.name)
    : Array.isArray(invoice?.machinesList)
      ? (invoice.machinesList ?? []).map((m: any) => m.name)
      : [];
  return (
    <ThemeView row style={[styles.tableRow, { borderColor: colors.border }]}>
      <ThemeView style={styles.tableCell}>
        <ThemeText variant="body2">
          {machineNames.length > 0 ? machineNames.join(", ") : "—"}
        </ThemeText>
      </ThemeView>
      <ThemeView style={styles.tableCell}>
        <ThemeText variant="body2">{periods.length > 0 ? periods.join(" | ") : "—"}</ThemeText>
      </ThemeView>
      <ThemeView style={styles.tableCell}>
        <ThemeText variant="body2">
          {(invoice.totalPrice && invoice.totalPrice?.usd?.valueFormatted) ?? "0"}
        </ThemeText>
      </ThemeView>
      <ThemeView style={styles.tableCell}>
        <StatusBadge statusLabel={invoice.statusLabel} status={(invoice.status ?? "").toString()} />
      </ThemeView>
    </ThemeView>
  );
});

InvoiceRow.displayName = "InvoiceRow";

const styles = StyleSheet.create({
  statusBadge: {
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
  },
});
