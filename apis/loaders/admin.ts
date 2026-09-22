import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { add } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export async function getGlobalSalesByDay(params: {
  minDate: Date;
  maxDate: Date;
}) {
  const timezone = "America/Monterrey";

  // Raw SQL query for better performance - inspired by your SQL query structure
  const salesData = await prisma.$queryRaw<
    Array<{
      sale_date: string;
      payment_method: string;
      total_amount_cents: bigint;
    }>
  >`
    SELECT
      TO_CHAR(s."createdAt" AT TIME ZONE 'America/Monterrey', 'DD-MM-YYYY') as sale_date,
      s."paymentMethod" as payment_method,
      SUM(s."machineProductCost") as total_amount_cents
    FROM "sales" s
    WHERE s."createdAt" >= ${params.minDate}
      AND s."createdAt" <= ${params.maxDate}
      AND s."paymentMethod" IS NOT NULL
    GROUP BY
      TO_CHAR(s."createdAt" AT TIME ZONE 'America/Monterrey', 'DD-MM-YYYY'),
      s."paymentMethod"
    ORDER BY
      sale_date DESC,
      s."paymentMethod"
  `;

  // Initialize days map for the date range
  const days: Record<
    string,
    { card: number; cash: number; free: number; remote: number }
  > = {};

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

  // Process aggregated results from SQL query
  salesData.forEach((row) => {
    const date = row.sale_date;
    const amount = Number(row.total_amount_cents) / 100; // Convert bigint cents to dollars

    if (days[date]) {
      switch (row.payment_method) {
        case "CARD":
          days[date].card = amount;
          break;
        case "CASH":
          days[date].cash = amount;
          break;
        case "FREE":
          days[date].free = amount;
          break;
        case "REMOTE":
          days[date].remote = amount;
          break;
      }
    }
  });

  // Convert to array format for chart consumption
  const daysArray = Object.entries(days).map(([date, breakdown]) => ({
    date,
    ...breakdown,
  }));

  return daysArray;
}

export async function getTopTeamsBySaleCount(params: {
  minDate: Date;
  maxDate: Date;
}) {
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      slug: string;
      sales_count: bigint;
    }>
  >`
    SELECT
      t.id,
      t.name,
      t.slug,
      COUNT(s.id) AS sales_count
    FROM
      teams t
      JOIN machines m ON t.id = m."teamId"
      JOIN sales s ON m.id = s."machineId"
    WHERE
      s."createdAt" >= ${params.minDate}
      AND s."createdAt" <= ${params.maxDate}
      AND m."deletedAt" IS NULL
    GROUP BY
      t.id, t.name, t.slug
    ORDER BY
      sales_count DESC
    LIMIT 10
  `;

  return results.map((result) => ({
    id: result.id,
    name: result.name,
    slug: result.slug,
    sales_count: Number(result.sales_count),
  }));
}

export async function getTopTeamsBySaleVolume(params: {
  minDate: Date;
  maxDate: Date;
}) {
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      slug: string;
      total_sales_value: bigint;
    }>
  >`
    SELECT
      t.id,
      t.name,
      t.slug,
      SUM(s."machineProductCost") AS total_sales_value
    FROM
      teams t
      JOIN machines m ON t.id = m."teamId"
      JOIN sales s ON m.id = s."machineId"
    WHERE
      s."createdAt" >= ${params.minDate}
      AND s."createdAt" <= ${params.maxDate}
      AND m."deletedAt" IS NULL
    GROUP BY
      t.id, t.name, t.slug
    ORDER BY
      total_sales_value DESC
    LIMIT 10
  `;

  return results.map((result) => ({
    id: result.id,
    name: result.name,
    slug: result.slug,
    total_sales_value: Number(result.total_sales_value),
  }));
}

export async function getTopProductsBySaleVolume(params: {
  minDate: Date;
  maxDate: Date;
}) {
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      team_name: string;
      team_slug: string;
      total_sales_value: bigint;
      sales_count: bigint;
      image_url: string | null;
    }>
  >`
    SELECT
      p.id,
      p.name,
      t.name as team_name,
      t.slug as team_slug,
      SUM(s."machineProductCost") AS total_sales_value,
      COUNT(s.id) AS sales_count,
      pi."fileUrl" as image_url
    FROM
      products p
      JOIN teams t ON p."teamId" = t.id
      JOIN sales s ON p.id = s."productId"
      JOIN machines m ON s."machineId" = m.id
      LEFT JOIN (
        SELECT DISTINCT ON ("productId") "productId", "fileUrl"
        FROM "product_images"
        WHERE "deletedAt" IS NULL
        ORDER BY "productId", "position" ASC
      ) pi ON p.id = pi."productId"
    WHERE
      s."createdAt" >= ${params.minDate}
      AND s."createdAt" <= ${params.maxDate}
      AND p."deletedAt" IS NULL
      AND m."deletedAt" IS NULL
    GROUP BY
      p.id, p.name, t.name, t.slug, pi."fileUrl"
    ORDER BY
      total_sales_value DESC
    LIMIT 10
  `;

  return results.map((result) => ({
    id: result.id,
    name: result.name,
    team_name: result.team_name,
    team_slug: result.team_slug,
    total_sales_value: Number(result.total_sales_value),
    sales_count: Number(result.sales_count),
    image_url: result.image_url ? getCdnUrl(result.image_url) : null,
  }));
}
