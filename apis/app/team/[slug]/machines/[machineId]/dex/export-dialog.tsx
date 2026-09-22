"use client";

import { machineDexExportAction } from "@/actions/machine";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { formatDateToYYYYMMDD } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { addDays, differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, CalendarIcon, Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

// Maximum allowed date range in days
const MAX_DATE_RANGE_DAYS = 7;

interface ExportDialogProps {
  teamSlug: string;
  machineId: string;
}

export function ExportDialog({ teamSlug, machineId }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Date state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Set default dates to current week (7 days)
  const handleOpenChange = (open: boolean) => {
    if (open && !startDate && !endDate) {
      const now = new Date();
      // Set to last 7 days by default
      const end = now;
      const start = addDays(now, -6); // 7 days including today

      setStartDate(start);
      setEndDate(end);
      setError(null);
    }
    setOpen(open);
  };

  // Validate date range
  const validateDateRange = (): boolean => {
    // Clear previous errors
    setError(null);

    // Check if dates are valid
    if (!startDate || !endDate) {
      setError("Debes seleccionar ambas fechas");
      return false;
    }

    // Check if end date is after start date
    if (endDate < startDate) {
      setError("La fecha final debe ser posterior a la fecha inicial");
      return false;
    }

    // Check if date range is within the allowed limit
    const daysDifference = differenceInDays(endDate, startDate);
    if (daysDifference > MAX_DATE_RANGE_DAYS) {
      setError(
        `El rango de fechas no puede ser mayor a ${MAX_DATE_RANGE_DAYS} días`,
      );
      return false;
    }

    return true;
  };

  // Update validation when dates change
  const handleDateChange = () => {
    if (startDate && endDate) {
      validateDateRange();
    } else {
      setError(null);
    }
  };

  // Format dates for server action
  const getFormattedStartDate = () => {
    return startDate ? formatDateToYYYYMMDD(startDate) : "";
  };

  const getFormattedEndDate = () => {
    return endDate ? formatDateToYYYYMMDD(endDate) : "";
  };

  // Create a download from CSV data
  const downloadCSV = (csvData: string, filename: string) => {
    // Create a Blob from the CSV data
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Set up the download link
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = filename;
      downloadLinkRef.current.click();

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const handleExport = async () => {
    // Validate date range before exporting
    if (!validateDateRange()) {
      return;
    }

    try {
      setIsExporting(true);

      // Call the server action
      const result = await machineDexExportAction({
        machineId,
        startDate: getFormattedStartDate(),
        endDate: getFormattedEndDate(),
      });

      if (result.error) {
        toast({
          title: "Error al exportar",
          description: result.error,
          variant: "destructive",
        });
        setError(result.error);
      } else if (result.success && result.csvData) {
        // Download the CSV
        downloadCSV(result.csvData, result.filename || `dex-export.csv`);

        toast({
          title: "Exportación exitosa",
          description: "Los datos DEX se han exportado correctamente.",
        });

        // Close the dialog after successful export
        setTimeout(() => setOpen(false), 1000);
      }
    } catch (error) {
      console.error("Error exporting DEX reports:", error);
      toast({
        title: "Error al exportar",
        description: "Ocurrió un error al exportar los datos DEX.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={{ display: "none" }} />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Exportar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar reportes DEX</DialogTitle>
            <DialogDescription>
              Selecciona un rango de fechas para exportar los reportes DEX a
              CSV. El rango máximo permitido es de {MAX_DATE_RANGE_DAYS} días.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right text-sm font-medium">Desde</div>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                      disabled={isExporting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        handleDateChange();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right text-sm font-medium">Hasta</div>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                      disabled={isExporting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        handleDateChange();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            {isExporting ? (
              <Button disabled className="gap-2">
                <Loader2 size={16} className="animate-spin" />
                Exportando...
              </Button>
            ) : (
              <Button
                onClick={handleExport}
                disabled={!!error || !startDate || !endDate}
              >
                Exportar a CSV
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
