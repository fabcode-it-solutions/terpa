import { useQuery } from "@tanstack/react-query";
import { teamsRepo } from "@/services/repositories/teams";
import type { Team } from "@/services/api/schemas";

const keys = {
  all: ["teams"] as const,
};

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: keys.all,
    queryFn: () => teamsRepo.list(),
  });
}
