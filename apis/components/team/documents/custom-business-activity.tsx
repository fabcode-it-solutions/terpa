"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamDocumentsSchema } from "@/validation/teams";
import { BusinessActivityType } from "@prisma/client";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

interface CustomBusinessActivityProps {
  form: UseFormReturn<z.infer<typeof teamDocumentsSchema>>;
  showCustomActivity: boolean;
}

export default function CustomBusinessActivity({
  form,
  showCustomActivity,
}: CustomBusinessActivityProps) {
  if (!showCustomActivity) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="businessActivities"
      render={({ field }) => {
        // Find the "Other" activity in the array
        const otherActivity = field.value?.find(
          (activity) => activity.type === BusinessActivityType.OTHER,
        );

        return (
          <FormItem className="col-span-6">
            <FormLabel>
              Especificar otro giro de negocio{" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                value={otherActivity?.customName || ""}
                onChange={(e) => {
                  // Update the customName for the "Other" activity
                  const newValue = field.value?.map((activity) => {
                    if (activity.type === BusinessActivityType.OTHER) {
                      return {
                        ...activity,
                        customName: e.target.value,
                      };
                    }
                    return activity;
                  });
                  field.onChange(newValue);
                }}
                placeholder="Especifica el giro de tu negocio"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
