import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import {
  getSalesByDay,
  getMachinesBySales,
  getProductsBySales,
} from "@/loaders/dashboard";
import { getCdnUrl } from "@/lib/s3";
import { verifyUserToken } from "@/service/authentication";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";
import { PaymentMethod, TeamMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  const teamId = params.teamId;

  try {
    const { searchParams } = new URL(request.url);

    const startTimeParam = searchParams.get("startTime");
    const endTimeParam = searchParams.get("endTime");
    const machineIdParam = searchParams.get("machineId");

    if (!startTimeParam || !endTimeParam) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 },
      );
    }

    const startTime = new Date(startTimeParam);
    const endTime = new Date(endTimeParam);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    if (startTime > endTime) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 },
      );
    }

    const timezone = "America/Monterrey";

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            role: true,
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    let token: string | undefined;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    if (!token) {
      const cookieStore = cookies();
      const cookie = cookieStore.get(SESSION_COOKIE_NAME);
      token = cookie?.value;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const session = verifyUserToken(token);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const teamRole = team.members.find((m) => m.user.id === session.uid)?.role;

    const userMachines = await prisma.userMachine.findMany({
      where: { userId: session.uid },
      select: { machineId: true },
    });

    const machineFilter: any = {
      teamId: team.id,
      deletedAt: null,
      activeUntilDate: { gte: new Date() },
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    };

    if (machineIdParam) {
      machineFilter.id = machineIdParam;
    }

    const machines = await prisma.machine.findMany({
      where: machineFilter,
      select: {
        id: true,
        name: true,
        lastPingAt: true,
      },
    });

    const machineIds = machines.map((m) => m.id);

    if (machineIds.length === 0) {
      return NextResponse.json({
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
        },
        period: {
          startDate: startTime,
          endDate: endTime,
          formattedPeriod: `Del ${format(startTime, "EEEE d° 'de' MMMM 'del' yyyy", { locale: es })} al ${format(endTime, "EEEE d° 'de' MMMM 'del' yyyy", { locale: es })}`,
        },
        summary: {
          totalSales: 0,
          totalSalesFormatted: formatCurrency(0),
          totalCount: 0,
          paymentMethods: {
            card: { amount: 0, amountFormatted: formatCurrency(0), count: 0 },
            cash: { amount: 0, amountFormatted: formatCurrency(0), count: 0 },
            free: { amount: 0, amountFormatted: formatCurrency(0), count: 0 },
            remote: { amount: 0, amountFormatted: formatCurrency(0), count: 0 },
          },
        },
        sales: [],
        topMachines: [],
        topProducts: [],
        availableMachines: [],
      });
    }

    const sales = await getSalesByDay({
      teamId: team.id,
      minDate: startTime,
      maxDate: endTime,
      machineIds: machineIds,
    });

    const machinesBySales = await getMachinesBySales(
      team.id,
      startTime,
      endTime,
      machineIds,
    );

    const productsBySales = await getProductsBySales(
      team.id,
      startTime,
      endTime,
      machineIds,
    );

    const productImages = await prisma.product.findMany({
      where: {
        id: { in: productsBySales.map((p) => p.id) },
        deletedAt: null,
      },
      select: {
        id: true,
        productImages: {
          where: { deletedAt: null },
          select: { fileUrl: true },
          orderBy: { position: "asc" },
          take: 1,
        },
      },
    });

    const productImageMap = new Map(
      productImages.map((p) => [p.id, p.productImages[0]?.fileUrl]),
    );

    const productsWithImages = productsBySales.map((product) => {
      const imageKey = productImageMap.get(product.id);
      return {
        ...product,
        imageUrl: imageKey ? getCdnUrl(imageKey) : undefined,
      };
    });

    const cardSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.CARD,
        machine: { teamId: team.id, id: { in: machineIds } },
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const cashSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.CASH,
        machine: { teamId: team.id, id: { in: machineIds } },
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const freeSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.FREE,
        machine: { teamId: team.id, id: { in: machineIds } },
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const remoteSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.REMOTE,
        machine: { teamId: team.id, id: { in: machineIds } },
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
    });

    const totalSales =
      (cardSales._sum.machineProductCost ?? 0) +
      (cashSales._sum.machineProductCost ?? 0) +
      (freeSales._sum.machineProductCost ?? 0) +
      (remoteSales._sum.machineProductCost ?? 0);
    const totalCount =
      cardSales._count.id +
      cashSales._count.id +
      freeSales._count.id +
      remoteSales._count.id;

    const availableMachines = await prisma.machine.findMany({
      where: {
        teamId: team.id,
        deletedAt: null,
        activeUntilDate: { gte: new Date() },
        ...(teamRole === TeamMemberRole.OPERATOR
          ? { id: { in: userMachines.map((um) => um.machineId) } }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
      period: {
        startDate: startTime,
        endDate: endTime,
        formattedPeriod: `Del ${format(startTime, "EEEE d° 'de' MMMM 'del' yyyy", { locale: es })} al ${format(endTime, "EEEE d° 'de' MMMM 'del' yyyy", { locale: es })}`,
      },
      summary: {
        totalSales,
        totalSalesFormatted: formatCurrency(totalSales),
        totalCount,
        paymentMethods: {
          card: {
            amount: cardSales._sum.machineProductCost ?? 0,
            amountFormatted: formatCurrency(
              cardSales._sum.machineProductCost ?? 0,
            ),
            count: cardSales._count.id,
          },
          cash: {
            amount: cashSales._sum.machineProductCost ?? 0,
            amountFormatted: formatCurrency(
              cashSales._sum.machineProductCost ?? 0,
            ),
            count: cashSales._count.id,
          },
          free: {
            amount: freeSales._sum.machineProductCost ?? 0,
            amountFormatted: formatCurrency(
              freeSales._sum.machineProductCost ?? 0,
            ),
            count: freeSales._count.id,
          },
          remote: {
            amount: remoteSales._sum.machineProductCost ?? 0,
            amountFormatted: formatCurrency(
              remoteSales._sum.machineProductCost ?? 0,
            ),
            count: remoteSales._count.id,
          },
        },
      },
      sales: sales.map((sale) => ({
        date:
          typeof sale.date === "string"
            ? sale.date
            : format(sale.date, "dd-MM-yyyy"),
        card: Number(sale.card),
        cash: Number(sale.cash),
        free: Number(sale.free),
        remote: Number(sale.remote),
      })),
      topMachines: machinesBySales.slice(0, 10).map((machine) => ({
        ...machine,
        total_sales_value: Number(machine.total_sales_value ?? 0),
        totalSalesFormatted: formatCurrency(
          Number(machine.total_sales_value ?? 0),
        ),
      })),
      topProducts: productsWithImages.slice(0, 10).map((product) => ({
        ...product,
        sales_count: Number(product.sales_count ?? 0),
        total_sales_value: Number(product.total_sales_value ?? 0),
        totalSalesFormatted: formatCurrency(
          Number(product.total_sales_value ?? 0),
        ),
      })),
      availableMachines,
    });
  } catch (error) {
    console.error("Error fetching team dashboard reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
