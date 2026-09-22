"use client";

import { inventoryExportAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MachineType } from "@prisma/client";
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  ChevronDownIcon,
  DownloadIcon,
  PlusIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import InventoryEmptyDialog from "./inventory-empty-dialog";
import InventoryFillDialog from "./inventory-fill-dialog";
import SpiralCreateDialog from "./spiral-create-dialog";

type Props = {
  products: Array<{ id: string; label: string }>;
  machineType: MachineType;
};

export default function InventoryDropdown(props: Props) {
  const params = useParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isMicromarket = props.machineType === "MICROMARKET";

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await inventoryExportAction({
        teamSlug: params.slug as string,
        machineId: params.machineId as string,
      });

      if (result.success) {
        // Create a download link for the CSV
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `inventario-${params.machineId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Inventario exportado correctamente");
      } else {
        toast.error("Error al exportar inventario");
      }
    } catch (error) {
      toast.error("Error al exportar inventario");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <SpiralCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        products={props.products}
        machineType={props.machineType}
      />
      <InventoryFillDialog
        open={showFillDialog}
        onOpenChange={setShowFillDialog}
      />
      <InventoryEmptyDialog
        open={showEmptyDialog}
        onOpenChange={setShowEmptyDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <span>Acciones</span>
            <ChevronDownIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="w-4 h-4" />
            {isMicromarket ? "Agregar Producto" : "Agregar Espiral"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowFillDialog(true)}>
            <ArrowUpToLineIcon className="w-4 h-4" />
            {isMicromarket ? "Llenar Micromarket" : "Llenar Máquina"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEmptyDialog(true)}>
            <ArrowDownToLineIcon className="w-4 h-4" />
            {isMicromarket ? "Vaciar Micromarket" : "Vaciar Máquina"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport} disabled={exporting}>
            <DownloadIcon className="w-4 h-4" />
            {exporting ? "Exportando..." : "Exportar CSV"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
