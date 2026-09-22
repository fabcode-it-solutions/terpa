import { useMemo } from "react";
import type { BillingSummaryResponse } from "@/services/repositories/billing";

export type BillingMachineVM = {
  name: string;
  period: string;
  status: string;
  statusLabel: string;
};

export function useBillingVM(billing?: BillingSummaryResponse) {
  const machines = useMemo<BillingMachineVM[]>(() => {
    return (billing?.machines ?? []).map((machine) => ({
      name: machine?.name ?? "-",
      period: machine?.period ?? "-",
      status: machine?.status ?? "-",
      statusLabel: machine?.statusLabel ?? machine?.status ?? "-",
    }));
  }, [billing?.machines]);

  const unpaidCount = useMemo(() => {
    const statuses = (billing?.machines ?? []).map((machine) => (machine?.status ?? "").toString());
    return statuses.filter(
      (status) =>
        status.includes("NOT_INVOICED") ||
        status.includes("sin pago") ||
        status.includes("no_payment"),
    ).length;
  }, [billing?.machines]);

  return { machines, unpaidCount };
}
