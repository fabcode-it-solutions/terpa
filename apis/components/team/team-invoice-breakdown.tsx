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
import { formatDate } from "@/lib/date-utils";
import { InvoiceStatus, TeamMemberRole } from "@prisma/client";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

type TeamWithMachinesAndInvoices = {
  id: string;
  name: string;
  slug: string;
  contactNumber: string | null;
  members: {
    role: TeamMemberRole;
    user: {
      phoneNumber: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  machines: {
    id: string;
    name: string;
    invoiceItems: {
      startDate: Date;
      endDate: Date;
      invoice: {
        id: string;
        status: InvoiceStatus;
        createdAt: Date;
        totalPriceCents: number;
        subtotalCents: number;
        vatAmountCents: number;
        vatRatePercent: number;
        exchangeRate: number;
        paymentMethod: string;
        mercadoPagoPaymentUrl: string | null;
        mercadoPagoPaymentId: string | null;
        paymentProofUrl: string | null;
        adjustedAmountCents: number | null;
        paidAt: Date | null;
        approvedAt: Date | null;
        approvedByUserId: string | null;
        rejectedAt: Date | null;
        rejectedByUserId: string | null;
        cancelledAt: Date | null;
        cancelledByUserId: string | null;
        teamId: string;
        updatedAt: Date;
        cfdi?: {
          status: string;
          facturamaId: string | null;
          folio: string | null;
        } | null;
      };
    }[];
  }[];
  summary: {
    totalMachines: number;
    paid: number;
    pendingPayment: number;
    pendingReview: number;
    rejected: number;
    cancelled: number;
    notInvoiced: number;
  };
};

type Props = {
  team: TeamWithMachinesAndInvoices;
  isFacturamaEnabled: boolean;
  children?: React.ReactNode;
};

export function TeamInvoiceBreakdown({
  team,
  isFacturamaEnabled,
  children,
}: Props) {
  if (team.machines.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-end gap-2">{children}</div>
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            No hay máquinas para mostrar en el período seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">{children}</div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Máquina</TableHead>
              <TableHead className="hidden sm:table-cell">Período</TableHead>
              <TableHead>Estado</TableHead>
              {isFacturamaEnabled && <TableHead>Factura</TableHead>}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.machines.map((machine) => {
              const invoiceItem = machine.invoiceItems[0];
              const status = invoiceItem?.invoice.status;

              return (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {invoiceItem ? (
                      <>
                        {formatDate(invoiceItem.startDate, "P")} -{" "}
                        {formatDate(invoiceItem.endDate, "P")}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={status || "NOT_INVOICED"} />
                  </TableCell>
                  {isFacturamaEnabled && (
                    <TableCell>
                      {invoiceItem?.invoice.cfdi?.status === "COMPLETED" && (
                        <CfdiActionButtons invoiceId={invoiceItem.invoice.id} />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {invoiceItem && (
                      <div className="flex justify-end">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="hidden sm:flex"
                        >
                          <Link
                            href={`/team/${team.slug}/billing/listing/${invoiceItem.invoice.id}`}
                            target="_blank"
                            className="flex items-center gap-1"
                          >
                            <span>Ver Pago</span>
                            <ArrowUpRightIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="flex sm:hidden"
                        >
                          <Link
                            href={`/team/${team.slug}/billing/listing/${invoiceItem.invoice.id}`}
                            target="_blank"
                          >
                            <ArrowUpRightIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
