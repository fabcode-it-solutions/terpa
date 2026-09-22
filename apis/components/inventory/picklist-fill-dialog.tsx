"use client";

import { picklistFillAction } from "@/actions/inventory";
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
import { picklistFillSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
};

export default function PicklistFillDialog(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(picklistFillSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return picklistFillAction(values)
      .then(() => {
        toast.success("La picklist ha sido llenada correctamente.");
        props.onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ha ocurrido un error al llenar la picklist. Intenta de nuevo más tarde.",
        );
      });
  });

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Llenar Picklist</AlertDialogTitle>
          <AlertDialogDescription>
            Se llenarán las espirales con las cantidades especificadas en la
            picklist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <fieldset disabled={form.formState.isSubmitting}>
              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => props.onOpenChange(false)}
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
