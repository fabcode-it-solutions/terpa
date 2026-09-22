import { useMemo } from "react";

export type MachineRow = {
  id: string;
  name: string;
  inventory: number;
  status: "online" | "offline" | "intermittent";
  salesToday?: number;
  currentChange?: number;
};

export function useMachineListVM(args: { data?: any }) {
  const { data } = args;

  const machines: MachineRow[] = useMemo(() => {
    if (!data?.machines) return [];
    return data.machines.map((m: any) => ({
      id: m.id,
      name: m.name,
      inventory: m.inventoryPercent ?? 0,
      status: (m.status === "online" || m.status === "offline"
        ? m.status
        : "intermittent") as MachineRow["status"],
      salesToday: typeof (m as any)?.salesToday === "number" ? (m as any).salesToday : 0,
      currentChange: typeof (m as any)?.currentChange === "number" ? (m as any).currentChange : 0,
    }));
  }, [data?.machines]);

  return { machines } as const;
}
