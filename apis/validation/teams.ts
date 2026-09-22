import { currency } from "@/validation/common";
import { BusinessActivityType, LegalEntityType } from "@prisma/client";
import { z } from "zod";

// Define file validation schema
const fileSchema = z
  .custom<File>()
  .refine((file) => file instanceof File, "Por favor selecciona un archivo")
  .refine(
    (file) => file.size <= 100 * 1024 * 1024, // 100MB
    "El archivo no puede ser mayor a 100MB",
  )
  .refine(
    (file) =>
      ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(
        file.type,
      ),
    "Solo se aceptan archivos JPG, PNG o PDF",
  );

const teamShape = {
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  phoneNumber: z
    .string()
    .min(10, "El número debe tener 10 dígitos")
    .max(10, "El número debe tener 10 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
  name: z.string().min(4, "Al menos 4 caracteres"),
  legalEntityType: z.nativeEnum(LegalEntityType),
  totalTerminals: z.number().int().min(1, "Debe ser al menos 1"),
  machineModelBrand: z.string().min(1, "Este campo es requerido"),
  terminalSerialDigits: z.string().min(1, "Este campo es requerido"),
  website: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val))
    // .refine((val) => val === null || z.string().url().safeParse(val).success, {
    //   message: "URL inválida",
    // })
    .optional(),
  productServiceDescription: z
    .string()
    .trim()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  businessActivities: z
    .array(
      z.object({
        type: z.nativeEnum(BusinessActivityType),
        customName: z
          .string()
          .trim()
          .max(100, "El nombre personalizado no puede exceder 100 caracteres")
          .optional()
          .nullable(),
      }),
    )
    .min(1, "Debe seleccionar al menos un giro de negocio"),
  businessOperationProofFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo")
    .max(10, "No puedes subir más de 10 archivos"),
  legalRepresentativeIdFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo")
    .max(5, "No puedes subir más de 5 archivos"),
  taxSituationFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo")
    .max(5, "No puedes subir más de 5 archivos"),
  articlesOfIncorporationFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo")
    .max(5, "No puedes subir más de 5 archivos"),
  publicRegistryRegistrationFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo"),
  legalEntityTaxSituationFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo"),
  legalEntityProofOfAddressFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo"),
  legalEntityBankStatementFiles: z
    .array(fileSchema)
    .min(1, "Debe subir al menos un archivo"),
};

// TODO: use the teamShape to create the rest of the schemas

export const teamCreateSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  phoneNumber: z
    .string()
    .min(10, "El número debe tener 10 dígitos")
    .max(10, "El número debe tener 10 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),

  name: z.string().min(4, "Al menos 4 caracteres"),
  legalEntityType: z.nativeEnum(LegalEntityType),
  totalTerminals: z.number().int().min(1, "Debe ser al menos 1"),
  machineModelBrand: z.string().min(1, "Este campo es requerido"),
  terminalSerialDigits: z.string().min(1, "Este campo es requerido"),
});

export const teamManageSchema = z.object({
  /**
   * The team slug
   */
  slug: z.string().min(4, "At least 4 characters"),
  /**
   * The team name
   */
  name: z.string().min(3, "At least 3 characters"),
  /**
   * The Pharos merchant code
   */
  pharosMerchantCode: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val)),
  /**
   *
   * Cost per machine
   */
  costPerMachineCents: currency,
  /**
   * Legal entity type
   */
  legalEntityType: z.nativeEnum(LegalEntityType, {
    message: "Tipo de entidad legal requerido",
  }),
  /**
   * Total number of terminals
   */
  totalTerminals: z.number().int().min(1, "Debe ser al menos 1"),
  /**
   * Machine model and brand
   */
  machineModelBrand: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val)),
  /**
   * Terminal serial digits
   */
  terminalSerialDigits: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val)),
  /**
   * Website URL
   */
  website: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val))
    // .refine((val) => val === null || z.string().url().safeParse(val).success, {
    //   message: "URL inválida",
    // })
    .optional(),
  /**
   * Product or service description
   */
  productServiceDescription: z
    .string()
    .trim()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  /**
   * Legal representative name
   */
  legalRepresentativeName: z
    .string()
    .trim()
    .min(
      3,
      "El nombre del representante legal debe tener al menos 3 caracteres",
    )
    .optional()
    .nullable()
    .transform((val) => (val == null || val === "" ? null : val.trim())),
  /**
   * Contact number
   */
  contactNumber: z
    .string()
    .min(10, "El número de contacto debe tener 10 dígitos")
    .max(10, "El número de contacto debe tener 10 dígitos")
    .regex(/^\d+$/, "Solo se permiten números para el contacto")
    .optional()
    .nullable()
    .transform((val) => (val == null || val === "" ? null : val.trim())),
  /**
   * Business activities
   */
  businessActivities: z
    .array(
      z
        .object({
          type: z.nativeEnum(BusinessActivityType),
          customName: z
            .string()
            .trim()
            .min(1, "El nombre personalizado debe tener al menos 1 caracter")
            .max(100, "El nombre personalizado no puede exceder 100 caracteres")
            .optional()
            .nullable(),
        })
        .refine(
          (data) => {
            // If type is OTHER, customName is required
            if (data.type === BusinessActivityType.OTHER && !data.customName) {
              return false;
            }
            return true;
          },
          {
            message:
              "El nombre personalizado es requerido cuando se selecciona 'Otro'",
            path: ["customName"],
          },
        ),
    )
    .optional(),
});

