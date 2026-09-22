import { env } from "@/lib/env";
import logger from "@/utils/logger";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";

/**
 * Pharos API URL
 */
const PHAROS_API_URL = "https://backoffice.pharospayments.com/api";

/**
 * Export pharos service
 */
export const pharos = {
  getTransactions,
};

type GetTransactionsParams = {
  merchantCode: string;
  terminalCode: string;
  dateUtc: Date;
};

/**
 * Get transactions from Pharos API
 */
async function getTransactions(params: GetTransactionsParams) {
  // Pharos uses America/Monterrey timezone for dates
  const timeZone = "America/Monterrey";
  const dateFormat = "dd/MM/yyyy";
  const startDate = format(toZonedTime(params.dateUtc, timeZone), dateFormat);
  const endDate = format(toZonedTime(params.dateUtc, timeZone), dateFormat);

  const searchParams = new URLSearchParams({
    merchant_id: params.merchantCode,
    terminal_id: params.terminalCode,
    date_from: startDate,
    date_to: endDate,
  });

  // url encode search params
  const encodedSearchParams = searchParams.toString();

  const endpoint = `${PHAROS_API_URL}/v2/transactions/by_filters`;
  const response = await fetch(`${endpoint}?${searchParams}`, {
    method: "GET",
    headers: { token: env.PHAROS_TOKEN },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({
      event: "pharos.getTransactions.error",
      endpoint,
      merchantCode: params.merchantCode,
      terminalCode: params.terminalCode,
      dateUtc: params.dateUtc.toISOString(),
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    return [];
  }

  logger.info({
    event: "pharos.getTransactions.success",
    endpoint,
    merchantCode: params.merchantCode,
    terminalCode: params.terminalCode,
    dateUtc: params.dateUtc.toISOString(),
  });
  const data = getTransactionsSchema.parse(await response.json());
  return data.transactions;
}

const getTransactionsSchema = z.object({
  transactions: z.array(
    z.object({
      id: z.number(),
      merchant: z.string(),
      merchant_id: z.number(),
      terminal_id: z.number(),
      card: z.string(),
      authorization_number: z.string(),
      amount: z.string(),
      card_type: z.union([z.string(), z.null()]),
      tip_amount: z.string(),
      date: z.string(),
      approved: z.boolean(),
      reversed: z.union([z.boolean(), z.null()]),
      stan: z.number(),
      transaction_type: z.string(),
      conciliated: z.boolean(),
      reference_number: z.string(),
      external_id: z.number(),
      paid: z.boolean(),
      card_brand: z.union([z.string(), z.null()]),
      card_issuer: z.union([z.string(), z.null()]),
      result_code: z.string(),
      chargeback: z.boolean(),
      country: z.union([z.string(), z.null()]),
      country_code: z.union([z.number(), z.null()]),
    }),
  ),
});
