"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import logger from "@/utils/logger";
import { machineIncidentResolveSchema } from "@/validation/machine";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Resolves an incident by an admin user
 */
export async function machineIncidentResolveAction(payload: unknown) {
  const session = requireSession();
  const parsed = machineIncidentResolveSchema.parse(payload);

  // user must be admin
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "incident.machineIncidentResolveAction.unauthorized",
      userId: session.uid,
      incidentId: parsed.incidentId,
    });
    return { error: "No tienes permisos para resolver incidentes." };
  }

  logger.info({
    event: "incident.machineIncidentResolveAction.start",
    userId: session.uid,
    incidentId: parsed.incidentId,
  });

  // update the incident
  await prisma.incident.update({
    where: { id: parsed.incidentId },
    data: {
      resolvedAt: new Date(),
      resolvedByUserId: session.uid,
    },
  });

  logger.info({
    event: "incident.machineIncidentResolveAction.success",
    userId: session.uid,
    incidentId: parsed.incidentId,
  });

  // revalidate page and return success
  revalidatePath(`/`, "layout");
  return { success: true };
}

/**
 * Resolves all incidents by an admin user
 * If machineId is provided, only resolves incidents for that machine
 */
export async function machineIncidentResolveAllAction(machineId?: string) {
  const session = requireSession();

  // user must be admin
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "incident.machineIncidentResolveAllAction.unauthorized",
      userId: session.uid,
      machineId,
    });
    return { error: "No tienes permisos para resolver incidentes." };
  }

  logger.info({
    event: "incident.machineIncidentResolveAllAction.start",
    userId: session.uid,
    machineId,
  });

  // update all incidents, filtered by machineId if provided
  const result = await prisma.incident.updateMany({
    where: {
      resolvedAt: null,
      ...(machineId ? { machineId } : {}),
    },
    data: {
      resolvedAt: new Date(),
      resolvedByUserId: session.uid,
    },
  });

  logger.info({
    event: "incident.machineIncidentResolveAllAction.success",
    userId: session.uid,
    machineId,
    updatedCount: result.count,
  });

  // revalidate page and return success
  revalidatePath(`/`, "layout");
  return { success: true };
}
