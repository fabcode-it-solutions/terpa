"use client";

import SpiralDeleteDialog from "@/components/inventory/spiral-delete-dialog";
import SpiralEditDialog from "@/components/inventory/spiral-edit-dialog";
import SpiralEmptyDialog from "@/components/inventory/spiral-empty-dialog";
import SpiralFillDialog from "@/components/inventory/spiral-fill-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MachineType } from "@prisma/client";
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";

type Props = {
  spiral: {
    id: string;
    machineCode: string | null;
    machineMdbCode: string | null;
    machineMicromarketCode: string | null;
    productId: string | null;
    currentCount: number;
    maxCapacity: number;
  };
  products: Array<{ id: string; label: string }>;
  machineType: MachineType;
};

export default function SpiralDropdown(props: Props) {
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <SpiralFillDialog
        spiralId={props.spiral.id}
        open={showRefillDialog}
        onOpenChange={setShowRefillDialog}
      />
      <SpiralEmptyDialog
        spiralId={props.spiral.id}
        open={showEmptyDialog}
        onOpenChange={setShowEmptyDialog}
      />
      <SpiralEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        products={props.products}
        machineType={props.machineType}
        defaultValues={{
          spiralId: `${props.spiral.id}`,
          currentCount: `${props.spiral.currentCount}`,
          maxCapacity: `${props.spiral.maxCapacity}`,
          productId: `${props.spiral.productId}`,
          machineCode: props.spiral.machineCode || "",
          machineMdbCode: props.spiral.machineMdbCode || "",
          machineMicromarketCode: props.spiral.machineMicromarketCode || "",
        }}
      />
      <SpiralDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        spiralId={props.spiral.id}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontalIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <PencilIcon className="w-4 h-4" />
            Editar Espiral
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowRefillDialog(true)}>
            <ArrowUpToLineIcon className="w-4 h-4" />
            Llenar Espiral
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEmptyDialog(true)}>
            <ArrowDownToLineIcon className="w-4 h-4" />
            Vaciar Espiral
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <TrashIcon className="w-4 h-4" />
            Eliminar Espiral
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
