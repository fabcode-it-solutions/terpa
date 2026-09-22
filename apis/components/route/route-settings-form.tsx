"use client";

import { routeSettingsAction } from "@/actions/route";
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
import { routeSettingsSchema } from "@/validation/route";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  defaultValues: {
    name: string;
  };
};

export function RouteSettingsForm(props: Props) {
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(routeSettingsSchema),
    defaultValues: {
      teamSlug: params.slug,
      routeId: params.id,
      name: props.defaultValues.name || "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return routeSettingsAction(values)
      .then(() => {
        toast.success("Ruta actualizada correctamente.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Ha ocurrido un error al actualizar la ruta.");
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset className="space-y-4" disabled={form.formState.isSubmitting}>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Ruta</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    {...field}
                    placeholder="Introduce el nombre de la ruta"
                  />
                </FormControl>
                <FormDescription>
                  El nombre con el que se identificará la ruta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-4">
            <Button type="submit" className="w-full md:w-auto px-10">
              Guardar
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
