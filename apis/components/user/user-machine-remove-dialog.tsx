"use client";

import { machineUnassignAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { machineUnassignSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machineId: string;
  machineName: string;
};

export default function UserMachineRemoveDialog(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(machineUnassignSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: props.machineId,
      userId: params.userId,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    return await machineUnassignAction(values).then((result) => {
      if (result.success) {
        form.reset();
        toast.success("Máquina desasignada correctamente");
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          <XIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <fieldset disabled={form.formState.isSubmitting}>
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>Desasignar Máquina</DialogTitle>
                <DialogDescription>
                  Estás a punto de desasignar la máquina de este usuario. Puedes
                  volver a asignarla en cualquier momento.
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm py-4">{props.machineName}</div>
              <DialogFooter>
                <Button size="sm" type="submit">
                  Desasignar
                </Button>
              </DialogFooter>
            </form>
          </fieldset>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
