import { StatusFilter } from "@/components/admin/status-filter";
import MachineDropdown from "@/components/machine/machine-dropdown";
import PresenceIndicator from "@/components/machine/machine-presence-indicator";
import SearchBox from "@/components/search-box";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Title } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  cn,
  formatNumber,
  getMachineOnlineStatus,
  pluralize,
} from "@/lib/utils";
import { getTeamBySlugCached } from "@/loaders/team";
import { isExperimentActiveForTeam } from "@/service/experiment";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { endOfDay, isAfter, isBefore, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

// Helper function to map machine type to display label
function getMachineTypeLabel(type: "VENDING" | "MICROMARKET"): string {
  switch (type) {
    case "VENDING":
      return "Vending";
    case "MICROMARKET":
      return "Micro Market";
    default:
      return "Vending";
  }
}

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    query?: string;
    status?: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Check if user has financial access
  const showFinancials =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;
  const now = new Date();
  const timezone = "America/Monterrey";
  const zoned = toZonedTime(now, timezone);
  const gte = fromZonedTime(startOfDay(zoned), timezone);
  const lte = fromZonedTime(endOfDay(zoned), timezone);

  const userMachines = await prisma.userMachine.findMany({
    where: { userId: session.uid },
    select: { machineId: true },
  });

  // Check if MICROMARKET experiment is active for this team
  const { isActive: isMicromarketExperimentActive } =
    await isExperimentActiveForTeam("MICROMARKET", team.id);

  const machines = await prisma.machine.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      name: props.searchParams.query
        ? {
            contains: props.searchParams.query,
            mode: "insensitive",
          }
        : undefined,
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      terminalSerialNumber: true,
      createdAt: true,
      lastPingAt: true,
      tubesTotal: true,
      type: true,
      spirals: { where: { deletedAt: null } },
      ...(showFinancials
        ? { sales: { where: { createdAt: { gte, lte } } } }
        : {}),
      activeUntilDate: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Filter machines by status if status filter is applied
  const filteredMachines = props.searchParams.status
    ? machines.filter((machine) => {
        const status = getMachineOnlineStatus(machine.lastPingAt);
        return status === props.searchParams.status;
      })
    : machines;

  // Sort machines by name alphabetically
  const sortedMachines = [...filteredMachines].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  // Calculate counts for each status
  const counts = machines.reduce(
    (acc, machine) => {
      if (machine.lastPingAt) {
        const status = getMachineOnlineStatus(machine.lastPingAt);
        if (status === "online") return { ...acc, online: acc.online + 1 };
        if (status === "warning") return { ...acc, warning: acc.warning + 1 };
        if (status === "offline" || status === "noData")
          return { ...acc, offline: acc.offline + 1 };
      }

      return acc;
    },
    { online: 0, warning: 0, offline: 0 },
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
              <Link href={`/team/${props.params.slug}/machines`}>Máquinas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Máquinas</Title>
        {(teamRole === TeamMemberRole.OWNER ||
          session.role === UserRole.ADMIN) && (
          <Button size="sm" asChild>
            <Link href={`/team/${props.params.slug}/machines/create`}>
              <PlusIcon className="w-4 h-4" />
              <span className="hidden md:block">Agregar Máquina</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-md">Maquinas Totales</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {formatNumber(machines.length)}{" "}
                {pluralize(machines.length, "máquina", "máquinas")}
              </CardContent>
            </Card>
            <Card className="w-full gap-4">
              <CardHeader>
                <CardTitle className="text-md">Sin Conexión</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <span
                  className={cn(
                    "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                    "border-red-300 bg-red-600 dark:border-red-900",
                  )}
                />
                <p className="text-muted-foreground">
                  {formatNumber(counts.offline)}{" "}
                  {pluralize(counts.offline, "máquina", "máquinas")}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-1 gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-md">Intermitentes</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <span
                  className={cn(
                    "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                    "border-yellow-300 bg-yellow-500 dark:border-yellow-700",
                  )}
                />
                <p className="text-muted-foreground">
                  {formatNumber(counts.warning)}{" "}
                  {pluralize(counts.warning, "máquina", "máquinas")}
                </p>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-md">En Línea</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <span
                  className={cn(
                    "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                    "border-emerald-300 bg-emerald-600 dark:border-emerald-900",
                  )}
                />
                <p className="text-muted-foreground">
                  {formatNumber(counts.online)}{" "}
                  {pluralize(counts.online, "máquina", "máquinas")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBox />
          </div>
          <div className="flex gap-2">
            <StatusFilter />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Inventario</TableHead>
            {showFinancials && <TableHead>Ventas Hoy</TableHead>}
            <TableHead>Cambio Actual</TableHead>
            {isMicromarketExperimentActive && (
              <TableHead>Tipo de Servicio</TableHead>
            )}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMachines.map((machine) => {
            const base = `/team/${team.slug}/machines/${machine.id}`;
            const { maxCapacity, currentCount } = machine.spirals.reduce(
              (acc, spiral) => {
                acc.maxCapacity += spiral.maxCapacity;
                acc.currentCount += spiral.currentCount;
                return acc;
              },
              { maxCapacity: 0, currentCount: 0 },
            );
            const percent = Math.round((currentCount * 100) / maxCapacity) || 0;
            const salesToday =
              showFinancials && machine.sales
                ? machine.sales.reduce(
                    (acc, sale) => acc + sale.machineProductCost,
                    0,
                  )
                : 0;

            return (
              <TableRow key={machine.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {(isBefore(zoned, machine.activeUntilDate) ||
                      session.role === UserRole.ADMIN) && (
                      <PresenceIndicator lastPresence={machine.lastPingAt} />
                    )}
                    <Button
                      variant="ghost"
                      asChild
                      className="font-normal p-2 h-auto"
                    >
                      <Link href={base}>{machine.name}</Link>
                    </Button>
                  </div>
                  {isAfter(zoned, machine.activeUntilDate) && (
                    <div>
                      <span className="text-xs text-red-500">
                        (Suscripción Vencida)
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {(isBefore(zoned, machine.activeUntilDate) ||
                    session.role === UserRole.ADMIN) && (
                    <Button
                      variant="ghost"
                      asChild
                      className="p-2 h-auto font-normal"
                    >
                      <Link
                        href={`${base}/inventory`}
                        className="flex items-center gap-4"
                      >
                        {percent}%
                        <Progress
                          value={percent}
                          className="w-[30px] md:w-[60px] h-1"
                        />
                      </Link>
                    </Button>
                  )}
                </TableCell>
                {showFinancials && (
                  <TableCell>
                    {(isBefore(zoned, machine.activeUntilDate) ||
                      session.role === UserRole.ADMIN) && (
                      <Button
                        variant="ghost"
                        asChild
                        className="font-normal p-2 h-auto"
                      >
                        <Link href={`${base}/sales`}>
                          {formatCurrency(salesToday)}
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {(isBefore(zoned, machine.activeUntilDate) ||
                    session.role === UserRole.ADMIN) && (
                    <div>
                      {machine.tubesTotal
                        ? formatCurrency(machine.tubesTotal)
                        : ""}
                    </div>
                  )}
                </TableCell>
                {isMicromarketExperimentActive && (
                  <TableCell>
                    {(isBefore(zoned, machine.activeUntilDate) ||
                      session.role === UserRole.ADMIN) && (
                      <div>{getMachineTypeLabel(machine.type)}</div>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex justify-end">
                    <MachineDropdown
                      machineId={machine.id}
                      base={base}
                      canDelete={session.role === UserRole.ADMIN}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AppContainer>
  );
}
