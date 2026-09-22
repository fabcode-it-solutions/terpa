import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { Team, TeamListSchema } from "@/services/api/schemas";

export const teamsRepo = {
  async list(): Promise<Team[]> {
    const data = await apiClient.get<unknown>(endpoints.teams.list);
    // API returns { teams: [...] }
    const teams = (data as any)?.teams ?? data;
    return TeamListSchema.parse(teams);
  },
};
