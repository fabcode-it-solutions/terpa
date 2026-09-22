"use client";

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
import { Invoice } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { InvoiceStatusBadge } from "./invoice-status-badge";

type Props = {
  invoices: Array<Invoice>;
};

export default function BillingTable({ invoices }: Props) {
  const params = useParams();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estatus</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <Link
                href={`/team/${params.slug}/billing/listing/${invoice.id}`}
                className="hover:underline"
              >
                {formatInTimeZone(
                  invoice.createdAt,
                  "America/Monterrey",
                  "dd/MM/yyyy HH:mm",
                )}
              </Link>
            </TableCell>
            <TableCell>{formatCurrency(invoice.totalPriceCents)} USD</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/team/${params.slug}/billing/listing/${invoice.id}`}
                >
                  Ver pago
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
