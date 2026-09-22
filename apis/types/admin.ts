import { InvoiceStatus } from "@prisma/client";

export type AdminInvoice = {
  id: string;
  createdAt: Date;
  totalPriceCents: number;
  adjustedAmountCents: number | null;
  exchangeRate: number;
  status: InvoiceStatus;
  team: {
    name: string;
    slug: string;
  };
  cfdi?: {
    status: string;
    facturamaId: string | null;
    folio: string | null;
  } | null;
};
