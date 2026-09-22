"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const invoiceStatusToLabel: Partial<Record<InvoiceStatus, string>> &
  Record<"NOT_INVOICED", string> = {
  PAYMENT_VERIFICATION_PENDING: "Revisión Pendiente",
  PAYMENT_VERIFICATION_REJECTED: "Pago Rechazado",
  PAYMENT_SUCCESS: "Pago Exitoso",
  CANCELLED: "Pago Cancelado",
  NOT_INVOICED: "Sin Pago",
};

const invoiceStatusToColor: Partial<Record<InvoiceStatus, string>> &
  Record<"NOT_INVOICED", string> = {
  PAYMENT_VERIFICATION_PENDING: "bg-blue-500",
  PAYMENT_VERIFICATION_REJECTED: "bg-red-500",
  PAYMENT_SUCCESS: "bg-emerald-500",
  CANCELLED: "bg-orange-500",
  NOT_INVOICED: "bg-gray-500",
};

export function InvoiceFilters({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear + 5 - 2024 + 1 },
    (_, i) => 2024 + i,
  ).reverse();

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  const status = searchParams.get("status") ?? "";

  const handleValueChange = (
    key: "year" | "month" | "status",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (key === "status" && value === "") {
      params.delete("status");
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleMonthSelect = (currentMonth: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", currentMonth);
    router.push(`${pathname}?${params.toString()}`);
    setMonthOpen(false);
  };

  const handleStatusSelect = (currentStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (currentStatus === status) {
      params.delete("status");
    } else {
      params.set("status", currentStatus);
    }
    router.push(`${pathname}?${params.toString()}`);
    setStatusOpen(false);
  };

  const selectedMonthLabel =
    months.find((m) => m.value === month)?.label || "Mes";

  const selectedStatusLabel =
    status !== ""
      ? invoiceStatusToLabel[status as keyof typeof invoiceStatusToLabel]
      : "Todos los estados";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <Popover open={yearOpen} onOpenChange={setYearOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={yearOpen}
            className="w-full md:w-[200px] justify-between"
          >
            {year}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar año..." />
            <CommandList>
              <CommandEmpty>No se encontró el año.</CommandEmpty>
              <CommandGroup>
                {years.map((y) => (
                  <CommandItem
                    key={y}
                    value={y.toString()}
                    onSelect={(currentValue) => {
                      handleValueChange("year", currentValue);
                      setYearOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        year === y ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {y}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Popover open={monthOpen} onOpenChange={setMonthOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={monthOpen}
            className="w-full md:w-[200px] justify-between"
          >
            {selectedMonthLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar mes..." />
            <CommandList>
              <CommandEmpty>No se encontró el mes.</CommandEmpty>
              <CommandGroup>
                {months.map((m) => (
                  <CommandItem
                    key={m.value}
                    value={m.label}
                    onSelect={() => handleMonthSelect(m.value.toString())}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        month === m.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {m.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={statusOpen}
            className="w-full md:w-[200px] justify-between"
          >
            {selectedStatusLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar estado..." />
            <CommandList>
              <CommandEmpty>No hay estados.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={() => handleStatusSelect("")} value="">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      status === "" ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Todos los estados
                </CommandItem>
                {Object.entries(invoiceStatusToLabel).map(([value, label]) => (
                  <CommandItem
                    key={value}
                    value={value}
                    onSelect={() => {
                      handleStatusSelect(value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        status === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div
                      className={cn(
                        "mr-2 h-2 w-2 rounded-full",
                        invoiceStatusToColor[
                          value as keyof typeof invoiceStatusToColor
                        ],
                      )}
                    />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
