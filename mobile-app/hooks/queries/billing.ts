import { useQuery } from "@tanstack/react-query";
import {
  billingRepo,
  BillingSummaryResponse,
  BillingListingResponse,
} from "@/services/repositories/billing";

const keys = {
  summary: (teamId: string, year?: number, month?: number, status?: string) =>
    ["billing", "summary", teamId, String(year ?? ""), String(month ?? ""), status ?? ""] as const,
  listing: (teamId: string, page?: number, year?: number, month?: number, status?: string) =>
    [
      "billing",
      "listing",
      teamId,
      String(page ?? 1),
      String(year ?? ""),
      String(month ?? ""),
      status ?? "",
    ] as const,
};

export function useBillingSummary(
  teamId?: string,
  params?: { year?: number; month?: number; status?: string },
) {
  return useQuery<BillingSummaryResponse>({
    queryKey: teamId
      ? keys.summary(teamId, params?.year, params?.month, params?.status)
      : ["billing", "summary"],
    queryFn: () => billingRepo.summary(teamId as string, params),
    enabled: !!teamId,
  });
}

export function useBillingListing(
  teamId?: string,
  params?: { page?: number; limit?: number; year?: number; month?: number; status?: string },
) {
  return useQuery<BillingListingResponse>({
    queryKey: teamId
      ? keys.listing(teamId, params?.page, params?.year, params?.month, params?.status)
      : ["billing", "listing"],
    queryFn: () => billingRepo.listing(teamId as string, params),
    enabled: !!teamId,
  });
}
