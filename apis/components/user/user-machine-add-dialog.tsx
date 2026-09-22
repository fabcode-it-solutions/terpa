"use client";

import { machineAssignAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { machineAssignSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDown, PlusIcon } from "lucide-react";
import { useParams } from "next/dist/client/components/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machines: Array<{
    id: string;
    name: string;
  }>;
};

export default function UserMachineAddDialog(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="w-5 h-5" /> Asignar Máquina
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Máquina</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Selecciona una máquina para dar acceso a este usuario.
        </DialogDescription>
        <MachineAddForm
          machines={props.machines}
          setIsDialogOpen={setIsDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
}

function MachineAddForm(
  props: Props & { setIsDialogOpen: (open: boolean) => void },
) {
  const params = useParams();
  const [isMachinePopoverOpen, setIsMachinePopoverOpen] = useState(false);
  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(machineAssignSchema),
    defaultValues: {
      teamSlug: params.slug,
      userId: params.userId,
      machineId: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    return await machineAssignAction(data).then((result) => {
      if (result.success) {
        form.reset();
        toast.success("Máquina asignada correctamente.");
        props.setIsDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting} className="space-y-6">
          <FormField
            control={form.control}
            name="machineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máquina</FormLabel>
                <Popover
                  open={isMachinePopoverOpen}
                  onOpenChange={setIsMachinePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {field.value
                          ? props.machines.find(
                              (machine) => machine.id === field.value,
                            )?.name || "Selecciona una máquina"
                          : "Selecciona una máquina"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 " side="bottom" align="end">
                    <Command>
                      <CommandInput placeholder="Selecciona una máquina" />
                      <CommandEmpty>Máquina no encontrada.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {props.machines.map((machine) => (
                          <CommandItem
                            key={machine.id}
                            value={machine.name}
                            onSelect={() => {
                              form.setValue("machineId", machine.id);
                              setIsMachinePopoverOpen(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                machine.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {machine.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <Button className="w-full" type="submit">
            Asignar Máquina
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
