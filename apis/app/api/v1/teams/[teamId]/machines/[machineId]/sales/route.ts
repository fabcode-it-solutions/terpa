import { getMachineIdFromUrl, handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { endOfDay, format, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; machineId: string }> },
) {
  const { teamId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    const machineId = getMachineIdFromUrl(req);

    const machine = await prisma.machine.findUnique({
      where: { id: machineId, teamId },
      select: { id: true },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const timezone = "America/Monterrey";

    const date = dateParam
      ? fromZonedTime(dateParam, timezone)
      : fromZonedTime(startOfDay(toZonedTime(new Date(), timezone)), timezone);

    const start = startOfDay(toZonedTime(date, timezone));
    const end = endOfDay(toZonedTime(date, timezone));
    const originalDate = date;

    const sales = await prisma.sale.findMany({
      where: {
        machineId: machine.id,
        createdAt: {
          gte: fromZonedTime(start, timezone),
          lte: fromZonedTime(end, timezone),
        },
      },
      select: {
        id: true,
        createdAt: true,
        machineProductCost: true,
        paymentMethod: true,
        type: true,
        machineProductId: true,
        machineMdbProductId: true,
        productId: true,
        productName: true,
        productSku: true,
        productPriceCents: true,
        taecelTransactionId: true,
        token: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalSales = sales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const showPaymentMethod = sales.some((sale) => sale.paymentMethod !== null);

    const cardSales = sales.filter((sale) => sale.paymentMethod === "CARD");
    const cashSales = sales.filter((sale) => sale.paymentMethod === "CASH");
    const remoteSales = sales.filter((sale) => sale.paymentMethod === "REMOTE");
    const freeSales = sales.filter((sale) => sale.paymentMethod === "FREE");

    const cardSalesTotal = cardSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const cashSalesTotal = cashSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const remoteSalesTotal = remoteSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const freeSalesTotal = freeSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );

    const cardProductSales = cardSales.filter(
      (sale) => sale.type === "PRODUCT",
    );
    const cardServiceSales = cardSales.filter(
      (sale) => sale.type === "SERVICE",
    );
    const cardRechargeSales = cardSales.filter(
      (sale) => sale.type === "PHONE_RECHARGE",
    );

    const cardProductSalesTotal = cardProductSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const cardServiceSalesTotal = cardServiceSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );
    const cardRechargeSalesTotal = cardRechargeSales.reduce(
      (acc, sale) => acc + sale.machineProductCost,
      0,
    );

    return NextResponse.json({
      date: format(originalDate, "PPPP", { locale: es }),
      showPaymentMethod,
      summary: {
        totalSales: {
          valueCents: totalSales,
          valueFormatted: formatCurrency(totalSales),
        },
        totalCount: sales.length,
        byPaymentMethod: {
          card: {
            count: cardSales.length,
            total: {
              valueCents: cardSalesTotal,
              valueFormatted: formatCurrency(cardSalesTotal),
            },
            breakdown: {
              products:
                cardProductSalesTotal > 0
                  ? {
                      valueCents: cardProductSalesTotal,
                      valueFormatted: formatCurrency(cardProductSalesTotal),
                    }
                  : null,
              services:
                cardServiceSalesTotal > 0
                  ? {
                      valueCents: cardServiceSalesTotal,
                      valueFormatted: formatCurrency(cardServiceSalesTotal),
                    }
                  : null,
              recharges:
                cardRechargeSalesTotal > 0
                  ? {
                      valueCents: cardRechargeSalesTotal,
                      valueFormatted: formatCurrency(cardRechargeSalesTotal),
                    }
                  : null,
            },
          },
          cash: {
            count: cashSales.length,
            total: {
              valueCents: cashSalesTotal,
              valueFormatted: formatCurrency(cashSalesTotal),
            },
          },
          remote:
            remoteSalesTotal > 0
              ? {
                  count: remoteSales.length,
                  total: {
                    valueCents: remoteSalesTotal,
                    valueFormatted: formatCurrency(remoteSalesTotal),
                  },
                }
              : null,
          free:
            freeSalesTotal > 0
              ? {
                  count: freeSales.length,
                  total: {
                    valueCents: freeSalesTotal,
                    valueFormatted: formatCurrency(freeSalesTotal),
                  },
                }
              : null,
        },
      },
      sales: sales.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        createdAtFormatted: formatInTimeZone(
          s.createdAt,
          timezone,
          "dd/MM/yyyy hh:mm:ss a",
        ),
        amount: {
          valueCents: s.machineProductCost,
          valueFormatted: formatCurrency(s.machineProductCost || 0),
        },
        paymentMethod: s.paymentMethod,
        type: s.type,
        machineProductId: s.machineProductId,
        machineMdbProductId: s.machineMdbProductId,
        taecelTransactionId: s.taecelTransactionId,
        token: s.token,
        product: s.productId
          ? {
              id: s.productId,
              name: s.productName,
              sku: s.productSku,
              price:
                s.productPriceCents != null
                  ? {
                      valueCents: s.productPriceCents,
                      valueFormatted: formatCurrency(s.productPriceCents),
                    }
                  : null,
            }
          : null,
      })),
    });
  });
}
