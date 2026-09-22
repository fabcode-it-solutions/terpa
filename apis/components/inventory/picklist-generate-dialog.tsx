"use client";

import { picklistGenerateAction } from "@/actions/inventory";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { picklistGenerateSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { MachineType } from "@prisma/client";
import { ListPlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machineType?: MachineType;
};

export default function PicklistGenerateDialog({ machineType }: Props) {
  const [open, onOpenChange] = useState(false);

  const params = useParams();
  const form = useForm({
    resolver: zodResolver(picklistGenerateSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return picklistGenerateAction(values)
      .then(() => {
        toast.success("La picklist ha sido generada correctamente.");
        onOpenChange(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ha ocurrido un error al generar la picklist. Intenta de nuevo más tarde.",
        );
      });
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (form.formState.isSubmitting) return;
        onOpenChange(value);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ListPlusIcon className="w-5 h-5 mr-1" />
          Picklist
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generar Picklist</AlertDialogTitle>
          <AlertDialogDescription>
            {machineType === "MICROMARKET"
              ? "Se generará una picklist con los productos necesarios para surtir el micromarket."
              : "Se generará una picklist con los productos necesarios para rellenar la máquina."}
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
