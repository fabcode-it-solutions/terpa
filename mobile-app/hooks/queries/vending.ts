import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendingRepo } from "@/services/repositories/vending";
import {
  VendingMachine,
  VendingMachineUpdate,
  MachineListResponse,
  MachineOverviewResponse,
  MachineSalesResponse,
  MachineInventoryResponse,
  MachineTerminalResponse,
} from "@/services/api/schemas";

const keys = {
  all: ["machines"] as const,
  detail: (id: string) => ["machines", id] as const,
};

export function useMachines(teamId: string, params?: { status?: string; query?: string }) {
  return useQuery<MachineListResponse>({
    queryKey: [keys.all[0], teamId, params?.status ?? "", params?.query ?? ""],
    queryFn: () => vendingRepo.list(teamId, params),
    enabled: !!teamId,
  });
}

export function useMachine(teamId: string, id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => vendingRepo.getById(teamId, id),
    enabled: !!(id && teamId),
  });
}

export function useMachineOverview(teamId: string, id: string) {
  return useQuery<MachineOverviewResponse>({
    queryKey: [keys.detail(id)[0], id, "overview", teamId],
    queryFn: () => vendingRepo.overview(teamId, id),
    enabled: !!(id && teamId),
  });
}

export function useMachineSales(teamId: string, id: string, date?: string) {
  return useQuery<MachineSalesResponse>({
    queryKey: [keys.detail(id)[0], id, "sales", teamId, date ?? ""],
    queryFn: () => vendingRepo.sales(teamId, id, date),
    enabled: !!(id && teamId),
  });
}

export function useMachineInventory(teamId: string, id: string) {
  return useQuery<MachineInventoryResponse>({
    queryKey: [keys.detail(id)[0], id, "inventory", teamId],
    queryFn: () => vendingRepo.inventory(teamId, id),
    enabled: !!(id && teamId),
    refetchInterval: 10_000, // Poll every 10 seconds for real-time inventory updates
  });
}

export function useMachineTerminal(teamId: string, id: string, date?: string) {
  return useQuery<MachineTerminalResponse>({
    queryKey: [keys.detail(id)[0], id, "terminal", teamId, date ?? ""],
    queryFn: () => vendingRepo.terminal(teamId, id, date),
    enabled: !!(id && teamId),
  });
}

export function useUpdateMachine(teamId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: VendingMachineUpdate }) =>
      vendingRepo.update(teamId, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.all });
      await qc.cancelQueries({ queryKey: keys.detail(id) });

      const previousList = qc.getQueryData<VendingMachine[]>(keys.all);
      const previousDetail = qc.getQueryData<VendingMachine>(keys.detail(id));

      if (previousList) {
        qc.setQueryData<VendingMachine[]>(keys.all, (old) =>
          (old ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
        );
      }
      if (previousDetail) {
        qc.setQueryData<VendingMachine>(keys.detail(id), { ...previousDetail, ...patch });
      }

      return { previousList, previousDetail };
    },
    onError: (_err, { id }, ctx) => {
      if (!ctx) return;
      if (ctx.previousList) qc.setQueryData(keys.all, ctx.previousList);
      if (ctx.previousDetail) qc.setQueryData(keys.detail(id), ctx.previousDetail);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}
