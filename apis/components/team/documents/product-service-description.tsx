"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { teamDocumentsSchema } from "@/validation/teams";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

interface ProductServiceDescriptionProps {
  form: UseFormReturn<z.infer<typeof teamDocumentsSchema>>;
}

export default function ProductServiceDescription({
  form,
}: ProductServiceDescriptionProps) {
  return (
    <FormField
      control={form.control}
      name="productServiceDescription"
      render={({ field }) => (
        <FormItem className="col-span-6">
          <FormLabel>
            Producto o servicio que ofrece el comercio{" "}
            <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Describe los productos o servicios que ofrece tu negocio"
              className="min-h-[100px]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