/**
 * Schema used to validate the team sales export action
 */
export const teamSalesExportSchema = z.object({
  teamSlug: z.string(),
  from: z.string(),
  to: z.string(),
  machineIds: z.array(z.string()).optional(),
});

export const teamMemberCreateSchema = z.object({
  teamSlug: z.string(),
  email: z.string().email("Correo electrónico inválido"),
});

export const teamMemberRemoveSchema = z.object({
  teamSlug: z.string(),
  userId: z.string(),
});

/**
 * Schema factory function for team document uploads
 * Creates a schema with conditional validation based on the legal entity type
 */
export const createTeamDocumentsSchema = (
  legalEntityType: LegalEntityType | null,
) => {
  return z.object({
    slug: z.string(),
    website: z
      .union([z.string().trim().max(256), z.null()])
      .transform((val) => (val === "" ? null : val))
      // .refine(
      //   (val) => val === null || z.string().url().safeParse(val).success,
      //   { message: "URL inválida" }
      // )
      .optional(),
    productServiceDescription: z
      .string()
      .trim()
      .min(1, "La descripción del producto o servicio es requerida")
      .max(500, "La descripción no puede exceder 500 caracteres"),
    businessActivities: z
      .array(
        z
          .object({
            type: z.nativeEnum(BusinessActivityType),
            customName: z
              .string()
              .trim()
              .min(1, "El nombre personalizado debe tener al menos 1 caracter")
              .max(
                100,
                "El nombre personalizado no puede exceder 100 caracteres",
              )
              .optional()
              .nullable(),
          })
          .refine(
            (data) => {
              // If type is OTHER, customName is required
              if (
                data.type === BusinessActivityType.OTHER &&
                !data.customName
              ) {
                return false;
              }
              return true;
            },
            {
              message:
                "El nombre personalizado es requerido cuando se selecciona 'Otro'",
              path: ["customName"],
            },
          ),
      )
      .min(1, "Debe seleccionar al menos un giro de negocio"),
    // Common file upload fields - always required
    businessOperationProofFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(10, "No puedes subir más de 10 archivos"),
    legalRepresentativeIdFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(5, "No puedes subir más de 5 archivos"),
    taxSituationFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(5, "No puedes subir más de 5 archivos"),
    // "Persona Moral" file upload fields - conditionally required
    articlesOfIncorporationFiles:
      legalEntityType === LegalEntityType.PERSONA_MORAL
        ? z
            .array(fileSchema)
            .min(1, "Debe subir al menos un archivo")
            .max(5, "No puedes subir más de 5 archivos")
        : z.array(fileSchema).max(5).optional(),
    publicRegistryRegistrationFiles:
      legalEntityType === LegalEntityType.PERSONA_MORAL
        ? z
            .array(fileSchema)
            .min(1, "Debe subir al menos un archivo")
            .max(5, "No puedes subir más de 5 archivos")
        : z.array(fileSchema).max(5).optional(),
    legalEntityTaxSituationFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(5, "No puedes subir más de 5 archivos"),
    legalEntityProofOfAddressFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(5, "No puedes subir más de 5 archivos"),
    legalEntityBankStatementFiles: z
      .array(fileSchema)
      .min(1, "Debe subir al menos un archivo")
      .max(5, "No puedes subir más de 5 archivos"),
    legalRepresentativeName: z
      .string({
        required_error: "El nombre del representante legal es requerido.",
      })
      .trim()
      .min(
        3,
        "El nombre del representante legal debe tener al menos 3 caracteres",
      ),
    electronicSignature: z
      .string({ required_error: "La firma es requerida." })
      .min(1, "La firma es requerida"),
  });
};

