import { TeamDocumentType } from "@prisma/client";

export const documentTypeLabels: Record<TeamDocumentType, string> = {
  BUSINESS_OPERATION_PROOF: "Prueba de Operación de Negocio",
  LEGAL_REPRESENTATIVE_ID: "Identificación del Representante Legal",
  TAX_SITUATION:
    "Constancia de Situación Fiscal (Persona Física/Representante Legal)",
  ARTICLES_OF_INCORPORATION: "Acta Constitutiva",
  PUBLIC_REGISTRY_REGISTRATION: "Inscripción al Registro Público",
  LEGAL_ENTITY_TAX_SITUATION: "Constancia de Situación Fiscal (Persona Moral)",
  LEGAL_ENTITY_PROOF_OF_ADDRESS: "Comprobante de Domicilio",
  LEGAL_ENTITY_BANK_STATEMENT: "Estado de Cuenta Bancario",
  SIGNED_CONTRACT: "Contrato Firmado",
};

// Document types that are only applicable for PERSONA_MORAL
export const personaMoralDocumentTypes: TeamDocumentType[] = [
  TeamDocumentType.ARTICLES_OF_INCORPORATION,
  TeamDocumentType.PUBLIC_REGISTRY_REGISTRATION,
  TeamDocumentType.LEGAL_ENTITY_TAX_SITUATION,
  TeamDocumentType.LEGAL_ENTITY_PROOF_OF_ADDRESS,
  TeamDocumentType.LEGAL_ENTITY_BANK_STATEMENT,
];

// Format file size to human-readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};
