import { useState, useMemo } from "react";

export type MachineStatus = "all" | "online" | "offline" | "warning" | "noData";

export interface MachineFilters {
  status: MachineStatus;
  query: string;
}

export function useMachineFilters() {
  const [status, setStatus] = useState<MachineStatus>("all");
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      query: query.trim() || undefined,
    }),
    [status, query],
  );

  const resetFilters = () => {
    setStatus("all");
    setQuery("");
  };

  return {
    status,
    query,
    filters,
    setStatus,
    setQuery,
    resetFilters,
  };
}
