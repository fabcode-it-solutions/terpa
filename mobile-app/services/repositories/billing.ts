import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

export type BillingSummaryResponse = {
  team?: { id: string; name: string; slug?: string };
  period?: { startDate: string; endDate: string };
  summary?: {
    machineCount?: number;
    totals?: { amount?: number; count?: number };
    statuses?: Record<string, number>;
  };
  machines?: {
    id: string;
    name: string;
    period?: string;
    status?: string;
    statusLabel?: string;
  }[];
};

export type BillingListingResponse = {
  team?: { id: string; name: string; slug?: string };
  invoices?: unknown[];
  summary?: unknown;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export const billingRepo = {
  async summary(
    teamId: string,
    params?: { year?: number; month?: number; status?: string },
  ): Promise<BillingSummaryResponse> {
    const base = endpoints.teams.billing(teamId);
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.month) search.set("month", String(params.month));
    if (params?.status) search.set("status", params.status);
    const path = search.toString() ? `${base}?${search.toString()}` : base;
    return apiClient.get<BillingSummaryResponse>(path);
  },
  async listing(
    teamId: string,
    params?: { page?: number; limit?: number; year?: number; month?: number; status?: string },
  ): Promise<BillingListingResponse> {
    // Use the payments endpoint which supports filtering by year/month/status
    const base = endpoints.teams.payments(teamId);
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.year) search.set("year", String(params.year));
    if (params?.month) search.set("month", String(params.month));
    if (params?.status) search.set("status", params.status);
    const path = search.toString() ? `${base}?${search.toString()}` : base;
    return apiClient.get<BillingListingResponse>(path);
  },
};
