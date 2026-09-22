"use client";

import { routeDeleteAction } from "@/actions/route";
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
import { routeDeleteSchema } from "@/validation/route";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  routeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RouteDeleteDialog(props: Props) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la
            ruta y todos los datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RouteDeleteForm
          routeId={props.routeId}
          onOpenChange={props.onOpenChange}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RouteDeleteForm(props: {
  routeId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(routeDeleteSchema),
    defaultValues: {
      teamSlug: params.slug,
      routeId: props.routeId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return routeDeleteAction(values)
      .then((result) => {
        if (result?.error) {
          return toast.error(result.error);
        }
        toast.success("Ruta eliminada exitosamente.");
        props.onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al eliminar la ruta.");
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset>
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
