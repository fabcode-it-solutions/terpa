"use client";

import { machineSettingsAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { machineSettingsSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { MachineProtocol } from "@prisma/client";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  isAdmin: boolean;
  terminalCode?: string | null;
  defaultValues: {
    name: string;
    protocol: MachineProtocol;
    terminalSerialNumber?: string | null;
  };
};

export default function MachineSettingsForm(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(machineSettingsSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      terminalSerialNumber: props.defaultValues.terminalSerialNumber || "",
      name: props.defaultValues.name || "",
      protocol: props.defaultValues.protocol || MachineProtocol.DEX,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineSettingsAction(values)
      .then(() => {
        toast.success("Los cambios se han guardado exitosamente.");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ha ocurrido un error al guardar los cambios.");
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  El nombre con el que se identificará la máquina
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="protocol"
            render={({ field }) => (
              <FormItem>
                <Label>Protocolo de Comunicación</Label>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MDB">
                        MDB{" "}
                        <span className="text-xs text-muted-foreground">
                          (Recomendado)
                        </span>
                      </SelectItem>
                      <SelectItem value="DEX">DEX</SelectItem>
                    </SelectContent>
                    <FormDescription>
                      El protocolo de comunicación que utilizará la plataforma
                      para registrar ventas.
                    </FormDescription>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terminalSerialNumber"
            render={({ field }) => (
              <FormItem>
                <Label>Número de Serie de la Terminal</Label>
                <FormControl>
                  <Input {...field} disabled={!props.isAdmin} />
                </FormControl>
                <FormDescription>
                  El número de serie de la terminal asociada a esta máquina.
                </FormDescription>
              </FormItem>
            )}
          />
          <div>
            <FormItem>
              <Label>Código de Terminal</Label>
              <Input disabled value={props.terminalCode || ""} />
              <FormDescription>
                Este valor es definido por la terminal en uso.
              </FormDescription>
            </FormItem>
          </div>
          <Button className="px-10">Guardar</Button>
        </fieldset>
      </form>
    </Form>
  );
}
