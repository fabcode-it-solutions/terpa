"use client";

import { teamCreateAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { teamCreateSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { LegalEntityType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function TeamCreateForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(teamCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      name: "",
      legalEntityType: LegalEntityType.PERSONA_FISICA,
      totalTerminals: 1,
      machineModelBrand: "",
      terminalSerialDigits: "",
    },
  });

  const legalEntityTypeLabels = {
    [LegalEntityType.PERSONA_FISICA]: "Persona Física",
    [LegalEntityType.PERSONA_MORAL]: "Persona Moral",
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const result = await teamCreateAction(values);
      if (result.success) {
        setIsSuccess(true);
        router.push(`/team/create/${result.team.slug}`);
      }
    } catch (error) {
      toast.error("Error al crear el negocio.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-4">
        <CardTitle className="text-4xl">Información General</CardTitle>
        <CardDescription className="text-sm space-y-4">
          ¡Gracias por confiar en nosotros! Recuerda, si tienes alguna pregunta
          no dudes en contactarnos. Estamos para servirte. Este formulario es
          necesario para poder hacer la alta comercial con el agregador
          bancario.
        </CardDescription>
      </CardHeader>

      {/* Stepper */}
      <div className="px-4 mb-8">
        <nav aria-label="Progress">
          <ol
            role="list"
            className="space-y-4 md:flex md:space-x-8 md:space-y-0"
          >
            {/* Step 1 - Complete */}
            <li className="md:flex-1">
              <div className="flex flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-sky-600">Paso 1</span>
                <span className="text-sm font-medium">Email & Contraseña</span>
              </div>
            </li>

            {/* Step 2 - Current */}
            <li className="md:flex-1">
              <div
                aria-current="step"
                className="flex flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-sky-600">Paso 2</span>
                <span className="text-sm font-medium">Información General</span>
              </div>
            </li>

            {/* Step 3 - Upcoming */}
            <li className="md:flex-1">
              <div className="flex flex-col border-l-4 border-gray-200 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-gray-500">
                  Paso 3
                </span>
                <span className="text-sm font-medium">
                  Documentación Comercial
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <fieldset>
            <CardContent className="grid grid-cols-6 gap-6">
              {/* Información Personal Section */}
              <h3 className="text-lg font-medium col-span-6">
                Información Personal
              </h3>

              {/* First Name - 2 columns */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tu nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name - 2 columns */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tu apellido" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Number - 2 columns */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Número de Teléfono (10 dígitos)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej. 5512345678"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Información del Negocio Section */}
              <h3 className="text-lg font-medium col-span-6">
                Información del Negocio
              </h3>

              {/* Business Name - 6 columns (full width) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Nombre Comercial del Negocio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Introduce el nombre comercial de tu negocio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Legal Entity Type - 6 columns */}
              <FormField
                control={form.control}
                name="legalEntityType"
                render={({ field }) => (
                  <FormItem className="col-span-6 space-y-3">
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
                            {
                              legalEntityTypeLabels[
                                LegalEntityType.PERSONA_FISICA
                              ]
                            }
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              value={LegalEntityType.PERSONA_MORAL}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {
                              legalEntityTypeLabels[
                                LegalEntityType.PERSONA_MORAL
                              ]
                            }
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Terminals - 3 columns */}
              <FormField
                control={form.control}
                name="totalTerminals"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>
                      Cantidad total de terminales a activar
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Si es prueba demo, especificar cantidad de demos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Machine Model/Brand - 3 columns */}
              <FormField
                control={form.control}
                name="machineModelBrand"
                render={({ field }) => (
                  <FormItem className="col-span-3">
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

              {/* Terminal Serial Digits - 6 columns */}
              <FormField
                control={form.control}
                name="terminalSerialDigits"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>
                      Últimos 4 Dígitos de los # de Serie de tus terminales
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Viene como S/N en terminal/caja. Por ejemplo, 6441, 6442,
                      6443, etc. Si NO has recibido tus terminales, favor de
                      ingresar &quot;0000&quot;.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting
                  ? "Procesando..."
                  : isSuccess
                    ? "Completado"
                    : "Siguiente Paso"}
              </Button>
            </CardFooter>
          </fieldset>
        </form>
      </Form>
    </Card>
  );
}
