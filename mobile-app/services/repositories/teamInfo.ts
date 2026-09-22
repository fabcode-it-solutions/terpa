import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { TeamInfo, TeamInfoSchema } from "@/services/api/schemas";

export const teamInfoRepo = {
  async get(teamId: string): Promise<TeamInfo> {
    const response = await apiClient.get<TeamInfo>(endpoints.teams.info(teamId));
    return TeamInfoSchema.parse(response);
  },
};
