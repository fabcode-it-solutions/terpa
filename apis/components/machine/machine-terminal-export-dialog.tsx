"use client";

import { machineTerminalExportAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function MachineTerminalExportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DownloadIcon className="w-5 h-5" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Transacciones</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas para exportar las transacciones de
            terminal.
          </DialogDescription>
        </DialogHeader>
        <ExportForm />
      </DialogContent>
    </Dialog>
  );
}

function ExportForm() {
  const params = useParams();
  const now = new Date();
  const timezone = "America/Monterrey";
  const zoned = toZonedTime(now, timezone);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => ({
    from: fromZonedTime(startOfMonth(zoned), timezone),
    to: fromZonedTime(endOfMonth(zoned), timezone),
  }));

  const onSubmit = () => {
    if (!date.from || !date.to) {
      toast.error("Selecciona un rango de fechas.");
      return;
    }

    const from = format(toZonedTime(date.from, timezone), "yyyy-MM-dd");
    const to = format(toZonedTime(date.to, timezone), "yyyy-MM-dd");

    setLoading(true);
    machineTerminalExportAction({
      teamSlug: params.slug as string,
      machineId: params.machineId as string,
      from,
      to,
    })
      .then((result: { success: boolean; data?: string; error?: string }) => {
        if (!result.success) {
          throw new Error(
            result.error || "Error al exportar las transacciones",
          );
        }

        const csv = result.data;
        const url = URL.createObjectURL(
          new Blob([csv as string], { type: "text/csv" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `terminal-export-${from}-${to}-${params.machineId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        toast.error("Error al exportar las transacciones.", {
          description: errorMessage,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="flex flex-col gap-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            disabled={loading}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLLL dd, y", {
                    locale: es,
                  })}{" "}
                  -{" "}
                  {format(date.to, "LLLL dd, y", {
                    locale: es,
                  })}
                </>
              ) : (
                format(date.from, "LLLL dd, y", {
                  locale: es,
                })
              )
            ) : (
              <span>Selecciona un rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(date) => {
              setDate({
                from: date?.from,
                to: date?.to,
              });
            }}
            numberOfMonths={1}
            locale={es}
          />
        </PopoverContent>
      </Popover>
      {date.from && date.to ? (
        <Button className="w-full" onClick={onSubmit} disabled={loading}>
          {loading ? "Exportando..." : "Exportar CSV"}
        </Button>
      ) : (
        <Button disabled>Exportar CSV</Button>
      )}
    </div>
  );
}
