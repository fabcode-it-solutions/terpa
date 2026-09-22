import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Title } from "@/components/ui/typography";
import UserAccessConfigCard from "@/components/user/user-access-config-card";
import UserMachineAddDialog from "@/components/user/user-machine-add-dialog";
import UserMachineList from "@/components/user/user-machine-list";
import UserRemoveDialog from "@/components/user/user-remove-dialog";
import { UserRoleLabel } from "@/components/user/user-role-label";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    userId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  const [user, machines] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: props.params.userId,
        memberships: { some: { teamId: team.id } },
      },
      select: {
        id: true,
        email: true,
        memberships: {
          where: { teamId: team.id },
          select: { role: true, showFinancials: true },
        },
        userMachines: {
          where: {
            machine: {
              teamId: team.id,
            },
          },
          select: {
            machine: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.machine.findMany({
      where: {
        teamId: team.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!user) {
    return notFound();
  }

  const unassignedMachines = machines.filter(
    (machine) =>
      !user.userMachines.some(
        (userMachine) => userMachine.machine.id === machine.id,
      ),
  );

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
              <Link href={`/team/${props.params.slug}/users`}>Usuarios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`/team/${props.params.slug}/users/${props.params.userId}`}
              >
                Editar Usuario
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>Editar Usuario</Title>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3>{user.email}</h3>
              <UserRoleLabel role={user.memberships[0].role} />
            </div>
          </CardContent>
        </Card>

        <UserAccessConfigCard
          userId={user.id}
          showFinancials={user.memberships[0].showFinancials}
        />

        {user.memberships[0].role === "OWNER" && (
          <Card>
            <CardContent className="p-4">
              <EmptyState
                title="No puedes limitar el acceso de un propietario"
                description="Los propietarios pueden acceder a todas las máquinas del equipo."
              />
            </CardContent>
          </Card>
        )}

        {user.memberships[0].role === "OPERATOR" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>Máquinas Asignadas</CardTitle>
                <CardDescription>
                  Asigna máquinas a este usuario para que pueda acceder a ellas.
                </CardDescription>
              </div>
              <UserMachineAddDialog machines={unassignedMachines} />
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              {user.userMachines.length === 0 ? (
                <EmptyState
                  title="No hay máquinas asignadas"
                  description="Asigna máquinas a este usuario para que pueda acceder a ellas."
                />
              ) : (
                <UserMachineList
                  machines={user.userMachines.map((userMachine) => ({
                    id: userMachine.machine.id,
                    name: userMachine.machine.name,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        )}

        {user.memberships[0].role === "OPERATOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Eliminar Usuario</CardTitle>
              <CardDescription>
                Elimina este usuario si ya no deseas que tenga acceso a este
                equipo.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <UserRemoveDialog userId={user.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppContainer>
  );
}