/**
 * Default schema for team document uploads (backward compatibility)
 */
export const teamDocumentsSchema = createTeamDocumentsSchema(null);

/**
 * Schema for server-side validation of team documents update
 * This schema doesn't include file validation since files are handled separately
 */
export const teamDocumentsServerSchema = z.object({
  slug: z.string(),
  website: z
    .union([z.string().trim().max(256), z.null()])
    .transform((val) => (val === "" ? null : val)),
  productServiceDescription: z
    .string()
    .trim()
    .min(1, "La descripción del producto o servicio es requerida")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  businessActivities: z
    .array(
      z
        .object({
          type: z.nativeEnum(BusinessActivityType),
          customName: z
            .string()
            .trim()
            .min(1, "El nombre personalizado debe tener al menos 1 caracter")
            .max(100, "El nombre personalizado no puede exceder 100 caracteres")
            .optional()
            .nullable(),
        })
        .refine(
          (data) => {
            // If type is OTHER, customName is required
            if (data.type === BusinessActivityType.OTHER && !data.customName) {
              return false;
            }
            return true;
          },
          {
            message:
              "El nombre personalizado es requerido cuando se selecciona 'Otro'",
            path: ["customName"],
          },
        ),
    )
    .min(1, "Debe seleccionar al menos un giro de negocio"),
  legalRepresentativeName: z
    .string({
      required_error: "El nombre del representante legal es requerido.",
    })
    .trim()
    .min(
      3,
      "El nombre del representante legal debe tener al menos 3 caracteres",
    ),
  electronicSignature: z.string().optional(),
});

/**
 * Schema factory function for admin team document uploads
 * Creates a schema with optional file fields for admin use
 */
export const createAdminTeamDocumentsSchema = (
  legalEntityType: LegalEntityType | null,
) => {
  return z.object({
    slug: z.string(),
    website: z
      .union([z.string().trim().max(256), z.null()])
      .transform((val) => (val === "" ? null : val))
      .optional(),
    productServiceDescription: z
      .string()
      .trim()
      .max(500, "La descripción no puede exceder 500 caracteres")
      .optional(),
    businessActivities: z
      .array(
        z
          .object({
            type: z.nativeEnum(BusinessActivityType),
            customName: z
              .string()
              .trim()
              .min(1, "El nombre personalizado debe tener al menos 1 caracter")
              .max(
                100,
                "El nombre personalizado no puede exceder 100 caracteres",
              )
              .optional()
              .nullable(),
          })
          .refine(
            (data) => {
              // If type is OTHER, customName is required
              if (
                data.type === BusinessActivityType.OTHER &&
                !data.customName
              ) {
                return false;
              }
              return true;
            },
            {
              message:
                "El nombre personalizado es requerido cuando se selecciona 'Otro'",
              path: ["customName"],
            },
          ),
      )
      .optional(),

    // Common file upload fields - all optional for admins
    businessOperationProofFiles: z
      .array(fileSchema)
      .max(10, "No puedes subir más de 10 archivos")
      .optional(),
    legalRepresentativeIdFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    taxSituationFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),

    // "Persona Moral" file upload fields - all optional
    articlesOfIncorporationFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    publicRegistryRegistrationFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    legalEntityTaxSituationFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    legalEntityProofOfAddressFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    legalEntityBankStatementFiles: z
      .array(fileSchema)
      .max(5, "No puedes subir más de 5 archivos")
      .optional(),
    signedContractFiles: z // Add this
      .array(fileSchema)
      .max(1, "Solo puedes subir un archivo de contrato firmado") // Or more if needed
      .optional(),
  });
};

/**
 * Default admin schema for team document uploads
 */
export const adminTeamDocumentsSchema = createAdminTeamDocumentsSchema(null);

/**
 * Schema for deleting a team document
 */
export const teamDocumentDeleteSchema = z.object({
  documentId: z.string().min(1, "ID del documento es requerido"),
  teamSlug: z.string().min(1, "Slug del equipo es requerido"),
});
