import { z } from "zod";

// Client Address Schema
export const ClientAddressSchema = z.object({
  Street: z.string().optional(),
  ExteriorNumber: z.string().optional(),
  InteriorNumber: z.string().optional(),
  Neighborhood: z.string().optional(),
  ZipCode: z.string().optional(),
  Locality: z.string().optional(),
  Municipality: z.string().optional(),
  State: z.string().optional(),
  Country: z.string().optional(),
});

// Create Client Request Schema
export const CreateClientRequestSchema = z.object({
  Email: z
    .string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("Ingresa un email válido")
    .max(200, "El email no puede exceder 200 caracteres"),
  Rfc: z
    .string({ required_error: "El RFC es requerido" })
    .min(1, "El RFC es requerido"),
  Name: z
    .string({ required_error: "La razón social es requerida" })
    .min(1, "La razón social es requerida")
    .max(300, "La razón social no puede exceder 300 caracteres"),
  CfdiUse: z
    .string({ required_error: "El uso de CFDI es requerido" })
    .min(1, "El uso de CFDI es requerido"),
  FiscalRegime: z
    .string({ required_error: "El régimen fiscal es requerido" })
    .min(1, "El régimen fiscal es requerido"),
  TaxZipCode: z
    .string({ required_error: "El código postal es requerido" })
    .min(1, "El código postal es requerido")
    .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos")
    .max(5, "El código postal no puede exceder 5 caracteres"),
});

// Create Client Response Schema
export const CreateClientResponseSchema = z.object({
  Id: z.string(),
  Address: ClientAddressSchema.optional(),
  Rfc: z.string(),
  Name: z.string(),
  Email: z.string(),
  CfdiUse: z.string(),
  FiscalRegime: z.string(),
  TaxZipCode: z.string().optional(),
  EmailOp1: z.string().optional(),
  EmailOp2: z.string().optional(),
  TaxResidence: z.string().optional(),
  NumRegIdTrib: z.string().optional(),
});

// Get Client Response Schema
export const GetClientResponseSchema = z.object({
  Id: z.string(),
  Address: ClientAddressSchema.optional(),
  Rfc: z.string(),
  Name: z.string(),
  Email: z.string(),
  CfdiUse: z.string(),
  FiscalRegime: z.string(),
  TaxZipCode: z.string().optional(),
  EmailOp1: z.string().optional(),
  EmailOp2: z.string().optional(),
  TaxResidence: z.string().optional(),
  NumRegIdTrib: z.string().optional(),
});

// Update Client Request Schema
export const UpdateClientRequestSchema = z.object({
  Email: z
    .string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("Ingresa un email válido")
    .max(200, "El email no puede exceder 200 caracteres"),
  Rfc: z
    .string({ required_error: "El RFC es requerido" })
    .min(1, "El RFC es requerido"),
  Name: z
    .string({ required_error: "La razón social es requerida" })
    .min(1, "La razón social es requerida")
    .max(300, "La razón social no puede exceder 300 caracteres"),
  CfdiUse: z
    .string({ required_error: "El uso de CFDI es requerido" })
    .min(1, "El uso de CFDI es requerido"),
  FiscalRegime: z
    .string({ required_error: "El régimen fiscal es requerido" })
    .min(1, "El régimen fiscal es requerido"),
  TaxZipCode: z
    .string({ required_error: "El código postal fiscal es requerido" })
    .min(1, "El código postal fiscal es requerido")
    .regex(/^\d{5}$/, "El código postal debe ser de 5 dígitos"),
});

// Fiscal Regime Schema
export const FiscalRegimeSchema = z.object({
  Natural: z.boolean(),
  Moral: z.boolean(),
  Name: z.string(),
  Value: z.string(),
});

// CFDI Use Schema
export const CfdiUseSchema = z.object({
  Natural: z.boolean(),
  Moral: z.boolean(),
  Name: z.string(),
  Value: z.string(),
});

// CFDI Receiver Schema
export const CfdiReceiverSchema = z.object({
  Rfc: z.string(),
  CfdiUse: z.string(),
  Name: z.string(),
  FiscalRegime: z.string(),
  TaxZipCode: z.string(),
});

