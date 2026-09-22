import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const teamId = searchParams.get("teamId");

  // Get terminal serial numbers used by machines in the specified team (for soft relationship)
  const teamTerminalSerials = teamId
    ? await prisma.machine
        .findMany({
          where: {
            teamId: teamId,
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
  const queryTerminalSerials = query
    ? await prisma.machine
        .findMany({
          where: {
            terminalSerialNumber: { not: null },
            team: {
              name: { contains: query, mode: "insensitive" as const },
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
    ...(query && {
      OR: [
        {
          description: { contains: query, mode: "insensitive" as const },
        },
        { serialNumber: { contains: query } },
        { pharosMerchantCode: { contains: query } },
        { pharosTerminalCode: { contains: query } },
        ...(queryTerminalSerials.length > 0
          ? [{ serialNumber: { in: queryTerminalSerials } }]
          : []),
      ],
    }),
    ...(teamId &&
      teamTerminalSerials.length > 0 && {
        serialNumber: { in: teamTerminalSerials },
      }),
  };

  const terminals = await prisma.terminal.findMany({
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
  });

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

  // Generate CSV content
  const csvHeaders = [
    "alias",
    "serie",
    "codigo_terminal",
    "codigo_comercio",
    "equipo",
    "creacion",
  ];

  const csvRows = terminalsWithTeams.map((terminal) => [
    terminal.description || "",
    terminal.serialNumber || "",
    terminal.pharosTerminalCode || "",
    terminal.pharosMerchantCode || "",
    terminal.team?.name || "Sin asignar",
    formatInTimeZone(
      terminal.createdAt,
      "America/Monterrey",
      "yyyy-MM-dd HH:mm:ss",
    ),
  ]);

  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map((row) =>
      row
        .map((field) =>
          // Escape fields that contain commas, quotes, or newlines
          typeof field === "string" &&
          (field.includes(",") || field.includes('"') || field.includes("\n"))
            ? `"${field.replace(/"/g, '""')}"`
            : field,
        )
        .join(","),
    ),
  ].join("\n");

  // Create filename with current date
  const filename = `terminales_${formatInTimeZone(new Date(), "America/Monterrey", "yyyy-MM-dd_HH-mm-ss")}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
