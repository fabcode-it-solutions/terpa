"use client";

import { machineReconcileAction } from "@/actions/machine";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { machineReconcileSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function MachineReconciliationDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <span>Realizar Corte de Caja</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Realizar Corte de Caja</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-muted-foreground text-sm">
          Se calculará la diferencia del efectivo que llega a caja desde tu
          último corte y se creará un nuevo corte de caja.
        </p>
        <AlertDialogFooter>
          <DialogForm setIsOpen={setIsOpen} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DialogForm(props: { setIsOpen: (value: boolean) => void }) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(machineReconcileSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineReconcileAction(values).then((result) => {
      if (!result.success) {
        toast.error("Error al realizar el corte de caja", {
          description: result.error,
        });
      } else {
        props.setIsOpen(false);

        if (result.data?.action === "reconciliation.start") {
          toast.info("Corte de caja iniciado correctamente", {
            description: "Se ha iniciado el corte de caja correctamente.",
          });
        }

        if (result.data?.action === "reconciliation.reset") {
          toast.warning("Corte de caja se ha reiniciado", {
            description:
              "Ha sucedido una discrepancia de un DEX a otro DEX. Se ha reiniciado el corte de caja.",
          });
        }

        if (result.data?.action === "reconciliation.create") {
          toast.success("Corte de caja realizado", {
            description: "Se realizó el corte de caja correctamente.",
          });
        }
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset className="space-x-4" disabled={form.formState.isSubmitting}>
          <Button
            variant="secondary"
            onClick={() => props.setIsOpen(false)}
            type="button"
          >
            Cancelar
          </Button>
          <Button type="submit">Confirmar</Button>
        </fieldset>
      </form>
    </Form>
  );
}
