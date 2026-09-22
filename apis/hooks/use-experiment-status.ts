"use client";

import { getExperimentStatusAction } from "@/actions/experiment";
import { useQuery } from "@tanstack/react-query";

export function useExperimentStatus(experimentKey: string, teamSlug: string) {
  return useQuery({
    queryKey: ["experiment-status", experimentKey, teamSlug],
    queryFn: async () => {
      const result = await getExperimentStatusAction(experimentKey, teamSlug);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch experiment status");
      }
      return result.isActive;
    },
    enabled: !!experimentKey && !!teamSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
