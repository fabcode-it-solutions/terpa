import RouteDropdown from "@/components/route/route-dropdown";
import Timestamp from "@/components/timestamp";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/utils";
import { getTeamBySlugCached } from "@/loaders/team";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const routes = await prisma.route.findMany({
    where: { teamId: team.id, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          routeMachines: {
            where: {
              machine: {
                deletedAt: null,
              },
            },
          },
        },
      },
    },
  });

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}`}>{team.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}/routes`}>Rutas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Rutas</Title>
        <Button size="sm" asChild>
          <Link href={`/team/${props.params.slug}/routes/create`}>
            <PlusIcon className="w-4 h-4" />
            Agregar Ruta
          </Link>
        </Button>
      </div>
      {routes.length === 0 && (
        <div className="flex flex-col items-center py-20 border rounded-xl border-dotted gap-2">
          <h3 className="text-xl font-semibold">No Hay Rutas</h3>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Aún no has agregado rutas a tu equipo.
            </p>
            <p className="text-muted-foreground text-sm">
              Haz clic en el botón de arriba para agregar tu primera ruta.
            </p>
          </div>
        </div>
      )}
      {routes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Máquinas</TableHead>
              <TableHead>Creación</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell>{route.name}</TableCell>
                <TableCell>
                  {route._count.routeMachines}{" "}
                  {pluralize(route._count.routeMachines, "máquina", "máquinas")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Timestamp date={route.createdAt} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <RouteDropdown routeId={route.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </AppContainer>
  );
}
