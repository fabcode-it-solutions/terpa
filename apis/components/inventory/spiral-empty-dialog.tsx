"use client";

import { spiralEmptyAction } from "@/actions/inventory";
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
import { spiralEmptySchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  spiralId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function SpiralEmptyDialog(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(spiralEmptySchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      spiralId: props.spiralId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return spiralEmptyAction(values)
      .then(() => {
        toast.success("La espiral se ha vaciado correctamente.");
        props.onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ocurrió un error al llenar la espiral. Intente más tarde.",
        );
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
          <AlertDialogTitle>Vaciar Espiral</AlertDialogTitle>
          <AlertDialogDescription>
            La espiral se vaciará completamente.
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
