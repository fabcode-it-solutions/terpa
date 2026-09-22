"use client";

import { machineAdminAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { machineAdminSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  activeUntilDate: string;
  isEnabled: boolean;
};

export default function MachineAdminForm(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(machineAdminSchema),
    values: {
      teamSlug: params.slug,
      machineId: params.machineId,
      activeUntilDate: props.activeUntilDate,
      isEnabled: props.isEnabled,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineAdminAction(values)
      .then(() => {
        toast.success("Máquina actualizada correctamente.");
        form.reset({
          teamSlug: params.slug,
          machineId: params.machineId,
          activeUntilDate: values.activeUntilDate,
          isEnabled: values.isEnabled,
        });
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Ha ocurrido un error al actualizar la máquina.", {
          description: error.message,
        });
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset className="space-y-8" disabled={form.formState.isSubmitting}>
          <FormField
            name="activeUntilDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            formatInTimeZone(
                              field.value,
                              "America/Monterrey",
                              "PPP",
                              { locale: es },
                            )
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value
                            ? fromZonedTime(field.value, "America/Monterrey")
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, "yyyy-MM-dd"));
                          }
                        }}
                        defaultMonth={
                          field.value
                            ? fromZonedTime(field.value, "America/Monterrey")
                            : undefined
                        }
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
                <FormDescription>
                  A partir de esta fecha, la máquina quedará inactiva.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Habilitar Máquina</FormLabel>
                  <FormDescription>
                    Activa o desactiva la máquina inmediatamente
                  </FormDescription>
                </div>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-sm">
                    {field.value ? "Habilitada" : "Inhabilitada"}
                  </p>
                </div>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="px-10"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            Guardar
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
