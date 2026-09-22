import AdminExpirationDateDialog from "@/components/admin/admin-expiration-date-dialog";
import { CSVExportButton } from "@/components/admin/csv-export-button";
import { StatusFilter } from "@/components/admin/status-filter";
import TeamArchiveFilter from "@/components/admin/team-archive-filter";
import { TeamFilter } from "@/components/admin/team-filter";
import MachineSortDropdown from "@/components/machine-sort-dropdown";
import PresenceIndicator from "@/components/machine/machine-presence-indicator";
import SearchBox from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import {
  cn,
  formatNumber,
  getMachineOnlineStatus,
  pluralize,
} from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  slug: string;
  isArchived?: boolean;
};

type Props = {
  query?: string;
  page?: number;
  teamSlug?: string;
  status?: string;
  sort?:
    | "team-asc"
    | "team-desc"
    | "name-asc"
    | "name-desc"
    | "lastPing-asc"
    | "lastPing-desc"
    | "expiration-asc"
    | "expiration-desc"
    | "team"
    | "name"
    | "lastPing"
    | "expiration";
  teams: Team[];
  showArchived?: boolean;
};

// Helper function to get the sort order based on the sort parameter
function getMachineSortOrder(sort?: string) {
  const [field, direction = "asc"] = sort?.split("-") || ["team"];
  const dir = direction as "asc" | "desc";

  switch (field) {
    case "name":
      return { name: dir };
    case "expiration":
      return { activeUntilDate: dir };
    case "team":
    default:
      return [{ team: { name: dir } }, { name: "asc" as const }];
  }
}

