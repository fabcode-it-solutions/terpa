import { handleTeamProtectedRoute } from "@/helpers/api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { endOfDay, isAfter, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getMachineOnlineStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") ?? undefined;
    const statusFilter = searchParams.get("status") ?? undefined;
    const timezone = "America/Monterrey";
    const now = new Date();
    const zoned = toZonedTime(now, timezone);
    const gte = fromZonedTime(startOfDay(zoned), timezone);
    const lte = fromZonedTime(endOfDay(zoned), timezone);

    const machines = await prisma.machine.findMany({
      where: {
        teamId,
        deletedAt: null,
        name: query
          ? {
              contains: query,
              mode: "insensitive",
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        terminalSerialNumber: true,
        pharosTerminalCode: true,
        lastPingAt: true,
        activeUntilDate: true,
        isEnabled: true,
        tubesTotal: true,
        type: true,
        spirals: {
          where: { deletedAt: null },
          select: { maxCapacity: true, currentCount: true },
        },
        sales: {
          where: { createdAt: { gte, lte } },
          select: { machineProductCost: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const counts = machines.reduce(
      (acc, m) => {
        if (m.lastPingAt) {
          const status = getMachineOnlineStatus(m.lastPingAt);
          if (status === "online") return { ...acc, online: acc.online + 1 };
          if (status === "warning") return { ...acc, warning: acc.warning + 1 };
          if (status === "offline" || status === "noData")
            return { ...acc, offline: acc.offline + 1 };
        }
        return acc;
      },
      { online: 0, warning: 0, offline: 0 },
    );

    const mappedAll = machines.map((m) => {
      const inv = m.spirals.reduce(
        (acc, s) => {
          acc.max += s.maxCapacity;
          acc.count += s.currentCount;
          return acc;
        },
        { max: 0, count: 0 },
      );
      const inventoryPercent = Math.round(
        ((inv.count || 0) * 100) / (inv.max || 1),
      );
      const salesToday = m.sales.reduce(
        (acc, s) => acc + s.machineProductCost,
        0,
      );
      return {
        id: m.id,
        name: m.name,
        terminalSerialNumber: m.terminalSerialNumber,
        pharosTerminalCode: m.pharosTerminalCode,
        lastPingAt: m.lastPingAt,
        activeUntilDate: m.activeUntilDate,
        subscriptionExpired: isAfter(zoned, m.activeUntilDate),
        isEnabled: m.isEnabled,
        tubesTotal: m.tubesTotal,
        currentChange: m.tubesTotal,
        type: m.type,
        status: getMachineOnlineStatus(m.lastPingAt),
        inventoryPercent,
        salesToday,
      };
    });

    const mapped = statusFilter
      ? mappedAll.filter(
          (m) => getMachineOnlineStatus(m.lastPingAt) === statusFilter,
        )
      : mappedAll;

    return NextResponse.json({
      counts: { total: machines.length, ...counts },
      machines: mapped,
    });
  });
}
