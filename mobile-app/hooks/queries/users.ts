import { useQuery } from "@tanstack/react-query";
import { usersRepo } from "@/services/repositories/users";
import type { TeamUsersResponse } from "@/services/api/schemas";

const keys = {
  base: ["users"] as const,
  team: (teamId: string, query?: string) => ["users", teamId, query ?? ""] as const,
};

export function useTeamUsers(teamId?: string, opts?: { query?: string }) {
  const enabled = Boolean(teamId);
  return useQuery<TeamUsersResponse>({
    queryKey: enabled ? keys.team(teamId as string, opts?.query) : keys.base,
    queryFn: () => usersRepo.list(teamId as string, opts),
    enabled,
  });
}