export default async function AdminMachinesTable(props: Props) {
  const page = props.page || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;
  const mode = "insensitive" as const;
  const contains = props.query;

  const showArchived = props.showArchived ?? true;

  // Fetch all non-deleted machines for counting totals (with team filter if applied)
  const allMachines = await prisma.machine.findMany({
    select: {
      id: true,
      lastPingAt: true,
    },
    where: {
      deletedAt: null,
      ...(props.teamSlug
        ? { team: { slug: props.teamSlug } }
        : showArchived
          ? {}
          : { team: { isArchived: false } }),
    },
  });

  // Calculate counts from filtered machines
  const counts = allMachines.reduce(
    (acc, machine) => {
      if (machine.lastPingAt) {
        const status = getMachineOnlineStatus(machine.lastPingAt);
        if (status === "online") return { ...acc, online: acc.online + 1 };
        if (status === "warning") return { ...acc, warning: acc.warning + 1 };
        if (status === "offline" || status === "noData")
          return { ...acc, offline: acc.offline + 1 };
      } else {
        return { ...acc, offline: acc.offline + 1 };
      }

      return acc;
    },
    { online: 0, warning: 0, offline: 0 },
  );

  const whereCondition = {
    deletedAt: null,
    ...(props.teamSlug
      ? { team: { slug: props.teamSlug } }
      : showArchived
        ? {}
        : { team: { isArchived: false } }),
    ...(contains
      ? {
          OR: [
            { name: { contains, mode } },
            { team: { name: { contains, mode } } },
            { terminalSerialNumber: { contains, mode } },
          ],
        }
      : {}),
  };

  // Fetch machines with filters for the table display and total count
  const [machines, totalCountBeforeStatusFilter] = await Promise.all([
    prisma.machine.findMany({
      select: {
        id: true,
        name: true,
        team: { select: { name: true, slug: true, isArchived: true } },
        terminalSerialNumber: true,
        pharosTerminalCode: true,
        lastPingAt: true,
        activeUntilDate: true,
      },
      where: whereCondition,
      // Don't use orderBy for lastPing sort as it needs client-side sorting
      ...(!props.sort?.startsWith("lastPing")
        ? { orderBy: getMachineSortOrder(props.sort) }
        : {}),
    }),
    prisma.machine.count({
      where: whereCondition,
    }),
  ]);

  // Filter machines by status if status filter is applied
  const filteredMachines = props.status
    ? machines.filter((machine) => {
        const status = getMachineOnlineStatus(machine.lastPingAt);
        return status === props.status;
      })
    : machines;

  // Apply client-side sorting for lastPing, otherwise use server-side sorted results
  const sortedMachines = props.sort?.startsWith("lastPing")
    ? [...filteredMachines].sort((a, b) => {
        // Handle null values by placing them at the end
        if (!a.lastPingAt && !b.lastPingAt) return 0;
        if (!a.lastPingAt) return 1;
        if (!b.lastPingAt) return -1;

        const timeDiff = b.lastPingAt.getTime() - a.lastPingAt.getTime();

        // Apply direction: desc by default, asc if specified
        return props.sort === "lastPing-asc" ? -timeDiff : timeDiff;
      })
    : filteredMachines;

  // Calculate total count after status filtering
  const totalCount = props.status
    ? sortedMachines.length
    : totalCountBeforeStatusFilter;

  // Apply pagination to the sorted and filtered results
  const paginatedMachines = sortedMachines.slice(skip, skip + pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-md">Maquinas Totales</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {formatNumber(allMachines.length)}{" "}
              {pluralize(allMachines.length, "máquina", "máquinas")}
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <SearchBox />
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <StatusFilter />
            <TeamFilter teams={props.teams} />
            <MachineSortDropdown currentSort={props.sort} />
            <TeamArchiveFilter defaultShowArchived={true} />
            <CSVExportButton />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Máquina</TableHead>
              <TableHead className="hidden sm:table-cell">Code</TableHead>
              <TableHead className="hidden md:table-cell">Serial</TableHead>
              <TableHead className="text-center">
                Fecha de Vencimiento
              </TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMachines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <PresenceIndicator lastPresence={machine.lastPingAt} />
                    <Button
                      variant="ghost"
                      className="flex flex-col items-start px-2 py-1 gap-0 font-normal"
                      asChild
                    >
                      <Link
                        href={`/team/${machine.team.slug}/machines/${machine.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground text-sm">
                            {machine.team.name}
                          </p>
                          {machine.team.isArchived && (
                            <Badge variant="destructive" className="text-xs">
                              Archivado
                            </Badge>
                          )}
                        </div>
                        <p>{machine.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {machine.lastPingAt
                            ? formatDistanceToNow(machine.lastPingAt, {
                                locale: es,
                                addSuffix: true,
                              })
                            : "Nunca conectada"}
                        </p>
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          Code: {machine.pharosTerminalCode} | Serial:{" "}
                          {machine.terminalSerialNumber}
                        </div>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {machine.pharosTerminalCode}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {machine.terminalSerialNumber}
                </TableCell>
                <TableCell>
                  <AdminExpirationDateDialog
                    key={machine.id}
                    machine={{
                      id: machine.id,
                      nameLabel: machine.name,
                      teamLabel: machine.team.name,
                      activeUntilDate: machine.activeUntilDate,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs px-2"
                    >
                      <Link
                        href={`/team/${machine.team.slug}/machines/${machine.id}`}
                      >
                        <span className="hidden sm:inline">Ver detalles</span>
                        <span className="sm:hidden">Ver</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/admin/machines?${new URLSearchParams({
                      ...(props.query && { query: props.query }),
                      ...(props.teamSlug && {
                        teamId:
                          props.teams.find((t) => t.slug === props.teamSlug)
                            ?.id || "",
                      }),
                      ...(props.status && { status: props.status }),
                      ...(props.sort && { sort: props.sort }),
                      page: (page - 1).toString(),
                    }).toString()}`}
                  />
                </PaginationItem>
              )}

              {/* First page */}
              {page > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href={`/admin/machines?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamSlug && {
                          teamId:
                            props.teams.find((t) => t.slug === props.teamSlug)
                              ?.id || "",
                        }),
                        ...(props.status && { status: props.status }),
                        ...(props.sort && { sort: props.sort }),
                        page: "1",
                      }).toString()}`}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {page > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Current page and surrounding pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber =
                  Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                if (pageNumber > totalPages) return null;

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={`/admin/machines?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamSlug && {
                          teamId:
                            props.teams.find((t) => t.slug === props.teamSlug)
                              ?.id || "",
                        }),
                        ...(props.status && { status: props.status }),
                        ...(props.sort && { sort: props.sort }),
                        page: pageNumber.toString(),
                      }).toString()}`}
                      isActive={pageNumber === page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Last page */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href={`/admin/machines?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamSlug && {
                          teamId:
                            props.teams.find((t) => t.slug === props.teamSlug)
                              ?.id || "",
                        }),
                        ...(props.status && { status: props.status }),
                        ...(props.sort && { sort: props.sort }),
                        page: totalPages.toString(),
                      }).toString()}`}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href={`/admin/machines?${new URLSearchParams({
                      ...(props.query && { query: props.query }),
                      ...(props.teamSlug && {
                        teamId:
                          props.teams.find((t) => t.slug === props.teamSlug)
                            ?.id || "",
                      }),
                      ...(props.status && { status: props.status }),
                      ...(props.sort && { sort: props.sort }),
                      page: (page + 1).toString(),
                    }).toString()}`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
