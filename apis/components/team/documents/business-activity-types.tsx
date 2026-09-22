"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { teamDocumentsSchema } from "@/validation/teams";
import { BusinessActivityType } from "@prisma/client";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

// Business activity type options for the form
const businessActivityOptions = [
  {
    id: BusinessActivityType.FOOD_AND_BEVERAGES,
    label: "Alimentación y Bebidas",
  },
  { id: BusinessActivityType.RETAIL, label: "Retail" },
  { id: BusinessActivityType.HEALTH_AND_BEAUTY, label: "Salud y Belleza" },
  {
    id: BusinessActivityType.TECHNOLOGY_AND_ELECTRONICS,
    label: "Tecnología y Electrónicos",
  },
  {
    id: BusinessActivityType.ENTERTAINMENT_AND_GAMES,
    label: "Entretenimiento y Juegos",
  },
  { id: BusinessActivityType.SERVICES, label: "Servicios" },
  { id: BusinessActivityType.OTHER, label: "Otro" },
];

interface BusinessActivityTypesProps {
  form: UseFormReturn<z.infer<typeof teamDocumentsSchema>>;
  setShowCustomActivity: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BusinessActivityTypes({
  form,
  setShowCustomActivity,
}: BusinessActivityTypesProps) {
  // Watch for changes to business activities to show/hide custom field
  const businessActivities = form.watch("businessActivities") || [];
  const hasOtherActivity = businessActivities.some(
    (activity) => activity.type === BusinessActivityType.OTHER,
  );

  // Show custom field if "Other" is selected
  if (hasOtherActivity) {
    setShowCustomActivity(true);
  } else {
    setShowCustomActivity(false);
  }

  return (
    <div className="col-span-6">
      <FormLabel className="text-base">
        Giro de negocio según Constancia de Situación Fiscal{" "}
        <span className="text-red-500">*</span>
      </FormLabel>
      <FormDescription className="mb-4">
        Selecciona al menos una opción
      </FormDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessActivityOptions.map((option) => (
          <FormField
            key={option.id}
            control={form.control}
            name="businessActivities"
            render={({ field }) => {
              // Check if this activity is selected
              const isSelected = field.value?.some(
                (activity) => activity.type === option.id,
              );

              return (
                <FormItem
                  key={option.id}
                  className="flex flex-row items-start space-x-3 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        // If checked, add to array
                        if (checked) {
                          const newValue = [
                            ...(field.value || []),
                            { type: option.id },
                          ];
                          field.onChange(newValue);
                        } else {
                          // If unchecked, remove from array
                          const newValue = field.value?.filter(
                            (activity) => activity.type !== option.id,
                          );
                          field.onChange(newValue);
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{option.label}</FormLabel>
                </FormItem>
              );
            }}
          />
        ))}
      </div>
      <FormMessage className="mt-2" />
    </div>
  );
}
