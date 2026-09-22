"use client";

import {
  adminTeamDocumentDeleteAction,
  adminTeamDocumentsUpdateAction,
} from "@/actions/team";
import { DocumentDownload } from "@/components/team/document-download";
import FileUploadField from "@/components/team/documents/file-upload-field";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { createAdminTeamDocumentsSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { LegalEntityType, TeamDocumentType } from "@prisma/client";
import { format, toZonedTime } from "date-fns-tz";
import { Download } from "lucide-react"; // Import Download icon
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
  deletedAt?: Date | null;
};

type Props = {
  teamSlug: string;
  documents: TeamDocument[];
  legalEntityType: LegalEntityType | null;
  electronicSignature?: string | null; // Changed to string
};

// Document type labels in Spanish
const documentTypeLabels: Record<TeamDocumentType, string> = {
  BUSINESS_OPERATION_PROOF: "Prueba de Operación de Negocio",
  LEGAL_REPRESENTATIVE_ID: "Identificación del Representante Legal",
  TAX_SITUATION:
    "Constancia de Situación Fiscal (Persona Física/Representante Legal)",
  ARTICLES_OF_INCORPORATION: "Acta Constitutiva",
  PUBLIC_REGISTRY_REGISTRATION: "Inscripción al Registro Público",
  LEGAL_ENTITY_TAX_SITUATION: "Constancia de Situación Fiscal (Persona Moral)",
  LEGAL_ENTITY_PROOF_OF_ADDRESS: "Comprobante de Domicilio",
  LEGAL_ENTITY_BANK_STATEMENT: "Estado de Cuenta Bancario",
  SIGNED_CONTRACT: "Contrato Firmado", // Add this
};

// Format file size to human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

// Document types that are only applicable for PERSONA_MORAL
const personaMoralDocumentTypes: TeamDocumentType[] = [
  TeamDocumentType.ARTICLES_OF_INCORPORATION,
  TeamDocumentType.PUBLIC_REGISTRY_REGISTRATION,
];

