import Timestamp from "@/components/timestamp";
import { Button } from "@/components/ui/button";
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
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  query?: string;
  page?: number;
  teamId?: string;
};

export default async function AdminTerminalsTable(props: Props) {
  const page = props.page || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  // Get terminal serial numbers used by machines in the specified team (for soft relationship)
  const teamTerminalSerials = props.teamId
    ? await prisma.machine
        .findMany({
          where: {
            teamId: props.teamId,
            terminalSerialNumber: { not: null },
          },
          select: { terminalSerialNumber: true },
        })
        .then((machines) =>
          machines
            .map((m) => m.terminalSerialNumber)
            .filter((serial): serial is string => serial !== null),
        )
    : [];

  // For query search, we also need to find terminals used by teams matching the search term
  const queryTerminalSerials = props.query
    ? await prisma.machine
        .findMany({
          where: {
            terminalSerialNumber: { not: null },
            team: {
              name: { contains: props.query, mode: "insensitive" as const },
            },
          },
          select: { terminalSerialNumber: true },
        })
        .then((machines) =>
          machines
            .map((m) => m.terminalSerialNumber)
            .filter((serial): serial is string => serial !== null),
        )
    : [];

  const whereCondition = {
    ...(props.query && {
      OR: [
        {
          description: { contains: props.query, mode: "insensitive" as const },
        },
        { serialNumber: { contains: props.query } },
        { pharosMerchantCode: { contains: props.query } },
        { pharosTerminalCode: { contains: props.query } },
        ...(queryTerminalSerials.length > 0
          ? [{ serialNumber: { in: queryTerminalSerials } }]
          : []),
      ],
    }),
    ...(props.teamId &&
      teamTerminalSerials.length > 0 && {
        serialNumber: { in: teamTerminalSerials },
      }),
  };

  const [terminals, totalCount] = await Promise.all([
    prisma.terminal.findMany({
      select: {
        id: true,
        description: true,
        serialNumber: true,
        pharosMerchantCode: true,
        pharosTerminalCode: true,
        createdAt: true,
      },
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.terminal.count({
      where: whereCondition,
    }),
  ]);

  // Get team information for each terminal through the soft relationship
  const terminalTeams = await prisma.machine.findMany({
    where: {
      terminalSerialNumber: { in: terminals.map((t) => t.serialNumber) },
    },
    select: {
      terminalSerialNumber: true,
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Create a map of terminal serial number to team
  const terminalTeamMap = new Map(
    terminalTeams.map((mt) => [mt.terminalSerialNumber!, mt.team]),
  );

  // Enrich terminals with team data
  const terminalsWithTeams = terminals.map((terminal) => ({
    ...terminal,
    team: terminalTeamMap.get(terminal.serialNumber) || null,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alias</TableHead>
            <TableHead>Serie</TableHead>
            <TableHead>Código Terminal</TableHead>
            <TableHead>Código Comercio</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Creación</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {terminalsWithTeams.map((terminal) => (
            <TableRow key={terminal.id}>
              <TableCell>{terminal.description}</TableCell>
              <TableCell>{terminal.serialNumber}</TableCell>
              <TableCell>{terminal.pharosTerminalCode}</TableCell>
              <TableCell>{terminal.pharosMerchantCode}</TableCell>
              <TableCell>
                {terminal.team ? (
                  <span className="text-sm">{terminal.team.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Sin asignar
                  </span>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm">
                  {formatDistanceToNow(terminal.createdAt, {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  <Timestamp date={terminal.createdAt} />
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Button size="icon" variant="outline" asChild>
                    <Link href={`/admin/terminals/${terminal.id}`}>
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/admin/terminals?${new URLSearchParams({
                      ...(props.query && { query: props.query }),
                      ...(props.teamId && { teamId: props.teamId }),
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
                      href={`/admin/terminals?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamId && { teamId: props.teamId }),
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
                      href={`/admin/terminals?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamId && { teamId: props.teamId }),
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
                      href={`/admin/terminals?${new URLSearchParams({
                        ...(props.query && { query: props.query }),
                        ...(props.teamId && { teamId: props.teamId }),
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
                    href={`/admin/terminals?${new URLSearchParams({
                      ...(props.query && { query: props.query }),
                      ...(props.teamId && { teamId: props.teamId }),
                      page: (page + 1).toString(),
                    }).toString()}`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
