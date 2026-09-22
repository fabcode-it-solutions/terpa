"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

type Props = {
  isEdit?: boolean;
};

export default function RouteForm({ isEdit = false }: Props) {
  const form = useFormContext();

  return (
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
          {isEdit ? "Guardar" : "Agregar Ruta"}
        </Button>
      </div>
    </fieldset>
  );
}
