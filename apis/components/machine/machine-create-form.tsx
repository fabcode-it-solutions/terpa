"use client";

import { machineCreateAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExperimentStatus } from "@/hooks/use-experiment-status";
import { machineCreateSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
};

export default function MachineCreateForm(props: Props) {
  // Check if MICROMARKET experiment is active for this team
  const { data: isMicromarketExperimentActive = false } = useExperimentStatus(
    "MICROMARKET",
    props.teamSlug,
  );

  const form = useForm({
    resolver: zodResolver(machineCreateSchema),
    defaultValues: {
      teamSlug: props.teamSlug,
      name: "",
      terminalSerialNumber: "",
      type: "VENDING" as const,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineCreateAction(values)
      .then((result) => {
        if (result?.error) return toast(result.error);
        toast("Terminal creada exitosamente.");
      })
      .catch(() =>
        toast("Ocurrió un error al crear la máquina. Intenta más tarde."),
      );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <fieldset
              className="space-y-4"
              disabled={form.formState.isSubmitting}
            >
              <FormField
                name="name"
                control={form.control}
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
                name="terminalSerialNumber"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Serie de Terminal</FormLabel>
                    <FormControl>
                      <Input className="uppercase" {...field} />
                    </FormControl>
                    <FormDescription>
                      El número de serie de la terminal conectada a la máquina
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isMicromarketExperimentActive && (
                <FormField
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Máquina</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de máquina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VENDING">Vending</SelectItem>
                          <SelectItem value="MICROMARKET">
                            Micromarket
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El tipo de máquina que estás agregando
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="w-full md:w-auto px-10">
                  Agregar Máquina
                </Button>
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
