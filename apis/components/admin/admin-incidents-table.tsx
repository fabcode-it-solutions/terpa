import AdminIncidentResolveForm from "@/components/admin/admin-incident-resolve-form";
import Timestamp from "@/components/timestamp";
import EmptyState from "@/components/ui/empty-state";
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
import { AlertCircleIcon } from "lucide-react";

type Props = {
  machineId?: string;
};

export default async function AdminIncidentsTable({ machineId }: Props) {
  const incidents = await prisma.incident.findMany({
    where: {
      resolvedAt: null,
      ...(machineId ? { machineId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      machine: {
        select: {
          id: true,
          name: true,
          terminalSerialNumber: true,
          team: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    take: 100,
  });

  if (!incidents.length) {
    return (
      <EmptyState
        title="No hay incidencias pendientes"
        description="Cuando ocurra un problema con una máquina, se mostrará aquí."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Máquina</TableHead>
          <TableHead>Mensaje</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((incident) => (
          <TableRow key={incident.id}>
            <TableCell>
              <div>
                <p>
                  {incident.machine.name} &bull;{" "}
                  {incident.machine.terminalSerialNumber}
                </p>
                <p className="text-muted-foreground">
                  {incident.machine.team.name}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 dark:text-orange-400 text-orange-600" />
                <p>{incident.message}</p>
              </div>
            </TableCell>
            <TableCell>
              <p>
                {formatDistanceToNow(incident.createdAt, {
                  locale: es,
                  addSuffix: true,
                })}
              </p>
              <div className="text-muted-foreground">
                <Timestamp date={incident.createdAt} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <AdminIncidentResolveForm incidentId={incident.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
