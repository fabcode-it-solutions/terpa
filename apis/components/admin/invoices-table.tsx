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
import { formatCurrency } from "@/lib/currency";
import { AdminInvoice } from "@/types/admin";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  invoices: Array<AdminInvoice>;
};

export function InvoicesTable({ invoices }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden sm:table-cell">Fecha</TableHead>
          <TableHead className="pl-7">Equipo</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Factura</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="hidden sm:table-cell">
              {formatInTimeZone(invoice.createdAt, "UTC", "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/team/${invoice.team.slug}`}>
                  {invoice.team.name}
                </Link>
              </Button>
            </TableCell>
            <TableCell>
              {(() => {
                const exchangeRateCents = Math.round(
                  invoice.exchangeRate * 100,
                );
                const amountInMxnCents =
                  invoice.adjustedAmountCents != null
                    ? invoice.adjustedAmountCents
                    : Math.round(
                        (invoice.totalPriceCents * exchangeRateCents) / 100,
                      );
                return `${formatCurrency(amountInMxnCents)} MXN`;
              })()}
            </TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>
              {invoice.cfdi?.status === "COMPLETED" && (
                <CfdiActionButtons invoiceId={invoice.id} />
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Link
                    href={`/team/${invoice.team.slug}/billing/listing/${invoice.id}`}
                  >
                    Ver Cobro <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="flex sm:hidden"
                >
                  <Link
                    href={`/team/${invoice.team.slug}/billing/listing/${invoice.id}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
