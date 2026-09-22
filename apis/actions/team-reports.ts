"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import { notFound } from "next/navigation";
import {
  getMachinesBySales,
  getProductsBySales,
  getSalesByDay,
} from "@/loaders/dashboard";
import { PaymentMethod, TeamMemberRole, UserRole } from "@prisma/client";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

// Helper function to get date range
function getDateRange(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const timezone = "America/Monterrey";
  return {
    from: searchParams.from
      ? fromZonedTime(startOfDay(searchParams.from), timezone)
      : fromZonedTime(
          startOfMonth(startOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
    to: searchParams.to
      ? fromZonedTime(endOfDay(searchParams.to), timezone)
      : fromZonedTime(
          endOfMonth(endOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
  };
}

// Helper function to verify team access for the current user
async function verifyTeamAccess(teamSlug: string) {
  const session = requireSession();
  const team = await getTeamBySlugCached(teamSlug);

  // Check if user is a team member or admin
  const sessionMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.uid,
        teamId: team.id,
      },
    },
    select: { role: true },
  });

  const isTeamMember = !!sessionMember;
  const isAdmin = session.role === UserRole.ADMIN;

  if (!isTeamMember && !isAdmin) {
    notFound();
  }

  return { team, teamRole: sessionMember?.role, session };
}

// Helper function to get filtered machine IDs based on user permissions
async function getFilteredMachineIds(
  teamSlug: string,
  selectedMachineId?: string,
) {
  const { team, teamRole, session } = await verifyTeamAccess(teamSlug);

  // Get user permissions to filter machines
  const userMachines = await prisma.userMachine.findMany({
    where: { userId: session.uid },
    select: { machineId: true },
  });

  const machines = await prisma.machine.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    },
    select: { id: true },
  });

  // Filter machines based on selection - if no specific machine selected, use all machines
  const filteredMachineIds = selectedMachineId
    ? [selectedMachineId]
    : machines.map((m) => m.id);

  // Verify the selected machine is accessible to the user
  if (selectedMachineId && !filteredMachineIds.includes(selectedMachineId)) {
    notFound();
  }

  return { team, filteredMachineIds };
}

// Get team and user permissions
export async function getTeamReportsPermissionsAction(teamSlug: string) {
  const { team, teamRole, session } = await verifyTeamAccess(teamSlug);

  const userMachines = await prisma.userMachine.findMany({
    where: { userId: session.uid },
    select: { machineId: true },
  });

  const machines = await prisma.machine.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      // Only show machines that the user is assigned to when they are a customer or operator
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      lastPingAt: true,
    },
  });

  return {
    team,
    teamRole,
    machines,
  };
}

// Get sales summary (optimized single query)
export async function getTeamSalesSummaryAction(
  teamSlug: string,
  searchParams: {
    from: string | undefined;
    to: string | undefined;
    machine: string | undefined;
  },
) {
  const { team, filteredMachineIds } = await getFilteredMachineIds(
    teamSlug,
    searchParams.machine,
  );
  const date = getDateRange(searchParams);

  // Single optimized query for sales summary
  const salesSummary = await prisma.$queryRaw<
    Array<{
      payment_method: string;
      total_amount: bigint | null;
      sale_count: bigint;
    }>
  >`
    SELECT 
      "paymentMethod" as payment_method,
      SUM("machineProductCost") as total_amount,
      COUNT(*) as sale_count
    FROM "sales"
    WHERE "machineId" = ANY(${filteredMachineIds})
      AND "createdAt" >= ${date.from}
      AND "createdAt" <= ${date.to}
    GROUP BY "paymentMethod"
  `;

  const cardSales = salesSummary.find(
    (s) => s.payment_method === PaymentMethod.CARD,
  ) || {
    total_amount: BigInt(0),
    sale_count: BigInt(0),
  };

  const cashSales = salesSummary.find(
    (s) => s.payment_method === PaymentMethod.CASH,
  ) || {
    total_amount: BigInt(0),
    sale_count: BigInt(0),
  };

  return {
    cardSales: {
      _sum: { machineProductCost: Number(cardSales.total_amount || 0) },
      _count: { id: Number(cardSales.sale_count) },
    },
    cashSales: {
      _sum: { machineProductCost: Number(cashSales.total_amount || 0) },
      _count: { id: Number(cashSales.sale_count) },
    },
    totalSales:
      Number(cardSales.total_amount || 0) + Number(cashSales.total_amount || 0),
    totalCount: Number(cardSales.sale_count) + Number(cashSales.sale_count),
  };
}

// Get sales chart data
export async function getTeamSalesChartAction(
  teamSlug: string,
  searchParams: {
    from: string | undefined;
    to: string | undefined;
    machine: string | undefined;
  },
) {
  const { team, filteredMachineIds } = await getFilteredMachineIds(
    teamSlug,
    searchParams.machine,
  );
  const date = getDateRange(searchParams);

  return await getSalesByDay({
    teamId: team.id,
    minDate: date.from,
    maxDate: date.to,
    machineIds: filteredMachineIds,
  });
}

// Get machines by sales
export async function getTeamMachinesBySalesAction(
  teamSlug: string,
  searchParams: {
    from: string | undefined;
    to: string | undefined;
    machine: string | undefined;
  },
) {
  const { team, filteredMachineIds } = await getFilteredMachineIds(
    teamSlug,
    searchParams.machine,
  );
  const date = getDateRange(searchParams);

  return await getMachinesBySales(
    team.id,
    date.from,
    date.to,
    filteredMachineIds,
  );
}

// Get products by sales
export async function getTeamProductsBySalesAction(
  teamSlug: string,
  searchParams: {
    from: string | undefined;
    to: string | undefined;
    machine: string | undefined;
  },
) {
  const { team, filteredMachineIds } = await getFilteredMachineIds(
    teamSlug,
    searchParams.machine,
  );
  const date = getDateRange(searchParams);

  return await getProductsBySales(
    team.id,
    date.from,
    date.to,
    filteredMachineIds,
  );
}
