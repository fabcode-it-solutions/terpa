import RouteMachineAddDialog from "@/components/route/route-machine-add-dialog";
import RouteMachinesTable from "@/components/route/route-machines-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { getTeamBySlug } from "@/loaders/team";

type Props = {
  params: {
    slug: string;
    id: string;
  };
};

export default async function RoutePage({ params }: Props) {
  const team = await getTeamBySlug(params.slug);
  const route = await prisma.route.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      routeMachines: {
        select: {
          machine: {
            select: {
              id: true,
              name: true,
              spirals: { where: { deletedAt: null } },
            },
          },
        },
        where: {
          machine: {
            deletedAt: null,
          },
        },
      },
    },
  });

  const machinesToAdd = await prisma.machine.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      teamId: team.id,
      deletedAt: null,
      id: {
        not: {
          // Exclude machines that are already assigned to the route
          in: route?.routeMachines.map(({ machine }) => machine.id) || [],
        },
      },
    },
  });

  if (!route) {
    // Handle case where route is not found
    return <div>Ruta no encontrada</div>;
  }

  const routeMachines = route.routeMachines.map(({ machine }) => {
    const { maxCapacity, currentCount } = machine.spirals.reduce(
      (acc, spiral) => {
        acc.maxCapacity += spiral.maxCapacity;
        acc.currentCount += spiral.currentCount;
        return acc;
      },
      { maxCapacity: 0, currentCount: 0 },
    );
    const percent = Math.round((currentCount * 100) / maxCapacity) || 0;

    return {
      id: machine.id,
      name: machine.name,
      inventory: percent / 100,
      maxCapacity: maxCapacity,
    };
  });

  return (
    <Card className="bg-background overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Máquinas</CardTitle>
          <RouteMachineAddDialog machines={machinesToAdd} />
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <RouteMachinesTable machines={routeMachines} />
      </CardContent>
    </Card>
  );
}
