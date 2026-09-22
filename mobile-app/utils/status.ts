import { ColorPalette } from "@/theme";
import type { TFunction } from "i18next";

export function getMachineStatusInfo(
  status: string | undefined,
  t: TFunction,
  colors: ColorPalette,
): { label: string; color: string; textColor: string } {
  const s = (status || "offline").toString();
  const label =
    s === "online"
      ? t("machine.status.online")
      : s === "warning"
        ? t("machine.status.warning")
        : t("machine.status.offline");
  const color =
    s === "online"
      ? colors.status.online
      : s === "warning"
        ? colors.status.warning
        : colors.status.offline;
  const textColor =
    s === "online"
      ? colors.statusText.online
      : s === "warning"
        ? colors.statusText.warning
        : colors.statusText.offline;
  return { label, color, textColor };
}

export function getBillingStatusColor(status: string, colors: ColorPalette): string {
  switch (status) {
    case "PAYMENT_PENDING":
    case "PAYMENT_VERIFICATION_PENDING":
      return colors.warning.main;
    case "PAYMENT_VERIFICATION_REJECTED":
    case "CANCELLED":
      return colors.error.main;
    case "PAYMENT_SUCCESS":
      return colors.success.main;
    default:
      return colors.gray[400];
  }
}
