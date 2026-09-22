"use client";

import { picklistDeleteAction } from "@/actions/inventory";
import { AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { picklistDeleteSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PicklistDeleteDialog(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(picklistDeleteSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return picklistDeleteAction(values)
      .then((result) => {
        if (result?.error) {
          return toast.error(result.error);
        }
        toast.success("Picklist eliminada correctamente.");
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ocurrió un error al eliminar la picklist. Intenta más tarde.",
        );
      });
  });

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Picklist</AlertDialogTitle>
          <AlertDescription>
            ¿Estás seguro que quieres eliminar la picklist? Esta acción no se
            puede deshacer.
          </AlertDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <fieldset disabled={form.formState.isSubmitting}>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <Button variant="destructive">Eliminar</Button>
              </AlertDialogFooter>
            </fieldset>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
