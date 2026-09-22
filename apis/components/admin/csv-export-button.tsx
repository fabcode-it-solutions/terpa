"use client";

import { exportMachinesCSVAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CSVExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportMachinesCSVAction();

      if (result.success && result.data) {
        // Create a blob with the CSV data
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });

        // Create a download link and trigger it
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `maquinas_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("CSV exportado exitosamente");
      } else {
        toast.error(result.error || "Error al exportar CSV");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Error inesperado al exportar CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportCSV}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar CSV"}
    </Button>
  );
}
