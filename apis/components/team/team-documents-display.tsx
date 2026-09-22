"use client";

import { teamDocumentsUpdateAction } from "@/actions/team";
import { DocumentDownload } from "@/components/team/document-download";
import FileUploadField from "@/components/team/documents/file-upload-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  documentTypeLabels,
  formatFileSize,
  personaMoralDocumentTypes,
} from "@/lib/team-document-constants";
import { createTeamDocumentsSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { LegalEntityType, TeamDocumentType } from "@prisma/client";
import { format, toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

type TeamDocument = {
  id: string;
  type: TeamDocumentType;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  createdAt: Date;
};

type Props = {
  teamSlug: string;
  documents: TeamDocument[];
  legalEntityType: LegalEntityType | null;
};

export function TeamDocumentsDisplay({
  teamSlug,
  documents,
  legalEntityType,
}: Props) {
  const router = useRouter();

  // Initialize form with zod resolver
  const form = useForm<z.infer<ReturnType<typeof createTeamDocumentsSchema>>>({
    resolver: zodResolver(createTeamDocumentsSchema(legalEntityType)),
    defaultValues: {
      slug: teamSlug,
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
    },
  });

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

      // Add "PERSONA MORAL" related files only if the team is a legal entity
      if (legalEntityType === LegalEntityType.PERSONA_MORAL) {
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
      }

      const result = await teamDocumentsUpdateAction(formData);

      if (result.success) {
        toast.success("Documentos actualizados correctamente.");
        router.refresh();
      } else {
        const errorResult = result as any;
        if (errorResult.error) {
          toast.error(errorResult.error);
        } else {
          toast.error("Error desconocido al actualizar los documentos.");
        }
      }
    } catch (error) {
      console.error("Error updating team documents:", error);
      toast.error("Error al actualizar los documentos. Inténtalo de nuevo.");
    }
  };

  // Filter documents based on legal entity type
  const filteredDocuments = documents.filter((doc) => {
    // If the document type is specific to PERSONA_MORAL, only show it for PERSONA_MORAL teams
    if (personaMoralDocumentTypes.includes(doc.type)) {
      return legalEntityType === LegalEntityType.PERSONA_MORAL;
    }
    // Otherwise, show the document for all teams
    return true;
  });

  // Group documents by type
  const documentsByType = filteredDocuments.reduce(
    (acc, doc) => {
      if (!acc[doc.type]) {
        acc[doc.type] = [];
      }
      acc[doc.type].push(doc);
      return acc;
    },
    {} as Record<string, TeamDocument[]>,
  );

  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Actualizar Documentos</CardTitle>
          <CardDescription>
            Sube nuevos documentos o actualiza los existentes.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-6 gap-6">
              {/* Common document upload fields */}
              <div className="col-span-6">
                <FileUploadField
                  name="businessOperationProofFiles"
                  form={form}
                  label="Prueba de Operación de Negocio"
                  description="En caso de solo tener la vending machine, adjuntar foto de la maquina en su ubicación de operación."
                  required={true}
                  maxFiles={10}
                />
              </div>

              <div className="col-span-6">
                <FileUploadField
                  name="legalRepresentativeIdFiles"
                  form={form}
                  label='Identificación oficial de "Representante legal"'
                  required={true}
                  additionalNote="adelante y atrás"
                />
              </div>

              <div className="col-span-6">
                <FileUploadField
                  name="taxSituationFiles"
                  form={form}
                  label='Constancia de Situación Fiscal de "Representante Legal"'
                  required={true}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>

              {/* PERSONA MORAL specific fields */}
              {legalEntityType === LegalEntityType.PERSONA_MORAL && (
                <>
                  <div className="col-span-6">
                    <FileUploadField
                      name="articlesOfIncorporationFiles"
                      form={form}
                      label="Acta Constitutiva de Persona Moral"
                      required={true}
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="publicRegistryRegistrationFiles"
                      form={form}
                      label="Inscripción al Registro Público de Persona Moral"
                      required={true}
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityTaxSituationFiles"
                      form={form}
                      label="Constancia de Situación Fiscal de Persona Moral"
                      required={true}
                      additionalNote="Vigente, no más de 3 meses"
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityProofOfAddressFiles"
                      form={form}
                      label="Comprobante de Domicilio a nombre de Persona Moral"
                      required={true}
                      additionalNote="Vigente, no más de 3 meses"
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityBankStatementFiles"
                      form={form}
                      label="Carátula de Estado de cuenta de Persona Moral"
                      required={true}
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Guardando..."
                  : "Actualizar Documentos"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Current Documents Display */}
      <div className="space-y-6">
        {Object.entries(documentsByType).map(([type, docs]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle>
                {documentTypeLabels[type as TeamDocumentType]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {format(
                          toZonedTime(
                            new Date(doc.createdAt),
                            "America/Monterrey",
                          ),
                          "dd/MM/yyyy",
                          { timeZone: "America/Monterrey" },
                        )}
                      </p>
                    </div>
                    <DocumentDownload
                      teamSlug={teamSlug}
                      documentId={doc.id}
                      fileName={doc.fileName}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No hay documentos disponibles
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
