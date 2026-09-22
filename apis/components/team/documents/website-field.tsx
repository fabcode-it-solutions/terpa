"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamDocumentsSchema } from "@/validation/teams";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

interface WebsiteFieldProps {
  form: UseFormReturn<z.infer<typeof teamDocumentsSchema>>;
}

export default function WebsiteField({ form }: WebsiteFieldProps) {
  return (
    <FormField
      control={form.control}
      name="website"
      render={({ field }) => (
        <FormItem className="col-span-6">
          <FormLabel>Sitio Web</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value || ""}
              placeholder="https://www.ejemplo.com"
            />
          </FormControl>
          <FormDescription>Sitio web de tu negocio (opcional)</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
