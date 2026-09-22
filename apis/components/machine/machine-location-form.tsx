"use client";

import { machineLocationAction } from "@/actions/machine";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { machineLocationSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  defaultValues: {
    lat: number | null;
    lon: number | null;
  };
};

export default function MachineLocationForm(props: Props) {
  const params = useParams();

  const form = useForm({
    resolver: zodResolver(machineLocationSchema),
    defaultValues: {
      machineId: params.machineId,
      teamSlug: params.slug,
      lat: props.defaultValues.lat || "",
      lon: props.defaultValues.lon || "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineLocationAction(values)
      .then(() => {
        toast.info("Ubicación actualizada");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Error al actualizar la ubicación");
      });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset
          disabled={form.formState.isSubmitting}
          className="flex items-end gap-6"
        >
          <FormField
            name="lat"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="lon"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="min-w-[160px]">
            Guardar
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
