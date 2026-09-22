import Timestamp from "@/components/timestamp";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ExportDialog } from "./export-dialog";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const reports = await prisma.dexReport.findMany({
    where: { machineId: props.params.machineId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // If there are no sales, show an empty state
  if (!reports.length) {
    return (
      <EmptyState
        title="No hay datos"
        description="Aquí se mostrarán los DEX que se han enviado desde esta máquina"
      />
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle>DEX</CardTitle>
        <ExportDialog
          teamSlug={props.params.slug}
          machineId={props.params.machineId}
        />
      </CardHeader>
      <Separator />
      <Table
        className="shadow-none"
        wrapperClassName="rounded-none border-none"
      >
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.reportId}>
              <TableCell>
                <p>
                  Recibido{" "}
                  {formatDistanceToNow(report.createdAt, {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
                <p className="text-muted-foreground">
                  <Timestamp date={report.createdAt} />
                </p>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link
                      href={`/team/${props.params.slug}/machines/${props.params.machineId}/dex/${report.reportId}`}
                    >
                      Ver
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
