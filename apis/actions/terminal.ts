"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  terminalCreateSchema,
  terminalUpdateSchema,
} from "@/validation/machine";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Action to create a new terminal
 */
export async function terminalCreateAction(payload: unknown) {
  const parsed = terminalCreateSchema.parse(payload);
  const session = requireSession();
  if (session.role !== UserRole.ADMIN)
    return {
      success: false,
      errorType: "AUTH_ERROR",
      message: "No tienes permisos para crear terminales.",
    };

  // Check if the terminal serial number already exists
  const existingTerminal = await prisma.terminal.findUnique({
    where: { serialNumber: parsed.serialNumber },
    select: { id: true },
  });

  if (existingTerminal) {
    return {
      success: false,
      errorType: "DUPLICATE_SERIAL_NUMBER",
      message: "El número de serie ya está en uso.",
    };
  }

  const terminal = await prisma.terminal.create({
    select: { id: true },
    data: {
      type: parsed.type,
      serialNumber: parsed.serialNumber,
      pharosTerminalCode: parsed.terminalCode,
      pharosMerchantCode: parsed.merchantCode,
      description: parsed.description,
      initialCredit: parsed.initialCredit,
      flowType: parsed.flowType,
      language: parsed.language,
      acceptCreditPayments: parsed.acceptCreditPayments,
      acceptCashPayments: parsed.acceptCashPayments,
      acceptServicePayments: parsed.acceptServicePayments,
      decimalMode: parsed.decimalMode,
      username: parsed.username,
      password: parsed.password,
      endpointUrl: parsed.endpointUrl,
      fixedComissionCents: parsed.fixedComissionCents,
      percentageCommission: parsed.percentageCommission,
      nip: parsed.nip,
      key: parsed.key,
      extra1: parsed.extra1,
      extra2: parsed.extra2,
    },
  });

  revalidatePath("/", "layout");
  return { success: true, id: terminal.id };
}

/**
 * Action to update a terminal
 */
export async function terminalUpdateAction(payload: unknown) {
  const parsed = terminalUpdateSchema.parse(payload);
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) return redirect("/");

  // Check if the terminal serial is used by another terminal
  const existing = await prisma.terminal.findUnique({
    where: { serialNumber: parsed.serialNumber },
  });

  if (existing && existing.id !== parsed.id) {
    return { success: false, error: "El serial ya existe en otra terminal." };
  }

  const terminal = await prisma.terminal.update({
    where: { id: parsed.id },
    data: {
      type: parsed.type,
      serialNumber: parsed.serialNumber,
      pharosTerminalCode: parsed.terminalCode,
      pharosMerchantCode: parsed.merchantCode,
      description: parsed.description,
      initialCredit: parsed.initialCredit,
      flowType: parsed.flowType,
      language: parsed.language,
      acceptCreditPayments: parsed.acceptCreditPayments,
      acceptCashPayments: parsed.acceptCashPayments,
      acceptServicePayments: parsed.acceptServicePayments,
      decimalMode: parsed.decimalMode,
      username: parsed.username,
      password: parsed.password,
      endpointUrl: parsed.endpointUrl,
      fixedComissionCents: parsed.fixedComissionCents,
      percentageCommission: parsed.percentageCommission,
      nip: parsed.nip,
      key: parsed.key,
      extra1: parsed.extra1,
      extra2: parsed.extra2,
    },
  });

  revalidatePath("/", "layout");
  return { success: true, id: terminal.id };
}
