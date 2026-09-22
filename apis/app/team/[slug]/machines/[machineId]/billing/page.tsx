import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  // Get team first to avoid the initialization error
  const team = await getTeamBySlugCached(props.params.slug);
  const invoiceItems = await prisma.invoiceItem.findMany({
    where: {
      machineId: props.params.machineId,
    },
    include: {
      invoice: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación</CardTitle>
      </CardHeader>
      <Separator />
      <table className="w-full text-sm">
        <TableHeader className="border-none">
          <TableRow>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Fin</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.startDate.toLocaleDateString()}</TableCell>
              <TableCell>{item.endDate.toLocaleDateString()}</TableCell>
              <TableCell>{item.description || "Sin descripción"}</TableCell>
              <TableCell>{formatCurrency(item.priceCents)}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={item.invoice.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/team/${props.params.slug}/billing/listing/${item.invoice.id}`}
                    >
                      Ver Pago
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </Card>
  );
}
