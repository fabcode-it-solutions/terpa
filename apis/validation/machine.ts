import {
  currencyFromZero,
  decimalString,
  numericString,
  optionalStringFloat,
} from "@/validation/common";
import {
  MachineProtocol,
  MachineType,
  TerminalFlowType,
  TerminalLanguage,
  TerminalType,
} from "@prisma/client";
import { z } from "zod";

/**
 * Schema used to validate the machine creation action
 */
export const machineCreateSchema = z.object({
  /**
   * The team's slug where the machine will be created
   */
  teamSlug: z.string(),
  /**
   * The machine name
   */
  name: z
    .string()
    .min(4, "Al menos 4 caracteres")
    .max(50, "Máximo 50 caracteres")
    .trim(),
  /**
   * The machine's terminal serial number
   */
  terminalSerialNumber: z
    .string()
    .toUpperCase()
    .min(4, "Al menos 4 caracteres")
    .max(50, "Máximo 50 caracteres")
    .trim(),
  /**
   * The machine type
   */
  type: z.nativeEnum(MachineType).default("VENDING"),
});

/**
 * Schema used to validate the machine deletion action
 */
export const machineDeleteSchema = z.object({
  /**
   * The team's slug where the machine will be deleted
   */
  teamSlug: z.string(),
  /**
   * The machine's id
   */
  machineId: z.string().uuid(),
});

export const machineSettingsSchema = z.object({
  /**
   * The team's slug where the machine is located
   */
  teamSlug: z.string(),
  /**
   * The machine's id
   */
  machineId: z.string().uuid(),
  /**
   * The machine's name
   */
  name: z
    .string()
    .min(4, "Al menos 4 caracteres")
    .max(50, "Máximo 50 caracteres")
    .trim(),
  /**
   * The machine's terminal serial number
   */
  terminalSerialNumber: z
    .union([z.string().trim().max(256), z.null()])
    .transform((v) => (v === "" ? null : v)),
  /**
   * The machine's communication protocol
   */
  protocol: z.nativeEnum(MachineProtocol),
});

/**
 * Schema used to validate the machine location form
 */
export const machineLocationSchema = z.object({
  machineId: z.string().uuid(),
  teamSlug: z.string(),
  lat: optionalStringFloat,
  lon: optionalStringFloat,
});

/**
 * Schema used to validate enabling remote sales for a machine
 */
export const machineRemoteSaleToggleSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
});

/**
 * Schema used to validate the machine reconciliation action
 */
export const machineReconcileSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
});

/**
 * Schema used to validate the machine sales export action
 */
export const machineSalesExportSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
});

/**
 * Schema for exporting terminal transactions
 */
export const machineTerminalExportSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
});

/**
 * Schema used to validate the machine incident creation API
 */
export const machineIncidentCreateSchema = z.object({
  message: z.string().trim().max(512),
});

/**
 * Schema used to validate the machine incident resolution API
 */
export const machineIncidentResolveSchema = z.object({
  incidentId: z.string().uuid(),
});

const terminalShape = {
  serialNumber: z.string().trim().max(256).min(1, "El serial es requerido"),
  terminalCode: z
    .string()
    .trim()
    .max(256)
    .min(1, "El código de terminal es requerido"),
  merchantCode: z
    .string()
    .trim()
    .max(256)
    .min(1, "El código de comercio es requerido"),
  description: z.string().trim().max(256).min(1, "Campo requerido"),
  initialCredit: numericString,
  flowType: z.nativeEnum(TerminalFlowType),
  language: z.nativeEnum(TerminalLanguage),
  acceptCreditPayments: z.boolean(),
  acceptCashPayments: z.boolean(),
  acceptServicePayments: z.boolean(),
  decimalMode: decimalString,
  repeat: z.boolean().default(false),
  type: z.nativeEnum(TerminalType),
  username: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  password: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  endpointUrl: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  fixedComissionCents: currencyFromZero,
  percentageCommission: decimalString,
  nip: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  key: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  extra1: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
  extra2: z.union([
    z
      .string()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    z.null(),
  ]),
};

/**
 * Schema used to validate the terminal create action
 */
export const terminalCreateSchema = z
  .object({
    type: terminalShape.type,
    serialNumber: terminalShape.serialNumber,
    terminalCode: terminalShape.terminalCode,
    merchantCode: terminalShape.merchantCode,
    description: terminalShape.description,
    initialCredit: terminalShape.initialCredit,
    flowType: terminalShape.flowType,
    language: terminalShape.language,
    acceptCreditPayments: terminalShape.acceptCreditPayments,
    acceptCashPayments: terminalShape.acceptCashPayments,
    acceptServicePayments: terminalShape.acceptServicePayments,
    decimalMode: terminalShape.decimalMode,
    repeat: terminalShape.repeat,
    username: terminalShape.username,
    password: terminalShape.password,
    endpointUrl: terminalShape.endpointUrl,
    fixedComissionCents: terminalShape.fixedComissionCents,
    percentageCommission: terminalShape.percentageCommission,
    nip: terminalShape.nip,
    key: terminalShape.key,
    extra1: terminalShape.extra1,
    extra2: terminalShape.extra2,
  })
  .refine(
    (data) => {
      if (data.acceptServicePayments) {
        return (
          data.percentageCommission !== null &&
          data.nip !== null &&
          data.nip !== "" &&
          data.key !== null &&
          data.key !== ""
        );
      }
      return true;
    },
    {
      message:
        "Para habilitar pago de servicios se requieren los campos: comisión variable, nip y key",
      path: ["acceptServicePayments"],
    },
  );

/**
 * Scheam used to validate the terminal update action
 */
export const terminalUpdateSchema = z
  .object({
    id: z.string().uuid(),
    type: terminalShape.type,
    serialNumber: terminalShape.serialNumber,
    terminalCode: terminalShape.terminalCode,
    merchantCode: terminalShape.merchantCode,
    description: terminalShape.description,
    initialCredit: terminalShape.initialCredit,
    flowType: terminalShape.flowType,
    language: terminalShape.language,
    acceptCreditPayments: terminalShape.acceptCreditPayments,
    acceptCashPayments: terminalShape.acceptCashPayments,
    acceptServicePayments: terminalShape.acceptServicePayments,
    decimalMode: terminalShape.decimalMode,
    username: terminalShape.username,
    password: terminalShape.password,
    endpointUrl: terminalShape.endpointUrl,
    fixedComissionCents: terminalShape.fixedComissionCents,
    percentageCommission: terminalShape.percentageCommission,
    nip: terminalShape.nip,
    key: terminalShape.key,
    extra1: terminalShape.extra1,
    extra2: terminalShape.extra2,
  })
  .refine(
    (data) => {
      if (data.acceptServicePayments) {
        return (
          data.percentageCommission !== null &&
          data.nip !== null &&
          data.nip !== "" &&
          data.key !== null &&
          data.key !== ""
        );
      }
      return true;
    },
    {
      message:
        "Para habilitar pago de servicios se requieren los campos: comisión variable, nip y key",
      path: ["acceptServicePayments"],
    },
  );

export const machineAssignSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().min(1).uuid(),
  userId: z.string().uuid(),
});

export const machineUnassignSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const machineAdminSchema = z.object({
  teamSlug: z.string(),
  machineId: z.string().uuid(),
  activeUntilDate: z.string().date(),
  isEnabled: z.boolean(),
});

export const machineAdminExpirationDateSchema = z.object({
  machineId: z.string().uuid(),
  activeUntilDate: z.date(),
});