export function AdminTeamDocumentsDisplay({
  teamSlug,
  documents,
  legalEntityType,
  electronicSignature, // Destructure electronicSignature
}: Props) {
  const router = useRouter();

  // Initialize form with admin zod resolver
  const form = useForm<
    z.infer<ReturnType<typeof createAdminTeamDocumentsSchema>>
  >({
    resolver: zodResolver(createAdminTeamDocumentsSchema(legalEntityType)),
    defaultValues: {
      slug: teamSlug,
      // No need to provide default values for optional fields
      businessOperationProofFiles: [],
      legalRepresentativeIdFiles: [],
      taxSituationFiles: [],
      articlesOfIncorporationFiles: [],
      publicRegistryRegistrationFiles: [],
      legalEntityTaxSituationFiles: [],
      legalEntityProofOfAddressFiles: [],
      legalEntityBankStatementFiles: [],
      signedContractFiles: [], // Add this
    },
  });

  // Handle form submission
  const onSubmit = async (
    values: z.infer<ReturnType<typeof createAdminTeamDocumentsSchema>>,
  ) => {
    try {
      const formData = new FormData();

      // Add basic form data
      formData.append("slug", values.slug);

      // Add optional fields only if they exist
      if (values.website) {
        formData.append("website", values.website);
      }

      if (values.productServiceDescription) {
        formData.append(
          "productServiceDescription",
          values.productServiceDescription,
        );
      }

      if (values.businessActivities && values.businessActivities.length > 0) {
        formData.append(
          "businessActivities",
          JSON.stringify(values.businessActivities),
        );
      }

      // Add files
      if (
        values.businessOperationProofFiles &&
        values.businessOperationProofFiles.length > 0
      ) {
        values.businessOperationProofFiles.forEach((file) => {
          formData.append("businessOperationProofFiles", file);
        });
      }

      if (
        values.legalRepresentativeIdFiles &&
        values.legalRepresentativeIdFiles.length > 0
      ) {
        values.legalRepresentativeIdFiles.forEach((file) => {
          formData.append("legalRepresentativeIdFiles", file);
        });
      }

      if (values.taxSituationFiles && values.taxSituationFiles.length > 0) {
        values.taxSituationFiles.forEach((file) => {
          formData.append("taxSituationFiles", file);
        });
      }

      // Add "PERSONA MORAL" related files
      if (
        values.articlesOfIncorporationFiles &&
        values.articlesOfIncorporationFiles.length > 0
      ) {
        values.articlesOfIncorporationFiles.forEach((file) => {
          formData.append("articlesOfIncorporationFiles", file);
        });
      }

      if (
        values.publicRegistryRegistrationFiles &&
        values.publicRegistryRegistrationFiles.length > 0
      ) {
        values.publicRegistryRegistrationFiles.forEach((file) => {
          formData.append("publicRegistryRegistrationFiles", file);
        });
      }

      if (
        values.legalEntityTaxSituationFiles &&
        values.legalEntityTaxSituationFiles.length > 0
      ) {
        values.legalEntityTaxSituationFiles.forEach((file) => {
          formData.append("legalEntityTaxSituationFiles", file);
        });
      }

      if (
        values.legalEntityProofOfAddressFiles &&
        values.legalEntityProofOfAddressFiles.length > 0
      ) {
        values.legalEntityProofOfAddressFiles.forEach((file) => {
          formData.append("legalEntityProofOfAddressFiles", file);
        });
      }

      if (
        values.legalEntityBankStatementFiles &&
        values.legalEntityBankStatementFiles.length > 0
      ) {
        values.legalEntityBankStatementFiles.forEach((file) => {
          formData.append("legalEntityBankStatementFiles", file);
        });
      }

      // Add Signed Contract files
      if (values.signedContractFiles && values.signedContractFiles.length > 0) {
        values.signedContractFiles.forEach((file) => {
          formData.append("signedContractFiles", file);
        });
      }

      const result = await adminTeamDocumentsUpdateAction(formData);

      if (result.success) {
        toast.success("Documentos actualizados correctamente.");

        // Reset all file fields after successful upload
        form.setValue("businessOperationProofFiles", []);
        form.setValue("legalRepresentativeIdFiles", []);
        form.setValue("taxSituationFiles", []);
        form.setValue("articlesOfIncorporationFiles", []);
        form.setValue("publicRegistryRegistrationFiles", []);
        form.setValue("legalEntityTaxSituationFiles", []);
        form.setValue("legalEntityProofOfAddressFiles", []);
        form.setValue("legalEntityBankStatementFiles", []);
        form.setValue("signedContractFiles", []); // Add this

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

  // Filter documents based on legal entity type and exclude soft-deleted documents
  const filteredDocuments = documents.filter((doc) => {
    // Exclude soft-deleted documents
    if (doc.deletedAt) {
      return false;
    }

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

  const signatureDataUrl = electronicSignature
    ? `data:image/png;base64,${electronicSignature}` // No longer need toString('base64')
    : null;

  return (
    <div className="space-y-8">
      {/* Electronic Signature Display */}
      {signatureDataUrl && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Firma Digital</CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const link = document.createElement("a");
                link.href = signatureDataUrl;
                link.download = `firma-electronica-${teamSlug}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Descargar Firma</span>
            </Button>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureDataUrl}
              alt="Firma Digital"
              className="w-full h-48 border border-gray-300 rounded-md bg-stone-100 object-contain"
            />
          </CardContent>
        </Card>
      )}

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
                    <div className="flex items-center gap-2">
                      <DocumentDownload
                        teamSlug={teamSlug}
                        documentId={doc.id}
                        fileName={doc.fileName}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="px-2"
                          >
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Estás seguro de eliminar este documento?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El documento
                              será eliminado de forma permanente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  const result =
                                    await adminTeamDocumentDeleteAction({
                                      documentId: doc.id,
                                      teamSlug,
                                    });

                                  if (result.success) {
                                    toast.success(
                                      "Documento eliminado correctamente",
                                    );
                                    router.refresh();
                                  } else {
                                    toast.error(
                                      result.error ||
                                        "Error al eliminar el documento",
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error deleting document:",
                                    error,
                                  );
                                  toast.error("Error al eliminar el documento");
                                }
                              }}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Documentos</CardTitle>
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
                  required={false}
                  maxFiles={10}
                />
              </div>

              <div className="col-span-6">
                <FileUploadField
                  name="legalRepresentativeIdFiles"
                  form={form}
                  label='Identificación oficial de "Representante legal"'
                  required={false}
                  additionalNote="adelante y atrás"
                />
              </div>

              <div className="col-span-6">
                <FileUploadField
                  name="taxSituationFiles"
                  form={form}
                  label='Constancia de Situación Fiscal de "Representante Legal"'
                  required={false}
                  additionalNote="Vigente, no más de 3 meses"
                />
              </div>

              {/* PERSONA FISICA specific fields */}
              {legalEntityType === LegalEntityType.PERSONA_FISICA && (
                <>
                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityProofOfAddressFiles"
                      form={form}
                      label="Comprobante de Domicilio a nombre de Persona Física"
                      required={false}
                      additionalNote="Vigente, no más de 3 meses"
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityBankStatementFiles"
                      form={form}
                      label="Carátula de Estado de cuenta de Persona Física"
                      required={false}
                    />
                  </div>
                </>
              )}

              {/* PERSONA MORAL specific fields */}
              {legalEntityType === LegalEntityType.PERSONA_MORAL && (
                <>
                  <div className="col-span-6">
                    <FileUploadField
                      name="articlesOfIncorporationFiles"
                      form={form}
                      label="Acta Constitutiva de Persona Moral"
                      required={false}
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="publicRegistryRegistrationFiles"
                      form={form}
                      label="Inscripción al Registro Público de Persona Moral"
                      required={false}
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityTaxSituationFiles"
                      form={form}
                      label="Constancia de Situación Fiscal de Persona Moral"
                      required={false}
                      additionalNote="Vigente, no más de 3 meses"
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityProofOfAddressFiles"
                      form={form}
                      label="Comprobante de Domicilio a nombre de Persona Moral"
                      required={false}
                      additionalNote="Vigente, no más de 3 meses"
                    />
                  </div>

                  <div className="col-span-6">
                    <FileUploadField
                      name="legalEntityBankStatementFiles"
                      form={form}
                      label="Carátula de Estado de cuenta de Persona Moral"
                      required={false}
                    />
                  </div>
                </>
              )}

              {/* Signed Contract File Upload */}
              <div className="col-span-6">
                <FileUploadField
                  name="signedContractFiles"
                  form={form}
                  label="Contrato Firmado"
                  required={false} // Admins typically have optional uploads
                  maxFiles={1} // Or adjust if multiple versions are allowed through this field
                  // description="Sube el contrato firmado del equipo." // Optional description
                />
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
                  : "Actualizar Documentos"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
