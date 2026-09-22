"use client";

import { spiralEditAction } from "@/actions/inventory";
import SpiralForm from "@/components/inventory/spiral-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { spiralEditSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { MachineType } from "@prisma/client";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Array<{ id: string; label: string }>;
  machineType: MachineType;
  defaultValues: {
    spiralId: string;
    productId: string;
    currentCount: string;
    maxCapacity: string;
    machineCode: string | null;
    machineMdbCode: string | null;
    machineMicromarketCode: string | null;
  };
};

export default function SpiralEditDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <Content props={props} />
      </DialogContent>
    </Dialog>
  );
}

function Content({ props }: { props: Props }) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(spiralEditSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      spiralId: props.defaultValues.spiralId,
      currentCount: props.defaultValues.currentCount,
      maxCapacity: props.defaultValues.maxCapacity,
      productId: props.defaultValues.productId,
      machineCode: props.defaultValues.machineCode || "",
      machineMdbCode: props.defaultValues.machineMdbCode || "",
      machineMicromarketCode: props.defaultValues.machineMicromarketCode || "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return spiralEditAction(values)
      .then(() => {
        toast.success("Espiral editado correctamente.");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al editar el espiral.");
      })
      .finally(() => {
        props.onOpenChange(false);
      });
  });

  const dialogTitle =
    props.machineType === "MICROMARKET" ? "Editar Producto" : "Editar Espiral";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <SpiralForm
            isEdit
            products={props.products}
            machineType={props.machineType}
          />
        </form>
      </Form>
    </>
  );
}
