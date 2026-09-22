"use client";

import { teamManageAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { teamManageSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessActivityType, LegalEntityType } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  team: {
    slug: string;
    name: string;
    pharosMerchantCode?: string | null;
    costPerMachineCents: number;
    legalEntityType?: LegalEntityType;
    totalTerminals?: number;
    machineModelBrand?: string;
    terminalSerialDigits?: string;
    website?: string | null;
    productServiceDescription?: string | null;
    contactNumber?: string | null; // Add new prop
    legalRepresentativeName?: string | null;
    businessActivities?: Array<{
      type: BusinessActivityType;
      customName?: string | null;
    }>;
  };
};

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

export default function TeamManageForm(props: Props) {
  const [showCustomActivity, setShowCustomActivity] = useState(false);

  const form = useForm({
    resolver: zodResolver(teamManageSchema),
    defaultValues: {
      slug: props.team.slug,
      name: props.team.name || "",
      pharosMerchantCode: props.team.pharosMerchantCode || "",
      costPerMachineCents: (props.team.costPerMachineCents / 100).toFixed(2),
      legalEntityType: props.team.legalEntityType || "",
      totalTerminals: props.team.totalTerminals || 1,
      machineModelBrand: props.team.machineModelBrand || "",
      terminalSerialDigits: props.team.terminalSerialDigits || "",
      website: props.team.website || "",
      productServiceDescription: props.team.productServiceDescription || "",
      contactNumber: props.team.contactNumber || "", // Add new default value
      legalRepresentativeName: props.team.legalRepresentativeName || "",
      businessActivities: props.team.businessActivities
        ? props.team.businessActivities.map((activity) => ({
            type: activity.type,
            customName: activity.customName || null,
          }))
        : [],
    },
  });

  // Watch for changes to business activities to show/hide custom field
  const businessActivities = form.watch("businessActivities") || [];
  const hasOtherActivity = businessActivities.some(
    (activity: { type: BusinessActivityType }) =>
      activity.type === BusinessActivityType.OTHER,
  );

  // Show custom field if "Other" is selected
  if (hasOtherActivity !== showCustomActivity) {
    setShowCustomActivity(hasOtherActivity);
  }

  const onSubmit = form.handleSubmit((values) => {
    return teamManageAction(values).then((result) => {
      if (result.success) {
        toast.success("Equipo actualizado exitosamente.");
      } else {
        toast.error("Sucedió un error al actualizar el equipo.");
      }
    });
  });

  const legalEntityTypeLabels = {
    [LegalEntityType.PERSONA_FISICA]: "Persona Física",
    [LegalEntityType.PERSONA_MORAL]: "Persona Moral",
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting} className="space-y-6">
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
                  Nombre del equipo como se mostrará en la plataforma
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pharosMerchantCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Comercio</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  El código de comerciante del agregador de pagos.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPerMachineCents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo por Máquina (USD)</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-[21px] -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <FormControl>
                    <Input {...field} className="pl-6" />
                  </FormControl>
                </div>
                <FormDescription>
                  Costo por máquina en dólares sin considerar el IVA.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Legal Entity Type */}
          <FormField
            control={form.control}
            name="legalEntityType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Entidad Legal</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem
                          value={LegalEntityType.PERSONA_FISICA}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {legalEntityTypeLabels[LegalEntityType.PERSONA_FISICA]}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={LegalEntityType.PERSONA_MORAL} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {legalEntityTypeLabels[LegalEntityType.PERSONA_MORAL]}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total Terminals */}
          <FormField
            control={form.control}
            name="totalTerminals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad total de terminales a activar</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Si es prueba demo, especificar cantidad de demos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Machine Model/Brand */}
          <FormField
            control={form.control}
            name="machineModelBrand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Marcas y Modelos de tus Máquinas Expendedoras
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Ejemplo: AMS Sensit 3, Vendo, USI, EVM, XY Vending, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terminal Serial Digits */}
          <FormField
            control={form.control}
            name="terminalSerialDigits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Últimos 4 Dígitos de los # de Serie de tus terminales
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website Field */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio Web</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="https://www.ejemplo.com"
                  />
                </FormControl>
                <FormDescription>
                  Sitio web de tu negocio (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Legal Representative Name */}
          <FormField
            control={form.control}
            name="legalRepresentativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Representante Legal</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Ej. Juan Pérez"
                  />
                </FormControl>
                <FormDescription>
                  Nombre del representante legal del equipo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Contacto</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Ej. 8112345678"
                  />
                </FormControl>
                <FormDescription>
                  Número de teléfono de contacto del equipo (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Service Description */}
          <FormField
            control={form.control}
            name="productServiceDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Producto o servicio que ofrece el comercio
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Describe los productos o servicios que ofrece tu negocio"
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Business Activity Types */}
          <div>
            <FormLabel className="text-base">
              Giro de negocio según Constancia de Situación Fiscal
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
                        <FormLabel className="font-normal">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage className="mt-2" />
          </div>

          {/* Custom Business Activity Field - Only shown when "Other" is selected */}
          {showCustomActivity && (
            <FormField
              control={form.control}
              name="businessActivities"
              render={({ field }) => {
                // Find the "Other" activity in the array
                const otherActivity = field.value?.find(
                  (activity) => activity.type === BusinessActivityType.OTHER,
                );

                return (
                  <FormItem>
                    <FormLabel>Especificar otro giro de negocio</FormLabel>
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
          )}

          <Button>Guardar Cambios</Button>
        </fieldset>
      </form>
    </Form>
  );
}
