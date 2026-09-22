"use client";

import { machineRemoteSaleToggleAction } from "@/actions/machine";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { machineRemoteSaleToggleSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  isRemoteSaleEnabled: boolean | null;
};

export default function MachineRemoteSaleDialog(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(machineRemoteSaleToggleSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineRemoteSaleToggleAction(values)
      .then((result) => {
        props.onOpenChange(false);
        toast.success(result.message);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ocurrió un error al intentar activar/desactivar la venta remota",
        );
      });
  });

  const title = props.isRemoteSaleEnabled
    ? "Desactivar Venta Remota"
    : "Activar Venta Remota";

  const description = props.isRemoteSaleEnabled
    ? "¿Estás seguro que deseas desactivar la venta remota?"
    : "¿Estás seguro que deseas activar la venta remota? Esta función quedará encendida por 45 segundos o hasta que se realize la venta.";

  const confirmLabel = props.isRemoteSaleEnabled
    ? "Desactivar Venta Remota"
    : "Activar Venta Remota";

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <fieldset disabled={form.formState.isSubmitting}>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button type="submit">{confirmLabel}</Button>
              </AlertDialogFooter>
            </fieldset>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
