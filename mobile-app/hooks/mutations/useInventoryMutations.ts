import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { MachineInventoryResponse } from "@/services/api/schemas";

interface SpiralUpdateResponse {
  success: boolean;
  spiral: {
    id: string;
    currentCount: number;
    maxCapacity: number;
    percent: number;
    formattedCapacity: string;
  };
  error?: string;
}

interface UpdateInventoryDetailsPayload {
  machineCode: string | null;
  machineMdbCode: string | null;
  machineMicromarketCode?: string | null;
  productId: string;
  maxCapacity: number;
}

/**
 * Hook for incrementing a spiral's inventory count by 1
 * Uses race-condition-safe atomic increment endpoint
 */
export const useIncrementSpiral = (teamId: string, machineId: string, spiralId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post<SpiralUpdateResponse>(
        `/api/v1/teams/${teamId}/machines/${machineId}/inventory/spirals/${spiralId}/increment`,
      );
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["machines", machineId, "inventory", teamId],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<MachineInventoryResponse>([
        "machines",
        machineId,
        "inventory",
        teamId,
      ]);

      // Optimistically increment by 1
      queryClient.setQueryData<MachineInventoryResponse>(
        ["machines", machineId, "inventory", teamId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            inventory: old.inventory.map((item) =>
              item.id === spiralId
                ? {
                    ...item,
                    currentCount: item.currentCount + 1,
                    percent: Math.round(((item.currentCount + 1) / item.maxCapacity) * 100),
                  }
                : item,
            ),
          };
        },
      );

      return { previousData };
    },
    onSuccess: () => {
      // Refetch after successful mutation to get server truth
      void queryClient.invalidateQueries({
        queryKey: ["machines", machineId, "inventory", teamId],
      });
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["machines", machineId, "inventory", teamId],
          context.previousData,
        );
      }
      console.error("[API] Error incrementing spiral:", err);
    },
  });
};

/**
 * Hook for decrementing a spiral's inventory count by 1
 * Uses race-condition-safe atomic decrement endpoint
 */
export const useDecrementSpiral = (teamId: string, machineId: string, spiralId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post<SpiralUpdateResponse>(
        `/api/v1/teams/${teamId}/machines/${machineId}/inventory/spirals/${spiralId}/decrement`,
      );
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["machines", machineId, "inventory", teamId],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<MachineInventoryResponse>([
        "machines",
        machineId,
        "inventory",
        teamId,
      ]);

      // Optimistically decrement by 1
      queryClient.setQueryData<MachineInventoryResponse>(
        ["machines", machineId, "inventory", teamId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            inventory: old.inventory.map((item) =>
              item.id === spiralId
                ? {
                    ...item,
                    currentCount: item.currentCount - 1,
                    percent: Math.round(((item.currentCount - 1) / item.maxCapacity) * 100),
                  }
                : item,
            ),
          };
        },
      );

      return { previousData };
    },
    onSuccess: () => {
      // Refetch after successful mutation to get server truth
      void queryClient.invalidateQueries({
        queryKey: ["machines", machineId, "inventory", teamId],
      });
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["machines", machineId, "inventory", teamId],
          context.previousData,
        );
      }
      console.error("[API] Error decrementing spiral:", err);
    },
  });
};

/**
 * Hook for updating full inventory item details (DEX, MDB, product, capacity)
 * Uses PATCH endpoint with optimistic updates
 */
export const useUpdateInventoryDetails = (teamId: string, machineId: string, itemId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateInventoryDetailsPayload) => {
      return apiClient.patch<SpiralUpdateResponse>(
        endpoints.teams.spiralUpdate(teamId, machineId, itemId),
        payload,
      );
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["machines", machineId, "inventory", teamId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<MachineInventoryResponse>([
        "machines",
        machineId,
        "inventory",
        teamId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<MachineInventoryResponse>(
        ["machines", machineId, "inventory", teamId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            inventory: old.inventory.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    machineCode: payload.machineCode,
                    machineMdbCode: payload.machineMdbCode,
                    machineMicromarketCode: payload.machineMicromarketCode ?? null,
                    maxCapacity: payload.maxCapacity,
                    percent: Math.round((item.currentCount / payload.maxCapacity) * 100),
                  }
                : item,
            ),
          };
        },
      );

      // Return context with snapshot
      return { previousData };
    },
    onSuccess: () => {
      // Refetch after successful mutation to get server truth
      void queryClient.invalidateQueries({
        queryKey: ["machines", machineId, "inventory", teamId],
      });
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["machines", machineId, "inventory", teamId],
          context.previousData,
        );
      }
      console.error("[API] Error updating inventory details:", err);
    },
  });
};
