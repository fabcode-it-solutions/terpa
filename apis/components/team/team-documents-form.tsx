"use client";

import { teamDocumentsUpdateAction } from "@/actions/team";
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
import { createTeamDocumentsSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessActivityType, LegalEntityType, Team } from "@prisma/client";
import { ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import * as z from "zod";
import BusinessActivityTypes from "./documents/business-activity-types";
import CustomBusinessActivity from "./documents/custom-business-activity";
import FileUploadField from "./documents/file-upload-field";
import ProductServiceDescription from "./documents/product-service-description";
import WebsiteField from "./documents/website-field";

// This component handles the document upload step of team creation
export default function TeamDocumentsForm({ team }: { team: Team }) {
  const router = useRouter();
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const sigPad = useRef<SignatureCanvas>(null);

  // Initialize form with zod resolver using the team's legal entity type
  const form = useForm<z.infer<ReturnType<typeof createTeamDocumentsSchema>>>({
    resolver: zodResolver(createTeamDocumentsSchema(team.legalEntityType)),
    defaultValues: {
      slug: team.slug,
      website: "",
      productServiceDescription: "",
      businessActivities: [],
      businessOperationProofFiles: [],
      legalRepresentativeIdFiles: [],
      taxSituationFiles: [],
      articlesOfIncorporationFiles: [],
      publicRegistryRegistrationFiles: [],
      legalEntityTaxSituationFiles: [],
      legalEntityProofOfAddressFiles: [],
      legalEntityBankStatementFiles: [],
      legalRepresentativeName: team.legalRepresentativeName || "",
      electronicSignature: "",
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

  // Handle form submission
  const onSubmit = async (
    values: z.infer<ReturnType<typeof createTeamDocumentsSchema>>,
  ) => {
    try {
      const formData = new FormData();

      // Add basic form data
      formData.append("slug", values.slug);
      formData.append("website", values.website || "");
      formData.append(
        "productServiceDescription",
        values.productServiceDescription,
      );
      formData.append(
        "businessActivities",
        JSON.stringify(values.businessActivities),
      );
      formData.append(
        "legalRepresentativeName",
        values.legalRepresentativeName,
      ); // Add this line

      // Add files
      if (values.businessOperationProofFiles) {
        values.businessOperationProofFiles.forEach((file) => {
          formData.append("businessOperationProofFiles", file);
        });
      }

      if (values.legalRepresentativeIdFiles) {
        values.legalRepresentativeIdFiles.forEach((file) => {
          formData.append("legalRepresentativeIdFiles", file);
        });
      }

      if (values.taxSituationFiles) {
        values.taxSituationFiles.forEach((file) => {
          formData.append("taxSituationFiles", file);
        });
      }

      // Add "PERSONA MORAL" specific files only if the team is a legal entity
      if (team.legalEntityType === LegalEntityType.PERSONA_MORAL) {
        if (values.articlesOfIncorporationFiles) {
          values.articlesOfIncorporationFiles.forEach((file) => {
            formData.append("articlesOfIncorporationFiles", file);
          });
        }

        if (values.publicRegistryRegistrationFiles) {
          values.publicRegistryRegistrationFiles.forEach((file) => {
            formData.append("publicRegistryRegistrationFiles", file);
          });
        }
      }

      // Add files common to both or specific to PERSONA_FISICA (if applicable)
      // These are appended regardless of the PERSONA_MORAL check above,
      // as they might be required for PERSONA_FISICA or always.
      if (values.legalEntityTaxSituationFiles) {
        values.legalEntityTaxSituationFiles.forEach((file) => {
          formData.append("legalEntityTaxSituationFiles", file);
        });
      }

      if (values.legalEntityProofOfAddressFiles) {
        values.legalEntityProofOfAddressFiles.forEach((file) => {
          formData.append("legalEntityProofOfAddressFiles", file);
        });
      }

      if (values.legalEntityBankStatementFiles) {
        values.legalEntityBankStatementFiles.forEach((file) => {
          formData.append("legalEntityBankStatementFiles", file);
        });
      }

      if (values.electronicSignature) {
        formData.append("electronicSignature", values.electronicSignature);
      }

      const result = await teamDocumentsUpdateAction(formData);

      if (result.success) {
        toast.success("Información actualizada correctamente.");
        // After successful update, redirect to the team page
        router.push(`/team/${team.slug}`);
      } else {
        // Handle error case - cast to any to access potential error property
        const errorResult = result as any;
        if (errorResult.error) {
          toast.error(errorResult.error);
        } else {
          toast.error("Error desconocido al actualizar la información.");
        }
      }
    } catch (error) {
      console.error("Error updating team information:", error);
      toast.error("Error al actualizar la información. Inténtalo de nuevo.");
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-4">
        <CardTitle className="text-4xl">¡Bienvenido, {team.name}!</CardTitle>
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

            {/* Step 2 - Complete */}
            <li className="md:flex-1">
              <div className="flex flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-sky-600">Paso 2</span>
                <span className="text-sm font-medium">Información General</span>
              </div>
            </li>

            {/* Step 3 - Current */}
            <li className="md:flex-1">
              <div
                aria-current="step"
                className="flex flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-sky-600">Paso 3</span>
                <span className="text-sm font-medium">
                  Documentación Comercial
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-6 gap-6">
            {/* Website Field */}
            <WebsiteField form={form} />

            {/* Business Activity Types */}
            <BusinessActivityTypes
              form={form}
              setShowCustomActivity={setShowCustomActivity}
            />

            {/* Custom Business Activity Field - Only shown when "Other" is selected */}
            <CustomBusinessActivity
              form={form}
              showCustomActivity={showCustomActivity}
            />

            {/* Product or Service Description */}
            <ProductServiceDescription form={form} />

            {/* Business Operation Proof Files */}
            <div className="col-span-6">
              <FileUploadField
                name="businessOperationProofFiles"
                form={form}
                label="Fotografía o video que respalde la operación y giro de su negocio"
                description="En caso de solo tener la vending machine, adjuntar foto de la maquina en su ubicación de operación."
                required={true}
                maxFiles={10}
              />
            </div>

            {/* Legal Representative ID Files */}
            <div className="col-span-6">
              <FileUploadField
                name="legalRepresentativeIdFiles"
                form={form}
                label='Identificación oficial de "Representante legal"'
                required={true}
                additionalNote="adelante y atrás"
              />
            </div>

            {/* Tax Situation Files */}
            <div className="col-span-6">
              <FileUploadField
                name="taxSituationFiles"
                form={form}
                label='Constancia de Situación Fiscal de "Representante Legal"'
                required={true}
                additionalNote="Vigente, no más de 3 meses"
              />
            </div>

            {/* Articles of Incorporation Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_MORAL && (
              <div className="col-span-6">
                <FileUploadField
                  name="articlesOfIncorporationFiles"
                  form={form}
                  label="Acta Constitutiva de Persona Moral"
                  required={true}
                />
              </div>
            )}

            {/* Public Registry Registration Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_MORAL && (
              <div className="col-span-6">
                <FileUploadField
                  name="publicRegistryRegistrationFiles"
                  form={form}
                  label="Inscripción al Registro Público de Persona Moral"
                  required={true}
                />
              </div>
            )}

            {/* Legal Entity Tax Situation Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_MORAL && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityTaxSituationFiles"
                  form={form}
                  label="Constancia de Situación Fiscal de Persona Moral"
                  required={true}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>
            )}

            {/* Legal Entity Tax Situation Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_FISICA && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityTaxSituationFiles"
                  form={form}
                  label="Constancia de Situación Fiscal de Persona Física"
                  required={true}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>
            )}

            {/* Legal Entity Proof of Address Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_MORAL && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityProofOfAddressFiles"
                  form={form}
                  label="Comprobante de Domicilio a nombre de Persona Moral"
                  required={true}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>
            )}

            {/* Legal Entity Proof of Address Files - Only for PERSONA FISICA */}
            {team.legalEntityType === LegalEntityType.PERSONA_FISICA && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityProofOfAddressFiles"
                  form={form}
                  label="Comprobante de Domicilio a nombre de Persona Física"
                  required={true}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>
            )}

            {/* Legal Entity Bank Statement Files - Only for PERSONA MORAL */}
            {team.legalEntityType === LegalEntityType.PERSONA_MORAL && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityBankStatementFiles"
                  form={form}
                  label="Carátula de Estado de cuenta de Persona Moral"
                  required={true}
                />
              </div>
            )}

            {/* Legal Entity Bank Statement Files - Only for PERSONA FISICA */}
            {team.legalEntityType === LegalEntityType.PERSONA_FISICA && (
              <div className="col-span-6">
                <FileUploadField
                  name="legalEntityBankStatementFiles"
                  form={form}
                  label="Carátula de Estado de cuenta de Persona Física"
                  required={true}
                />
              </div>
            )}

            {/* Legal Representative Name Field */}
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="legalRepresentativeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Representante Legal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingrese el nombre completo del representante legal"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre completo tal como aparece en la identificación
                      oficial.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Links Section */}
            <div className="col-span-6 space-y-2">
              <Button variant="outline" asChild>
                <a
                  href="https://drive.google.com/file/d/1LtDoB95wiZJuJEz0f7NzTgfAr5UQ2GVK/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-between items-center py-6"
                >
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Contrato Con Agregador Bancario</span>
                  </div>
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://docs.google.com/document/d/1CmTcTDY1zGhVMtNEjZ5SEXlfJZc1Y_uNy2jfNdJiB7o/edit?tab=t.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-between items-center py-6"
                >
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Términos Y Condiciones</span>
                  </div>
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Electronic Signature Field */}
            <div className="col-span-6 space-y-2">
              <FormField
                control={form.control}
                name="electronicSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Firma digital del representante legal que respalda el
                      contrato
                    </FormLabel>
                    <FormDescription>
                      LA FIRMA DEBE DE SER IGUAL QUE LA IDENTIFICACIÓN OFICIAL
                    </FormDescription>
                    <FormControl>
                      <SignatureCanvas
                        ref={sigPad}
                        penColor="black"
                        canvasProps={{
                          className:
                            "w-full h-48 border border-gray-300 rounded-md bg-stone-100",
                        }}
                        onEnd={() => {
                          if (sigPad.current) {
                            form.setValue(
                              "electronicSignature",
                              sigPad.current.isEmpty()
                                ? ""
                                : sigPad.current.toDataURL(),
                              { shouldValidate: true },
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="mt-2 text-xs text-muted-foreground">
                      Por medio de esta firma, estoy de acuerdo con los términos
                      y condiciones adjuntos, y autorizo que mi firma y mis
                      datos sean utilizados para llenar la solicitud del
                      contrato adjunto con el agregador bancario.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (sigPad.current) {
                    sigPad.current.clear();
                    form.setValue("electronicSignature", "", {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                Limpiar Firma
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Guardando..."
                : "Finalizar Registro"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
