"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type BaseMachine = {
  id: string;
  name: string;
};

type AdminMachine = BaseMachine & {
  terminalSerialNumber: string | null;
  team: {
    name: string;
  };
};

type ReportsMachine = BaseMachine & {
  lastPingAt?: Date | null;
};

type Machine = AdminMachine | ReportsMachine;

type Props = {
  machines: Machine[];
  multiSelect?: boolean;
  className?: string;
  paramName?: string;
};

export function MachineFilter({
  machines,
  multiSelect = false,
  className = "",
  paramName = "machine",
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // For single select mode
  const selectedMachineId = searchParams.get(paramName);
  const selectedMachine = machines.find(
    (machine) => machine.id === selectedMachineId,
  );

  // For multi-select mode
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

  // Initialize selected machine IDs from URL params
  useEffect(() => {
    if (multiSelect) {
      const params = searchParams.getAll(paramName);
      // If no machines are selected in the URL, select all by default
      setSelectedMachineIds(
        params.length > 0 ? params : machines.map((m) => m.id),
      );
    }
  }, [searchParams, paramName, multiSelect, machines]);

  const onMachineChange = (machineId: string | null) => {
    if (!multiSelect) {
      // Single select mode
      const params = new URLSearchParams(searchParams);
      if (machineId) {
        params.set(paramName, machineId);
      } else {
        params.delete(paramName);
      }
      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    }
  };

  const toggleMachine = (machineId: string) => {
    if (multiSelect) {
      setSelectedMachineIds((current) => {
        const isSelected = current.includes(machineId);

        if (isSelected) {
          return current.filter((id) => id !== machineId);
        } else {
          return [...current, machineId];
        }
      });
    }
  };

  const toggleAll = () => {
    if (multiSelect) {
      setSelectedMachineIds(
        selectedMachineIds.length === machines.length
          ? []
          : machines.map((m) => m.id),
      );
    }
  };

  // Apply multi-select changes to URL
  const applyMultiSelectChanges = useCallback(() => {
    if (multiSelect) {
      const params = new URLSearchParams(searchParams);

      // Clear existing machine params
      params.delete(paramName);

      // Add selected machine IDs if not all machines are selected
      if (
        selectedMachineIds.length > 0 &&
        selectedMachineIds.length < machines.length
      ) {
        selectedMachineIds.forEach((id) => {
          params.append(paramName, id);
        });
      }

      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    }
  }, [
    multiSelect,
    searchParams,
    paramName,
    selectedMachineIds,
    machines.length,
    router,
    pathname,
    setOpen,
  ]);

  // When popover closes, apply changes for multi-select
  useEffect(() => {
    if (!open && multiSelect) {
      applyMultiSelectChanges();
    }
  }, [open, multiSelect, applyMultiSelectChanges]);

  // Determine button text
  const getButtonText = () => {
    if (multiSelect) {
      if (selectedMachineIds.length === 0) {
        return "Sin máquinas seleccionadas";
      } else if (selectedMachineIds.length === machines.length) {
        return "Todas las máquinas";
      } else {
        return `${selectedMachineIds.length} máquinas seleccionadas`;
      }
    } else {
      // Single select mode
      if (selectedMachine) {
        if ("terminalSerialNumber" in selectedMachine) {
          return `${selectedMachine.name} • ${
            selectedMachine.terminalSerialNumber || "Sin serial"
          }`;
        } else {
          return selectedMachine.name;
        }
      } else {
        return "Filtrar por máquina";
      }
    }
  };

  // Check if a machine is selected in multi-select mode
  const isSelected = (machineId: string) => {
    return multiSelect
      ? selectedMachineIds.includes(machineId)
      : selectedMachine?.id === machineId;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {getButtonText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar máquina..." />
          <CommandEmpty>No se encontraron máquinas.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {multiSelect ? (
              <CommandItem onSelect={toggleAll} className="text-sm">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedMachineIds.length === machines.length
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                Todas las máquinas
              </CommandItem>
            ) : (
              <CommandItem
                onSelect={() => onMachineChange(null)}
                className="text-sm"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedMachine ? "opacity-100" : "opacity-0",
                  )}
                />
                Todas las máquinas
              </CommandItem>
            )}

            {machines.map((machine) => (
              <CommandItem
                key={machine.id}
                onSelect={() =>
                  multiSelect
                    ? toggleMachine(machine.id)
                    : onMachineChange(machine.id)
                }
                className="text-sm"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isSelected(machine.id) ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="flex flex-col">
                  <span>
                    {machine.name}{" "}
                    {"terminalSerialNumber" in machine &&
                      machine.terminalSerialNumber &&
                      `• ${machine.terminalSerialNumber}`}
                  </span>
                  {"team" in machine && (
                    <span className="text-muted-foreground text-xs">
                      {machine.team.name}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
