"use client";

import { inventoryEmptyAction } from "@/actions/inventory";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { inventoryEmptySchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function InventoryEmptyDialog(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(inventoryEmptySchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onOpenChange = (value: boolean) => {
    if (form.formState.isSubmitting) return;
    props.onOpenChange(value);
  };

  const onSubmit = form.handleSubmit((values) => {
    return inventoryEmptyAction(values)
      .then(() => {
        toast.success("La máquina se ha vaciado correctamente.");
        props.onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ha ocurrido un error al vaciar la máquina. Intente más tarde.",
        );
      });
  });

  return (
    <AlertDialog open={props.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vaciar Máquina</AlertDialogTitle>
          <AlertDialogDescription>
            Las espirales de la máquina se vaciarán completamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <fieldset disabled={form.formState.isSubmitting}>
              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Confirmar</Button>
              </AlertDialogFooter>
            </fieldset>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
