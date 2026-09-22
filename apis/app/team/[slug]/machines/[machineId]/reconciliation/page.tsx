import MachineReconciliationDialog from "@/components/machine/machine-reconciliation-dialog";
import Timestamp from "@/components/timestamp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getTeamMachineCached } from "@/loaders/machine";
import { getTeamBySlugCached } from "@/loaders/team";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const machine = await getTeamMachineCached(team.id, props.params.machineId);

  const reconciliations = await prisma.machineReconciliation.findMany({
    where: { machineId: machine.id },
    select: {
      id: true,
      reconciliationValueCents: true,
      createdAt: true,
      createdByUser: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Card className="bg-background">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle>Cortes de Caja</CardTitle>
          <MachineReconciliationDialog />
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="space-y-6 p-0">
        {reconciliations.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="Sin Cortes de Caja"
              description="Haz el primer corte de caja para empezar a llevar el control de tus retiros."
            />
          </div>
        )}
        {reconciliations.length > 0 && (
          <div className="divide-y">
            {reconciliations.map((reconciliation) => {
              return (
                <div
                  key={reconciliation.id}
                  className="p-4 justify-between flex items-center"
                >
                  <div className="text-sm">
                    <p>{reconciliation.createdByUser.email}</p>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(reconciliation.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                    <Timestamp date={reconciliation.createdAt} />
                  </div>

                  <div>
                    {formatCurrency(reconciliation.reconciliationValueCents)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
