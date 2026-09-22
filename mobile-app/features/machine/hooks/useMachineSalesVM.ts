import { useMemo } from "react";
import type { TFunction } from "i18next";

export type SalesRow = {
  id?: string | number;
  productName: string;
  productImage?: string;
  dexNumber: string;
  mdbNumber: string;
  price: number;
  paymentMethod: string;
  methodKey: "CARD" | "CASH";
  date: string;
  time: string;
  status: string;
};

export function useMachineSalesVM(args: { data?: any; lang?: string; t: TFunction }) {
  const { data, lang, t } = args;

  const salesData: SalesRow[] = useMemo(() => {
    const list = (data?.sales ?? []) as any[];
    const locale = (lang && lang.startsWith("es") ? "es-ES" : lang) || "en-US";

    return list.map((s: any) => {
      const d = s.createdAt ? new Date(s.createdAt) : null;
      const dateStr = d
        ? d.toLocaleDateString(locale as any)
        : (s.createdAtFormatted?.split(" ")[0] ?? "");
      const timeStr = d
        ? d.toLocaleTimeString(locale as any)
        : (s.createdAtFormatted?.split(" ")[1] ?? "");

      const methodRaw = (s.paymentMethod || "").toString().toUpperCase();
      const isCard = methodRaw === "CARD" || methodRaw === "TARJETA";

      return {
        id: s.id,
        productName: s.product?.name ?? "Producto",
        productImage: s.product?.images?.[0]?.url,
        dexNumber: String(s.machineProductId ?? "-"),
        mdbNumber: String(s.machineMdbProductId ?? "-"),
        price: (s.amount?.valueCents ?? 0) / 100,
        paymentMethod: isCard ? t("sales.card") : t("sales.cash"),
        methodKey: isCard ? "CARD" : "CASH",
        date: dateStr,
        time: timeStr,
        status: isCard ? t("sales.card") : t("sales.cash"),
      };
    });
  }, [data?.sales, lang, t]);

  return { salesData } as const;
}
