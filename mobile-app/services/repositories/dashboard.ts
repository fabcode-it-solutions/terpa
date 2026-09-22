import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

export type DashboardSummary = {
  totalSales?: number;
  totalSalesFormatted?: string;
  totalCount?: number;
  machineCount?: number;
  machineCounts?: { online?: number; warning?: number; offline?: number };
  paymentMethods?: {
    card?: { amount?: number; amountFormatted?: string; count?: number };
    cash?: { amount?: number; amountFormatted?: string; count?: number };
    free?: { amount?: number; amountFormatted?: string; count?: number };
    remote?: { amount?: number; amountFormatted?: string; count?: number };
  };
};

export type DashboardMachine = {
  id: string;
  name: string;
  total_sales_value?: number;
  totalSalesFormatted?: string;
  status?: string;
};
export type DashboardProduct = {
  id: string;
  name: string;
  sales_count?: number;
  total_sales_value?: number;
  totalSalesFormatted?: string;
  imageUrl?: string | null;
};

export type TeamDashboard = {
  team?: { id: string; name: string; slug?: string };
  summary?: DashboardSummary;
  sales?: Array<{ date: string; card?: number; cash?: number; free?: number; remote?: number }>;
  topMachines?: DashboardMachine[];
  topProducts?: DashboardProduct[];
  period?: { startDate: string; endDate: string };
};

export const dashboardRepo = {
  async get(
    teamId: string,
    opts?: { startTime?: string; endTime?: string },
  ): Promise<TeamDashboard> {
    let path = endpoints.teams.dashboard(teamId);
    if (opts?.startTime && opts?.endTime) {
      const q = new URLSearchParams({ startTime: opts.startTime, endTime: opts.endTime });
      path = `${path}?${q.toString()}`;
    }
    return apiClient.get<TeamDashboard>(path);
  },
  async reports(
    teamId: string,
    opts: { startTime: string; endTime: string; machineId?: string },
  ): Promise<TeamDashboard & { availableMachines?: Array<{ id: string; name: string }> }> {
    let path = endpoints.teams.dashboardReports(teamId);
    const q = new URLSearchParams({ startTime: opts.startTime, endTime: opts.endTime });
    if (opts.machineId) q.set("machineId", opts.machineId);
    path = `${path}?${q.toString()}`;
    return apiClient.get<
      TeamDashboard & { availableMachines?: Array<{ id: string; name: string }> }
    >(path);
  },
};
