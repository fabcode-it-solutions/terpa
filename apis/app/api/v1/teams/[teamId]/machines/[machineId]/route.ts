import { getMachineIdFromUrl, handleTeamProtectedRoute } from "@/helpers/api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { add, endOfDay, format, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { getMachineOnlineStatus } from "@/lib/utils";
import { isAfter } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; machineId: string }> },
) {
  const { teamId, machineId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    // user is authed and has access to the team ✅
    const machineId = getMachineIdFromUrl(req);
    const timezone = "America/Monterrey";

    const machine = await prisma.machine.findUnique({
      where: { id: machineId, teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        terminalSerialNumber: true,
        pharosTerminalCode: true,
        lastPingAt: true,
        activeUntilDate: true,
        isEnabled: true,
        machineModel: true,
        machineVersion: true,
        machineSerial: true,
        tubesTotal: true,
        remoteSaleEnabledUntil: true,
        protocol: true,
        versionCode: true,
        type: true,
        team: { select: { name: true, slug: true, isArchived: true } },
      },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const now = new Date();
    const zoned = toZonedTime(now, timezone);
    const gte = fromZonedTime(startOfDay(zoned), timezone);
    const lte = fromZonedTime(endOfDay(zoned), timezone);

    const spirals = await prisma.machineSpiral.aggregate({
      where: { machineId: machine.id, deletedAt: null },
      _sum: { currentCount: true, maxCapacity: true },
    });

    const salesTodayAgg = await prisma.sale.aggregate({
      where: { machineId: machine.id, createdAt: { gte, lte } },
      _sum: { machineProductCost: true },
    });

    const latestSales = await prisma.sale.findMany({
      select: {
        id: true,
        machineProductCost: true,
        machineProductId: true,
        machineMdbProductId: true,
        createdAt: true,
        product: { select: { id: true, name: true } },
      },
      where: { machineId: machine.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const maxDate = new Date();
    const minDate = add(maxDate, { days: -30 });

    const topProductsData = await prisma.sale.groupBy({
      by: ["productId"],
      where: {
        machineId: machine.id,
        createdAt: {
          gte: minDate,
          lte: maxDate,
        },
        productId: { not: null },
      },
      _count: { id: true },
      _sum: { machineProductCost: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });

    const productIds = topProductsData
      .map((item) => item.productId)
      .filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const topProducts = topProductsData.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: item.productId!,
        name: product?.name || "Unknown Product",
        sales_count: item._count.id,
        total_sales_value: item._sum.machineProductCost || 0,
      };
    });

    const today = toZonedTime(now, timezone);
    const startDate = add(today, { days: -29 });
    const todayUtc = fromZonedTime(today, timezone);
    const startDateUtc = fromZonedTime(startDate, timezone);

    const salesData = await prisma.sale.findMany({
      where: {
        machineId: machine.id,
        createdAt: {
          gte: startDateUtc,
          lte: todayUtc,
        },
      },
      select: {
        createdAt: true,
        paymentMethod: true,
        machineProductCost: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const days: Record<
      string,
      { card: number; cash: number; free: number; remote: number }
    > = {};
    let currentDate = startDate;
    while (currentDate <= today) {
      const dateStr = format(currentDate, "dd/MM/yyyy");
      days[dateStr] = { card: 0, cash: 0, free: 0, remote: 0 };
      currentDate = add(currentDate, { days: 1 });
    }
    salesData.forEach((sale) => {
      const saleDate = toZonedTime(sale.createdAt, timezone);
      const dateStr = format(saleDate, "dd/MM/yyyy");
      const amount = Number(sale.machineProductCost) / 100;

      if (days[dateStr]) {
        switch (sale.paymentMethod) {
          case "CARD":
            days[dateStr].card += amount;
            break;
          case "CASH":
            days[dateStr].cash += amount;
            break;
          case "FREE":
            days[dateStr].free += amount;
            break;
          case "REMOTE":
            days[dateStr].remote += amount;
            break;
        }
      }
    });
    const salesByDay = Object.entries(days).map(([date, breakdown]) => ({
      date,
      ...breakdown,
      total:
        breakdown.card + breakdown.cash + breakdown.free + breakdown.remote,
    }));

    const inventoryPercent =
      spirals?._sum?.currentCount && spirals?._sum?.maxCapacity
        ? Math.round(
            (spirals._sum.currentCount / spirals._sum.maxCapacity) * 100,
          )
        : 0;
    const status = getMachineOnlineStatus(machine.lastPingAt);
    const subscriptionExpired = isAfter(zoned, machine.activeUntilDate);
    const salesToday = salesTodayAgg._sum.machineProductCost || 0;

    const serialize = (val: any) =>
      typeof val === "bigint" ? Number(val) : val;

    return NextResponse.json({
      machine: {
        ...machine,
        status,
        subscriptionExpired,
        inventoryPercent,
        salesToday: serialize(salesToday),
        currentChange: serialize(machine.tubesTotal),
      },
      latestSales: latestSales.map((s) => ({
        ...s,
        machineProductCost: serialize(s.machineProductCost),
        createdAtFormatted: formatInTimeZone(
          s.createdAt,
          timezone,
          "dd/MM/yyyy hh:mm:ss a",
        ),
      })),
      salesByDay,
      topProducts: topProducts.map((p) => ({
        ...p,
        sales_count: serialize(p.sales_count),
        total_sales_value: serialize(p.total_sales_value),
      })),
    });
  });
}
