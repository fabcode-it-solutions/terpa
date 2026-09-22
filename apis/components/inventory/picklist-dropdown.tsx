"use client";

import { picklistExportAction } from "@/actions/inventory";
import PicklistDeleteDialog from "@/components/inventory/picklist-delete-dialog";
import PicklistFillDialog from "@/components/inventory/picklist-fill-dialog";
import PicklistRegenerateDialog from "@/components/inventory/picklist-regenerate-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns-tz";
import {
  ArrowUpToLineIcon,
  ChevronDownIcon,
  DownloadIcon,
  EyeIcon,
  ListIcon,
  ListRestartIcon,
  ListXIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import slug from "slug";
import { toast } from "sonner";

type Props = {
  machineName: string;
  picklist: {
    createdAt: Date;
  };
};

export default function PicklistDropdown(props: Props) {
  const params = useParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);

  const onExport = () => {
    picklistExportAction({
      teamSlug: params.slug,
      machineId: params.machineId,
    }).then((result) => {
      if (result?.error) {
        return toast.error(result.error);
      }
      const url = URL.createObjectURL(
        new Blob([result.data || ""], { type: "text/csv" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `picklist-${slug(props.machineName)}-${format(
        props.picklist.createdAt,
        "dd-MM-yyyy hh-mm-ss a",
        { timeZone: "America/Mexico_City" },
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      <PicklistDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
      <PicklistRegenerateDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      />
      <PicklistFillDialog
        open={showFillDialog}
        onOpenChange={setShowFillDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <ListIcon className="w-5 h-5 mr-1" />
            Picklist
            <ChevronDownIcon className="w-5 h-5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/team/${params.slug}/machines/${params.machineId}/inventory/picklist`}
            >
              <EyeIcon className="w-4 h-4" />
              Ver Picklist
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowFillDialog(true)}>
            <ArrowUpToLineIcon className="w-4 h-4" />
            Llenar Picklist
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRegenerateDialog(true)}>
            <ListRestartIcon className="w-4 h-4" />
            Regenerar Picklist
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onExport()}>
            <DownloadIcon className="w-4 h-4" />
            Descargar Picklist
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <ListXIcon className="w-4 h-4" />
            Eliminar Picklist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
