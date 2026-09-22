"use client";

import { productDeleteAction } from "@/actions/product";
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
import { productDeleteSchema } from "@/validation/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProductDeleteDialog(props: Props) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que deseas eliminar este producto? Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ProductDeleteForm
          productId={props.productId}
          onOpenChange={props.onOpenChange}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProductDeleteForm(props: {
  productId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(productDeleteSchema),
    defaultValues: {
      teamSlug: params.slug,
      productId: props.productId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return productDeleteAction(values)
      .then((result) => {
        if (result?.error) {
          return toast.error(result.error);
        }
        toast.success("Producto eliminado exitosamente.");
        props.onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al eliminar el producto.");
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
