import { useQuery } from "@tanstack/react-query";
import { dashboardRepo, TeamDashboard } from "@/services/repositories/dashboard";

const keys = {
  base: ["dashboard"] as const,
  team: (teamId: string, start?: string, end?: string) =>
    ["dashboard", teamId, start ?? "", end ?? ""] as const,
  reports: (teamId: string, start: string, end: string, machineId?: string) =>
    ["dashboard", "reports", teamId, start, end, machineId ?? ""] as const,
};

export function useTeamDashboard(teamId?: string, opts?: { startTime?: string; endTime?: string }) {
  return useQuery<TeamDashboard>({
    queryKey: teamId ? keys.team(teamId, opts?.startTime, opts?.endTime) : keys.base,
    queryFn: () => dashboardRepo.get(teamId as string, opts),
    enabled: !!teamId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
  });
}

export function useTeamReports(
  teamId: string | undefined,
  opts: { startTime: string; endTime: string; machineId?: string },
) {
  const enabled = Boolean(teamId && opts.startTime && opts.endTime);
  return useQuery({
    queryKey: enabled
      ? keys.reports(teamId as string, opts.startTime, opts.endTime, opts.machineId)
      : keys.base,
    queryFn: () => dashboardRepo.reports(teamId as string, opts),
    enabled,
  });
}
