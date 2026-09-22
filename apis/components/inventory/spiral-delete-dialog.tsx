"use client";

import { spiralDeleteAction } from "@/actions/inventory";
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
import { spiralDeleteSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spiralId: string;
};

export default function SpiralDeleteDialog(props: Props) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Espiral</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que quieres eliminar esta espiral? Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <SpiralDeleteForm
          spiralId={props.spiralId}
          onOpenChange={props.onOpenChange}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SpiralDeleteForm(props: {
  spiralId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(spiralDeleteSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      spiralId: props.spiralId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return spiralDeleteAction(values)
      .then(() => {
        toast.success("Espiral eliminada correctamente");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al eliminar la espiral");
      })
      .finally(() => {
        props.onOpenChange(false);
      });
  });

  return (
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
            <Button type="submit" variant="destructive">
              Eliminar
            </Button>
          </AlertDialogFooter>
        </fieldset>
      </form>
    </Form>
  );
}
