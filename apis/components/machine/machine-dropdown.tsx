"use client";

import MachineDeleteDialog from "@/components/machine/machine-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlignLeftIcon,
  DollarSign,
  MoreHorizontalIcon,
  ReceiptIcon,
  RouterIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  machineId: string;
  base: string;
  canDelete?: boolean;
};

export default function MachineDropdown(props: Props) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <MachineDeleteDialog
        machineId={props.machineId}
        open={showDelete}
        onOpenChange={setShowDelete}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontalIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem asChild>
            <Link href={`${props.base}/sales`}>
              <DollarSign className="w-4 h-4" />
              Ventas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${props.base}/inventory`}>
              <AlignLeftIcon className="w-4 h-4" />
              Inventario
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${props.base}/dex`}>
              <RouterIcon className="w-4 h-4" />
              DEX
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${props.base}/billing`}>
              <ReceiptIcon className="w-4 h-4" />
              Facturación
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${props.base}/settings`}>
              <SettingsIcon className="w-4 h-4" />
              Ajustes
            </Link>
          </DropdownMenuItem>
          {props.canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={() => setShowDelete(true)}
              >
                <TrashIcon className="w-4 h-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
