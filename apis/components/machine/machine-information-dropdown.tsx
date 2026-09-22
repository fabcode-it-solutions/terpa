"use client";

import MachineRemoteSaleDialog from "@/components/machine/machine-remote-sale-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon, WifiIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  remoteSaleEnabledUntil: Date | null;
};

export default function MachineInformationDropdown(props: Props) {
  const router = useRouter();
  const params = useParams();
  const [showRemoteSaleDialog, setShowRemoteSaleDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isRemoteSaleEnabled =
    props.remoteSaleEnabledUntil && new Date() < props.remoteSaleEnabledUntil;

  const remoteSaleLabel = isRemoteSaleEnabled
    ? "Desactivar Venta Remota"
    : "Activar Venta Remota";

  return (
    <>
      <MachineRemoteSaleDialog
        open={showRemoteSaleDialog}
        onOpenChange={setShowRemoteSaleDialog}
        isRemoteSaleEnabled={isRemoteSaleEnabled}
      />
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreVerticalIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowRemoteSaleDialog(true)}>
            <WifiIcon className="w-4 h-4" /> <span>{remoteSaleLabel}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
