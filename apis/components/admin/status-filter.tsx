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
import { MachineOnlineStatus, cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type StatusOption = {
  value: MachineOnlineStatus | "all";
  label: string;
  indicatorClass?: string;
};

const statusOptions: StatusOption[] = [
  { value: "all", label: "Todos los estatus" },
  {
    value: MachineOnlineStatus.online,
    label: "En Línea",
    indicatorClass: "border-emerald-300 bg-emerald-600 dark:border-emerald-900",
  },
  {
    value: MachineOnlineStatus.warning,
    label: "Intermitente",
    indicatorClass: "border-yellow-300 bg-yellow-500 dark:border-yellow-700",
  },
  {
    value: MachineOnlineStatus.offline,
    label: "Sin Conexión",
    indicatorClass: "border-red-300 bg-red-600 dark:border-red-900",
  },
  {
    value: MachineOnlineStatus.noData,
    label: "Sin Datos",
    indicatorClass: "border-gray-300 bg-gray-600 dark:border-gray-900",
  },
];

export function StatusFilter() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedStatus = searchParams.get(
    "status",
  ) as MachineOnlineStatus | null;

  const selectedOption = selectedStatus
    ? statusOptions.find((option) => option.value === selectedStatus) ||
      statusOptions[0]
    : statusOptions[0];

  const onStatusChange = (status: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[250px] justify-between"
          size="sm"
        >
          <div className="flex items-center gap-2">
            {selectedOption.indicatorClass && (
              <span
                className={cn(
                  "w-3 h-3 border-4 block rounded-full shadow",
                  selectedOption.indicatorClass,
                )}
              />
            )}
            {selectedOption.label}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar estado..." />
          <CommandEmpty>No se encontraron estados.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {statusOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() =>
                  onStatusChange(option.value === "all" ? null : option.value)
                }
                className="text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOption?.value === option.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.indicatorClass && (
                    <span
                      className={cn(
                        "w-3 h-3 border-4 block rounded-full shadow",
                        option.indicatorClass,
                      )}
                    />
                  )}
                  {option.label}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
