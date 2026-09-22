"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { AlertCircle, CheckIcon } from "lucide-react";

type Props = {
  machineCost: number;
  productCost: number | null;
};

export default function MachineSaleCostIndicator(props: Props) {
  if (!props.productCost) return null;

  const isMatching = props.productCost === props.machineCost;

  const title = isMatching
    ? "Costo de máquina y producto coinciden"
    : "Costo de máquina y producto no coinciden";

  const description = isMatching
    ? "El costo de la máquina y el producto coinciden."
    : `El costo del producto es ${formatCurrency(
        props.productCost,
      )} y el costo de la máquina es de ${formatCurrency(
        props.machineCost,
      )}. Ajusta el precio en la máquina para que coincida con el costo del producto.`;

  const buttonClassName = isMatching
    ? "text-emerald-600 border-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600"
    : "text-red-600 border-red-600 hover:bg-red-600/10 hover:text-red-600";

  const Icon = isMatching ? CheckIcon : AlertCircle;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={`w-8 h-8 ${buttonClassName}`}
        >
          <Icon className="w-5 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
