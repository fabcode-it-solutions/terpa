import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import { add } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

type DailySalesBreakdown = {
  card: number;
  cash: number;
  free: number;
  remote: number;
};

export async function getSalesByDay(params: {
  teamId: string;
  minDate: Date;
  maxDate: Date;
  machineIds: string[];
}) {
  const timezone = "America/Monterrey";
  const days: Record<string, DailySalesBreakdown> = {};

  let currentDate = params.minDate;
  while (currentDate <= params.maxDate) {
    days[formatInTimeZone(currentDate, timezone, "dd-MM-yyyy")] = {
      card: 0,
      cash: 0,
      free: 0,
      remote: 0,
    };
    currentDate = add(currentDate, { days: 1 });
  }

  const sales = await prisma.sale.findMany({
    where: {
      machine: { teamId: params.teamId, id: { in: params.machineIds } },
      createdAt: { gte: params.minDate, lt: params.maxDate },
    },
    select: { createdAt: true, machineProductCost: true, paymentMethod: true },
  });

  sales.forEach((sale) => {
    const date = formatInTimeZone(sale.createdAt, timezone, "dd-MM-yyyy");

    if (!sale.paymentMethod) {
      console.warn(`Sale with null paymentMethod found for date ${date}`);
      return;
    }

    const cost = sale.machineProductCost;
    if (typeof cost !== "number" || cost < 0) {
      console.warn(
        `Invalid machineProductCost ${cost} for sale on date ${date}`,
      );
      return;
    }

    const amount = cost / 100;

    if (!days[date]) {
      console.warn(
        `Sale date ${date} falls outside expected range, initializing entry`,
      );
      days[date] = { card: 0, cash: 0, free: 0, remote: 0 };
    }

    switch (sale.paymentMethod) {
      case "CARD":
        days[date].card += amount;
        break;
      case "CASH":
        days[date].cash += amount;
        break;
      case "FREE":
        days[date].free += amount;
        break;
      case "REMOTE":
        days[date].remote += amount;
        break;
      default:
        console.warn(
          `Unknown paymentMethod: ${sale.paymentMethod} for date ${date}`,
        );
        break;
    }
  });

  const daysArray = Object.entries(days).map(([date, breakdown]) => ({
    date,
    ...breakdown,
  }));

  return daysArray;
}

export async function getMachinesBySales(
  teamId: string,
  minDate: Date,
  maxDate: Date,
  machineIds: string[],
) {
  if (machineIds.length === 0) return [];

  const results = await prisma.$queryRaw`
    SELECT
      m.id,
      m.name,
      m."lastPingAt",
      SUM(s."machineProductCost") AS total_sales_value
    FROM
      machines m
      JOIN sales s ON m.id = s."machineId"
      JOIN teams t ON m."teamId" = t.id
    WHERE
      t.id = ${teamId}
      AND m.id IN (${Prisma.join(machineIds)})
      AND m."deletedAt" IS NULL
      AND s."createdAt" >= ${minDate}
      AND s."createdAt" < ${maxDate}
    GROUP BY
      m.id,
      m.name,
      m."lastPingAt"
    ORDER BY
      total_sales_value DESC;
  `;

  return results as Array<{
    id: string;
    name: string;
    total_sales_value: number;
    lastPingAt: Date;
  }>;
}

export async function getProductsBySales(
  teamId: string,
  minDate: Date,
  maxDate: Date,
  machineIds: string[],
) {
  if (machineIds.length === 0) return [];

  const result = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      COUNT(s.id) AS sales_count,
      SUM(s."machineProductCost") AS total_sales_value,
      pi."fileUrl" as image_url
    FROM
      products p
    JOIN
      sales s ON p.id = s."productId"
    JOIN
      teams t ON p."teamId" = t.id
    LEFT JOIN (
      SELECT DISTINCT ON ("productId") "productId", "fileUrl"
      FROM "product_images"
      WHERE "deletedAt" IS NULL
      ORDER BY "productId", "position" ASC
    ) pi ON p.id = pi."productId"
    WHERE
      t.id = ${teamId}
      AND s."createdAt" >= ${minDate}
      AND s."createdAt" < ${maxDate}
      AND s."machineId" IN (${Prisma.join(machineIds)})
    GROUP BY
      p.id, p.name, pi."fileUrl"
    ORDER BY
      sales_count DESC;
  `;

  return (
    result as Array<{
      id: string;
      name: string;
      sales_count: number;
      total_sales_value: number;
      image_url: string | null;
    }>
  ).map((item) => ({
    ...item,
    image_url: item.image_url ? getCdnUrl(item.image_url) : null,
  }));
}