// CFDI Tax Schema
export const CfdiTaxSchema = z.object({
  Total: z.number(),
  Name: z.string(),
  Base: z.number(),
  Rate: z.number(),
  IsRetention: z.boolean(),
});

// CFDI Item Schema
export const CfdiItemSchema = z.object({
  ProductCode: z.string(),
  Description: z.string(),
  UnitCode: z.string(),
  UnitPrice: z.number(),
  Quantity: z.number(),
  Subtotal: z.number(),
  TaxObject: z.string(),
  Taxes: z.array(CfdiTaxSchema),
  Total: z.number(),
});

// CFDI Request Schema
export const CfdiRequestSchema = z.object({
  CfdiType: z.string(),
  Currency: z.string(),
  PaymentForm: z.string(),
  PaymentMethod: z.string(),
  ExpeditionPlace: z.string(),
  Date: z.string(),
  Receiver: CfdiReceiverSchema,
  Items: z.array(CfdiItemSchema),
});

// CFDI Response Schema
export const CfdiResponseSchema = z.object({
  Id: z.string(),
  CfdiType: z.string(),
  Type: z.string(),
  Serie: z.string().optional(),
  Folio: z.string(),
  Date: z.string(),
  CertNumber: z.string(),
  PaymentTerms: z.string(),
  PaymentMethod: z.string(),
  PaymentAccountNumber: z.string().optional(),
  PaymentBankName: z.string().optional(),
  ExpeditionPlace: z.string(),
  ExchangeRate: z.number(),
  Currency: z.string(),
  Subtotal: z.number(),
  Discount: z.number(),
  Total: z.number(),
  Observations: z.string().optional(),
  Issuer: z.object({
    FiscalRegime: z.string(),
    Rfc: z.string(),
    TaxName: z.string(),
    Email: z.string().optional(),
    Phone: z.string().optional(),
    TaxAddress: ClientAddressSchema.optional(),
    IssuedIn: ClientAddressSchema.optional(),
  }),
  Receiver: z.object({
    Rfc: z.string(),
    Name: z.string(),
    Email: z.string().optional(),
  }),
  Items: z.array(
    z.object({
      ProductCode: z.string(),
      UnitCode: z.string(),
      Discount: z.number(),
      CuentaPredial: z.string().optional(),
      Quantity: z.number(),
      Unit: z.string(),
      Description: z.string(),
      UnitValue: z.number(),
      Total: z.number(),
    }),
  ),
  Taxes: z.array(
    z.object({
      Total: z.number(),
      Name: z.string(),
      Rate: z.number(),
      Type: z.string(),
    }),
  ),
  Complement: z.object({
    TaxStamp: z.object({
      Uuid: z.string(),
      Date: z.string(),
      CfdiSign: z.string(),
      SatCertNumber: z.string(),
      SatSign: z.string(),
      RfcProvCertif: z.string(),
    }),
  }),
  Status: z.string(),
  OriginalString: z.string(),
});

// CFDI Download Response Schema
export const CfdiDownloadResponseSchema = z.object({
  ContentEncoding: z.string(),
  ContentType: z.string(),
  ContentLength: z.number(),
  Content: z.string(), // base64 encoded content
});

export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>;
export type CreateClientResponse = z.infer<typeof CreateClientResponseSchema>;
export type GetClientResponse = z.infer<typeof GetClientResponseSchema>;
export type UpdateClientRequest = z.infer<typeof UpdateClientRequestSchema>;
export type ClientAddress = z.infer<typeof ClientAddressSchema>;
export type FiscalRegime = z.infer<typeof FiscalRegimeSchema>;
export type CfdiUse = z.infer<typeof CfdiUseSchema>;
export type CfdiReceiver = z.infer<typeof CfdiReceiverSchema>;
export type CfdiTax = z.infer<typeof CfdiTaxSchema>;
export type CfdiItem = z.infer<typeof CfdiItemSchema>;
export type CfdiRequest = z.infer<typeof CfdiRequestSchema>;
export type CfdiResponse = z.infer<typeof CfdiResponseSchema>;
export type CfdiDownloadResponse = z.infer<typeof CfdiDownloadResponseSchema>;
