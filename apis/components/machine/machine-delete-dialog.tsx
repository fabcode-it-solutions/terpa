"use client";

import { machineDeleteAction } from "@/actions/machine";
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
import { machineDeleteSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MachineDeleteDialog(props: Props) {
  const params = useParams();

  const form = useForm({
    resolver: zodResolver(machineDeleteSchema),
    defaultValues: {
      machineId: props.machineId,
      teamSlug: params.slug,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineDeleteAction(values)
      .then(() => {
        toast("Máquina eliminada correctamente.");
      })
      .catch((error) => {
        console.error(error);
        toast("Ocurrió un error al eliminar la máquina.");
      })
      .finally(() => {
        props.onOpenChange(false);
      });
  });

  const onOpenChange = (value: boolean) => {
    if (!form.formState.isSubmitting) {
      props.onOpenChange(value);
    }
  };

  return (
    <AlertDialog open={props.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Máquina</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que quieres eliminar esta máquina? Esta acción no se
            puede deshacer.
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
                <Button variant="destructive">Eliminar</Button>
              </AlertDialogFooter>
            </fieldset>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
