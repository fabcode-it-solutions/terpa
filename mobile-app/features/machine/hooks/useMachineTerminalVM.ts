import { useMemo } from "react";

export type TerminalRow = {
  type?: string | null;
  method?: string | null;
  cardNumber?: string;
  amount?: string;
  status?: string;
  statusColor?: string;
  bank?: string | null;
  timestamp?: string;
  approved?: boolean;
  reversed?: boolean;
};

export function useMachineTerminalVM(args: { data?: any }) {
  const { data } = args;

  const paymentData: TerminalRow[] = useMemo(() => {
    const tx = data?.transactions ?? [];
    return tx.map((t: any) => {
      // Use API-provided card brand (already normalized)
      const type = t.cardBrand || null;

      // Map card type to Spanish
      const cardType = String(t.cardType || "").toLowerCase();
      const method = cardType === "credit" ? "Crédito" : cardType === "debit" ? "Débito" : null;

      // Use formatted amount from API
      const amount = t.amount?.valueFormatted || "$0.00";

      const cardNumber = String(t.cardLast4 || "");
      const bank = t.cardIssuer || t.cardBrand || null;

      // Extract only time from timestamp (e.g., "26/10/2025 23:26:46" -> "23:26:46")
      const fullTimestamp = t.createdAtFormatted || t.createdAt || "";
      const timeMatch = fullTimestamp.match(/(\d{2}:\d{2}:\d{2})/);
      const timestamp = timeMatch ? timeMatch[1] : fullTimestamp;

      // Use API-provided status label and color
      const status = t.statusLabel || "Aprobada";
      const statusColor = t.statusColor || "success";

      return {
        type,
        method,
        cardNumber,
        amount,
        status,
        statusColor,
        bank,
        timestamp,
        approved: t.approved,
        reversed: t.reversed,
      };
    });
  }, [data?.transactions]);

  return { paymentData } as const;
}
