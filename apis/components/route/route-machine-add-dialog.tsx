"use client";

import { addMachineToRouteAction } from "@/actions/route";
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
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { routeMachineAddSchema } from "@/validation/route";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDown, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machines: {
    id: string;
    name: string;
  }[];
};

export default function RouteMachineAddDialog(props: Props) {
  const { machines } = props;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusIcon className="w-4 h-4 mr-2" />
          Agregar Máquina
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-2">
        <DialogHeader>
          <DialogTitle>Agregar Máquina a la Ruta</DialogTitle>
        </DialogHeader>
        <RouteMachineAddForm
          machines={machines}
          onSuccess={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RouteMachineAddForm(props: Props & { onSuccess: () => void }) {
  const params = useParams();
  const [isMachinePopoverOpen, setIsMachinePopoverOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(routeMachineAddSchema),
    defaultValues: {
      machineId: "",
      routeId: params.id,
      teamSlug: params.slug,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    return addMachineToRouteAction(values)
      .then((result) => {
        if (result.success) {
          toast.success("Máquina agregada a la ruta exitosamente");
          form.reset();
          props.onSuccess();
        } else {
          toast.error(result.error || "Error al agregar la máquina a la ruta");
        }
      })
      .catch((error) => {
        console.error("Error adding machine to route:", error);
        toast.error("Error inesperado al agregar la máquina a la ruta");
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset
          disabled={form.formState.isSubmitting}
          className="flex flex-col gap-4"
        >
          <FormField
            name="machineId"
            control={form.control}
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
                            )?.name
                          : "Seleccione una máquina"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 " side="bottom" align="start">
                    <Command>
                      <CommandInput placeholder="Seleccione una máquina" />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-4 w-full">
            Agregar Máquina
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
