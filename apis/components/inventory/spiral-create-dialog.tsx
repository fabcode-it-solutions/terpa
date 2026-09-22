"use client";

import { spiralCreateAction } from "@/actions/inventory";
import SpiralForm from "@/components/inventory/spiral-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { spiralCreateSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { MachineType } from "@prisma/client";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  products: Array<{ id: string; label: string }>;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  machineType: MachineType;
};

export default function SpiralCreateDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <Content
          products={props.products}
          onOpenChange={props.onOpenChange}
          machineType={props.machineType}
        />
      </DialogContent>
    </Dialog>
  );
}

function Content({
  onOpenChange,
  products,
  machineType,
}: {
  onOpenChange: (open: boolean) => void;
  products: Array<{ id: string; label: string }>;
  machineType: MachineType;
}) {
  const params = useParams();

  const form = useForm({
    resolver: zodResolver(spiralCreateSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      machineCode: "",
      productId: "",
      currentCount: "",
      maxCapacity: "",
      machineMdbCode: "",
      machineMicromarketCode: "",
      machineType: machineType,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return spiralCreateAction(values)
      .then((result) => {
        if (result?.error) return toast.error(result.error);
        const successMessage =
          machineType === "MICROMARKET"
            ? "Producto agregado correctamente."
            : "Espiral agregado correctamente.";
        toast.success(successMessage);
        onOpenChange(false);
      })
      .catch(() => {
        const errorMessage =
          machineType === "MICROMARKET"
            ? "Ocurrió un error al agregar el producto."
            : "Ocurrió un error al agregar el espiral.";
        toast.error(errorMessage);
      });
  });

  const dialogTitle =
    machineType === "MICROMARKET" ? "Agregar Producto" : "Agregar Espiral";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <SpiralForm products={products} machineType={machineType} />
        </form>
      </Form>
    </>
  );
}
