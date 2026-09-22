import { useQuery } from "@tanstack/react-query";
import { teamInfoRepo } from "@/services/repositories/teamInfo";
import { TeamInfo } from "@/services/api/schemas";

const keys = {
  base: ["teamInfo"] as const,
  team: (teamId: string) => ["teamInfo", teamId] as const,
};

export function useTeamInfo(teamId: string | null) {
  return useQuery<TeamInfo>({
    queryKey: teamId ? keys.team(teamId) : keys.base,
    queryFn: () => teamInfoRepo.get(teamId as string),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes - team info doesn't change often
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}
