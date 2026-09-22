import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import {
  VendingMachine,
  VendingMachineSchema,
  VendingMachineUpdate,
  MachineListResponse,
  MachineListResponseSchema,
  MachineOverviewResponse,
  MachineOverviewResponseSchema,
  MachineSalesResponse,
  MachineSalesResponseSchema,
  MachineInventoryResponse,
  MachineInventoryResponseSchema,
  MachineTerminalResponse,
  MachineTerminalResponseSchema,
} from "@/services/api/schemas";

export const vendingRepo = {
  async list(
    teamId: string,
    params?: { status?: string; query?: string },
  ): Promise<MachineListResponse> {
    let path = endpoints.teams.machines(teamId);
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    if (searchParams.toString()) {
      path += `?${searchParams.toString()}`;
    }
    const data = await apiClient.get<unknown>(path);
    return MachineListResponseSchema.parse(data);
  },

  async getById(teamId: string, id: string): Promise<VendingMachine> {
    const data = await apiClient.get<unknown>(endpoints.teams.machineById(teamId, id));
    const machine = (data as any)?.machine ?? data;
    return VendingMachineSchema.parse(machine);
  },

  async overview(teamId: string, id: string): Promise<MachineOverviewResponse> {
    const data = await apiClient.get<unknown>(endpoints.teams.machineById(teamId, id));
    return MachineOverviewResponseSchema.parse(data);
  },

  async sales(teamId: string, id: string, date?: string): Promise<MachineSalesResponse> {
    let path = endpoints.teams.machineSales(teamId, id);
    if (date) {
      const sp = new URLSearchParams();
      sp.set("date", date);
      path += `?${sp.toString()}`;
    }
    const data = await apiClient.get<unknown>(path);
    return MachineSalesResponseSchema.parse(data);
  },

  async inventory(teamId: string, id: string): Promise<MachineInventoryResponse> {
    const data = await apiClient.get<unknown>(endpoints.teams.machineInventory(teamId, id));
    try {
      return MachineInventoryResponseSchema.parse(data);
    } catch (e) {
      console.error("Inventory parse error:", e, data);
      throw e;
    }
  },

  async terminal(teamId: string, id: string, date?: string): Promise<MachineTerminalResponse> {
    let path = endpoints.teams.machineTerminal(teamId, id);
    if (date) {
      const sp = new URLSearchParams();
      sp.set("date", date);
      path += `?${sp.toString()}`;
    }
    const data = await apiClient.get<unknown>(path);
    try {
      return MachineTerminalResponseSchema.parse(data);
    } catch (e) {
      console.error("Terminal parse error:", e, data);
      throw e;
    }
  },

  // Update endpoint not present in collection; keep for future compatibility if added
  async update(teamId: string, id: string, patch: VendingMachineUpdate): Promise<VendingMachine> {
    const data = await apiClient.patch<unknown>(endpoints.teams.machineById(teamId, id), patch);
    const machine = (data as any)?.machine ?? data;
    return VendingMachineSchema.parse(machine);
  },
};
