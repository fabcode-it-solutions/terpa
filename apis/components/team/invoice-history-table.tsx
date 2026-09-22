"use client";

import { CfdiActionButtons } from "@/components/billing/cfdi-action-buttons";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { differenceInMonths } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type InvoiceHistoryItem = {
  id: string;
  createdAt: Date;
  status: InvoiceStatus;
  totalPriceCents: number;
  exchangeRate: number;
  invoiceItems: Array<{
    startDate: Date;
    endDate: Date;
    machine: {
      id: string;
      name: string;
    };
  }>;
  cfdi?: {
    status: string;
    facturamaId: string | null;
    folio: string | null;
  } | null;
};

type Props = {
  invoices: Array<InvoiceHistoryItem>;
  isFacturamaEnabled: boolean;
};

export function InvoiceHistoryTable({ invoices, isFacturamaEnabled }: Props) {
  const params = useParams();

  const calculateInvoiceStats = (invoice: InvoiceHistoryItem) => {
    const uniqueMachines = new Set(
      invoice.invoiceItems.map((item) => item.machine.id),
    ).size;
    const totalMonths = invoice.invoiceItems.reduce((total, item) => {
      const months = differenceInMonths(item.endDate, item.startDate);
      return total + Math.max(1, months); // Ensure at least 1 month
    }, 0);

    return {
      machinesCount: uniqueMachines,
      monthsCount: totalMonths,
      totalAmount: invoice.totalPriceCents,
    };
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay facturas en el historial</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden sm:table-cell">Meses</TableHead>
          <TableHead className="hidden sm:table-cell">Máquinas</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {isFacturamaEnabled && <TableHead>Factura</TableHead>}
          <TableHead className="w-[100px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const stats = calculateInvoiceStats(invoice);
          return (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/team/${params.slug}/billing/listing/${invoice.id}`}
                  className="hover:underline"
                >
                  {formatInTimeZone(
                    invoice.createdAt,
                    "America/Monterrey",
                    "dd/MM/yyyy",
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {stats.monthsCount}{" "}
                {pluralize(stats.monthsCount, "mes", "meses")}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {stats.machinesCount}{" "}
                {pluralize(stats.machinesCount, "máquina", "máquinas")}
              </TableCell>
              <TableCell className="text-right font-medium">
                <div>USD {(stats.totalAmount / 100).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  MXN{" "}
                  {formatCurrency(
                    Math.round(
                      (stats.totalAmount *
                        Math.round(invoice.exchangeRate * 100)) /
                        100,
                    ),
                  ).replace("$", "")}
                </div>
              </TableCell>
              {isFacturamaEnabled && (
                <TableCell>
                  {invoice.cfdi?.status === "COMPLETED" && (
                    <CfdiActionButtons invoiceId={invoice.id} />
                  )}
                </TableCell>
              )}
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/team/${params.slug}/billing/listing/${invoice.id}`}
                  >
                    Ver Detalles
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
