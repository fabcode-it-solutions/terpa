import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { TeamUsersResponse, TeamUsersResponseSchema } from "@/services/api/schemas";

export const usersRepo = {
  async list(teamId: string, opts?: { query?: string }): Promise<TeamUsersResponse> {
    let path = endpoints.teams.users(teamId);
    if (opts?.query) {
      const q = new URLSearchParams({ query: opts.query });
      path = `${path}?${q.toString()}`;
    }
    const data = await apiClient.get<unknown>(path);
    // Ensure we always return a stable shape
    const parsed = TeamUsersResponseSchema.safeParse(data);
    if (parsed.success) return parsed.data;
    // Some backends may directly return an array; normalize
    const members = Array.isArray((data as any)?.members)
      ? (data as any).members
      : Array.isArray(data)
        ? (data as any)
        : [];
    return TeamUsersResponseSchema.parse({ members });
  },
};
