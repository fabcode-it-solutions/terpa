import { env } from "@/lib/env";
import { z } from "zod";

const compareReportsResponseSchema = z.object({
  cashSales: z
    .array(
      z.object({
        product: z.string(),
        sales: z.number().min(0),
        price: z.number().min(0),
      }),
    )
    .default([]),
  digitalSales: z
    .array(
      z.object({
        product: z.string(),
        sales: z.number().min(0),
        price: z.number().min(0),
      }),
    )
    .default([]),
  freeSales: z
    .array(
      z.object({
        product: z.string(),
        sales: z.number().min(0),
        price: z.number().min(0),
      }),
    )
    .default([]),
  globalSales: z
    .array(
      z.object({
        product: z.string(),
        sales: z.number().min(0),
        price: z.number().min(0),
      }),
    )
    .default([]),
});

export async function compareReports(
  previousReportId: string,
  nextReportId: string,
) {
  const response = await fetch(`${env.TERPA_DEX_SERVICE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ previousReportId, nextReportId }),
  });

  if (!response.ok) {
    throw new Error("Failed to compare reports");
  }

  return compareReportsResponseSchema.parse(await response.json());
}

export async function getReportById(reportId: string) {
  const response = await fetch(
    `${env.TERPA_DEX_SERVICE_URL}/api/reports/${reportId}`,
  );

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    error?: boolean;
    success?: boolean;
    report?: {
      id: string;
      data: string;
      machineSerial: string;
    };
  };

  return json;
}

export async function getParsedReportById(reportId: string) {
  const response = await fetch(
    `${env.TERPA_DEX_SERVICE_URL}/api/reports/${reportId}/parsed`,
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    success?: boolean;
    report: {
      system: {
        reads: number;
      };
      cash: {
        cashIn: number;
        cashToTubes: number;
      };
    };
  };
}
