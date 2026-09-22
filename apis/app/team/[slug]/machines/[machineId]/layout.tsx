import PresenceIndicator from "@/components/machine/machine-presence-indicator";
import MachineTabs from "@/components/machine/machine-tabs";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamMachineCached } from "@/loaders/machine";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { isAfter, isBefore } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
  children: React.ReactNode;
};

export default async function Layout(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const machine = await getTeamMachineCached(team.id, props.params.machineId);
  const zonedNow = toZonedTime(new Date(), "America/Monterrey");

  const teamRole = team.members[0]?.role;
  // If the user is an operator and the machine is not assigned to them, return a 404
  if (teamRole === TeamMemberRole.OPERATOR && session.role !== UserRole.ADMIN) {
    const userMachines = await prisma.userMachine.findMany({
      where: { userId: session.uid, machineId: machine.id },
      select: { machineId: true },
    });

    if (!userMachines.length) {
      return notFound();
    }
  }

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
              <Link href={`/team/${props.params.slug}/machines`}>Máquinas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}/machines/${machine.id}`}>
                {machine.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <Title>{machine.name}</Title>
          {(isBefore(zonedNow, machine.activeUntilDate) ||
            session.role === UserRole.ADMIN) && (
            <PresenceIndicator lastPresence={machine.lastPingAt} />
          )}
        </div>
      </div>
      {isAfter(zonedNow, machine.activeUntilDate) &&
        session.role === UserRole.ADMIN && (
          <div className="text-sm text-red-500">
            La máquina no se encuentra activa. El cliente no podrá acceder a
            detalles de la máquina.
          </div>
        )}
      {(isBefore(zonedNow, machine.activeUntilDate) ||
        session.role === UserRole.ADMIN) && (
        <>
          <MachineTabs />
          <div>{props.children}</div>
        </>
      )}
      {isAfter(zonedNow, machine.activeUntilDate) &&
        session.role !== UserRole.ADMIN && (
          <Card>
            <CardContent className="p-10 py-20 flex flex-col items-center gap-2">
              <TriangleAlertIcon className="w-10 h-10 text-red-500" />
              <Title>La máquina no se encuentra activa.</Title>
              <p className="text-muted-foreground text-center">
                Es necesario contar con una suscripción activa para poder
                acceder a los detalles de la máquina.
              </p>
            </CardContent>
          </Card>
        )}
    </AppContainer>
  );
}
