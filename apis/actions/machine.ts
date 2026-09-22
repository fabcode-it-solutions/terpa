"use server";

import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getSession, requireSession } from "@/lib/session";
import { getTeamMachine } from "@/loaders/machine";
import { getTeamBySlug, getTeamBySlugCached } from "@/loaders/team";
import { getParsedReportById, getReportById } from "@/service/dex";
import { pharos } from "@/service/pharos";
import logger from "@/utils/logger";
import {
  machineAdminExpirationDateSchema,
  machineAdminSchema,
  machineAssignSchema,
  machineCreateSchema,
  machineDeleteSchema,
  machineLocationSchema,
  machineReconcileSchema,
  machineRemoteSaleToggleSchema,
  machineSalesExportSchema,
  machineSettingsSchema,
  machineTerminalExportSchema,
  machineUnassignSchema,
} from "@/validation/machine";
import { MachineProtocol, TeamMemberRole, UserRole } from "@prisma/client";
import { stringify } from "csv-stringify/sync";
import {
  add,
  differenceInDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import pMap from "p-map";

/**
 * Action to create a new machine
 */
export async function machineCreateAction(payload: unknown) {
  const session = requireSession();
  const parsed = machineCreateSchema.parse(payload);
  const team = await getTeamBySlugCached(parsed.teamSlug);

  logger.info({
    event: "machine.machineCreateAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    terminalSerial: parsed.terminalSerialNumber,
    name: parsed.name,
  });

  const existing = await prisma.machine.findUnique({
    where: { terminalSerialNumber: parsed.terminalSerialNumber },
  });

  if (existing) {
    logger.warn({
      event: "machine.machineCreateAction.duplicateTerminal",
      userId: session.uid,
      teamId: team.id,
      terminalSerial: parsed.terminalSerialNumber,
      machineId: existing.id,
    });
    return { error: "Ya existe una máquina con esa terminal." };
  }

  // first day of next month in America/Monterrey
  const currentMonterrey = toZonedTime(new Date(), "America/Monterrey");
  const nextMonth = add(currentMonterrey, { months: 1 });
  const firstDayNextMonth = startOfMonth(nextMonth);

  const created = await prisma.machine.create({
    data: {
      teamId: team.id,
      name: parsed.name,
      terminalSerialNumber: parsed.terminalSerialNumber,
      createdById: session.uid,
      protocol: MachineProtocol.MDB,
      type: parsed.type,
      activeUntilDate: firstDayNextMonth,
    },
  });

  logger.info({
    event: "machine.machineCreateAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: created.id,
    terminalSerial: created.terminalSerialNumber,
    activeUntilDate: created.activeUntilDate,
  });

  revalidatePath("/", "layout");
  redirect(`/team/${team.slug}/machines`);
}

/**
 * Action to update a machine's settings
 */
export async function machineSettingsAction(payload: unknown) {
  const session = requireSession();
  const parsed = machineSettingsSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  logger.info({
    event: "machine.machineSettingsAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    updates: {
      name: parsed.name,
      protocol: parsed.protocol,
      terminalSerialNumber:
        session.role === UserRole.ADMIN
          ? parsed.terminalSerialNumber
          : undefined,
    },
  });

  await prisma.machine.update({
    where: { id: machine.id },
    data: {
      name: parsed.name,
      protocol: parsed.protocol,
      terminalSerialNumber:
        session.role === UserRole.ADMIN
          ? parsed.terminalSerialNumber
          : undefined, // undefined will not update the field
    },
  });

  logger.info({
    event: "machine.machineSettingsAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial:
      session.role === UserRole.ADMIN
        ? parsed.terminalSerialNumber
        : machine.terminalSerialNumber,
  });

  revalidatePath("/", "layout");
}

/**
 * Action to update a machine's location (lat, lon)
 */
export async function machineLocationAction(payload: unknown) {
  const parsed = machineLocationSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  await prisma.machine.update({
    where: { id: machine.id },
    data: { lat: parsed.lat, lon: parsed.lon },
  });

  revalidatePath("/", "layout");
}

/**
 * Action to enable the remote sale feature for a machine
 */
export async function machineRemoteSaleToggleAction(payload: unknown) {
  const parsed = machineRemoteSaleToggleSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);
  const session = requireSession();

  const isRemoteSaleEnabled = !(
    machine.remoteSaleEnabledUntil &&
    new Date() < machine.remoteSaleEnabledUntil
  );

  logger.info({
    event: "machine.machineRemoteSaleToggleAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    enable: isRemoteSaleEnabled,
  });

  await prisma.machine.update({
    where: { id: machine.id },
    data: {
      remoteSaleEnabledUntil: isRemoteSaleEnabled
        ? add(new Date(), { seconds: 45 })
        : null,
    },
  });

  const message = isRemoteSaleEnabled
    ? "La venta remota ha sido activada."
    : "La venta remota ha sido desactivada.";

  logger.info({
    event: "machine.machineRemoteSaleToggleAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    enabledUntil: isRemoteSaleEnabled ? "45s" : null,
  });

  revalidatePath("/", "layout");
  return { message };
}

/**
 * Action to reconcile a machine.
 */
export async function machineReconcileAction(payload: unknown) {
  const parsed = machineReconcileSchema.parse(payload);
  const session = requireSession();
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  logger.info({
    event: "machine.machineReconcileAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
  });

  // Get the latest reconciliation and the latest report
  const [latestReconciliation, latestReport] = await Promise.all([
    prisma.machineReconciliation.findFirst({
      where: { machineId: machine.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dexReport.findFirst({
      where: { machineId: machine.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // If we do not have a report it means we are not yet ready to reconcile
  if (!latestReport) {
    logger.warn({
      event: "machine.machineReconcileAction.noLatestReport",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
    });
    return {
      success: false,
      error: "No se puede hacer un corte de caja sin datos dex",
    };
  }

  // Get the parsed report
  const parsedReport = await getParsedReportById(latestReport.reportId);
  if (!parsedReport?.success) {
    logger.error({
      event: "machine.machineReconcileAction.parseReportError",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
      reportId: latestReport.reportId,
    });
    return {
      success: false,
      error:
        "No se puede utilizar el último reporte para hacer un corte de caja.",
    };
  }

  const cashBoxValueCents =
    parsedReport.report.cash.cashIn - parsedReport.report.cash.cashToTubes;

  // When we don't have a reconciliation, we create a new one starting from
  // the latest report
  if (!latestReconciliation) {
    // If there's no reconciliation, create a new one with the latest report as the starting point
    await prisma.machineReconciliation.create({
      data: {
        machineId: machine.id,
        cashBoxValueCents: cashBoxValueCents,
        reconciliationValueCents: 0,
        createdByUserId: session.uid,
        isReset: true,
      },
    });

    logger.info({
      event: "machine.machineReconcileAction.started",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
      cashBoxValueCents,
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      data: { action: "reconciliation.start" },
    };
  } else {
    // Since we have a reconciliation, we calculate the new reconciliation value
    // by subtracting the latest reconciliation value from the latest report's
    // cashToBox value
    const newReconciliationValue =
      cashBoxValueCents - Number(latestReconciliation.cashBoxValueCents);

    // If the reconciliation value is negative, we reset the reconciliation as
    // that means the cash to box counter has been reset
    if (newReconciliationValue < 0) {
      await prisma.machineReconciliation.create({
        data: {
          machineId: machine.id,
          cashBoxValueCents: cashBoxValueCents,
          reconciliationValueCents: 0,
          createdByUserId: session.uid,
          isReset: true,
        },
      });

      logger.info({
        event: "machine.machineReconcileAction.reset",
        userId: session.uid,
        teamId: team.id,
        machineId: machine.id,
        terminalSerial: machine.terminalSerialNumber,
        cashBoxValueCents,
      });

      revalidatePath("/", "layout");
      return {
        success: true,
        data: { action: "reconciliation.reset" },
      };
    }

    // Otherwise, we create a new reconciliation with the difference and the
    // latest report's cashToBox value
    await prisma.machineReconciliation.create({
      data: {
        machineId: machine.id,
        cashBoxValueCents: cashBoxValueCents,
        reconciliationValueCents: newReconciliationValue,
        createdByUserId: session.uid,
      },
    });

    logger.info({
      event: "machine.machineReconcileAction.created",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
      valueCents: newReconciliationValue,
      cashBoxValueCents,
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      data: {
        action: "reconciliation.create",
        valueCents: newReconciliationValue,
      },
    };
  }
}

/**
 * Action to soft delete a machine
 */
export async function machineDeleteAction(payload: unknown) {
  const parsed = machineDeleteSchema.parse(payload);
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "machine.machineDeleteAction.unauthorized",
      userId: session.uid,
    });
    return redirect("/");
  }
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // Delete the machine using soft deletes and remove all its spirals
  await prisma.$transaction([
    prisma.machine.update({
      where: { id: machine.id },
      data: { deletedAt: new Date(), terminalSerialNumber: null },
    }),
    prisma.machineSpiral.updateMany({
      where: { machineId: machine.id },
      data: { deletedAt: new Date(), machineCode: null },
    }),
  ]);

  logger.info({
    event: "machine.machineDeleteAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
  });

  // Revalidate the app's cache
  revalidatePath("/", "layout");
}

/**
 * Action to export machine sales by date range into a CSV string
 */
export async function machineSalesExportAction(payload: unknown) {
  const session = requireSession();
  const parsed = machineSalesExportSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  if (!machine) {
    return notFound();
  }

  logger.info({
    event: "machine.machineSalesExportAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    from: parsed.from,
    to: parsed.to,
  });

  const timezone = "America/Mexico_City";
  const dateFrom = fromZonedTime(`${parsed.from}T00:00:00`, timezone);
  const dateTo = fromZonedTime(`${parsed.to}T23:59:59.999`, timezone);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      machineId: machine.id,
    },
    select: {
      createdAt: true,
      machineProductCost: true,
      machineProductId: true,
      machineMdbProductId: true,
      paymentMethod: true,
      productName: true,
      productPriceCents: true,
      productSku: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const columns = [
    "Fecha",
    "Producto",
    "SKU",
    "Monto Cobrado",
    "Costo Producto",
    "Método de Pago",
    "Código MDB",
    "Código DEX",
    "Máquina",
  ];

  const csv = stringify(
    [
      columns,
      ...sales.map((sale) => [
        format(toZonedTime(sale.createdAt, timezone), "yyyy-MM-dd HH:mm:ss"),
        sale.productName,
        sale.productSku,
        formatCurrency(sale.machineProductCost || 0),
        sale.productPriceCents ? formatCurrency(sale.productPriceCents) : "",
        sale.paymentMethod,
        sale.machineMdbProductId,
        sale.machineProductId,
        machine.name,
      ]),
    ],
    { header: false },
  );

  logger.info({
    event: "machine.machineSalesExportAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    rows: sales.length,
  });

  return { success: true, data: csv };
}

export async function machineAssignAction(payload: unknown) {
  const parsed = machineAssignSchema.parse(payload);
  const session = requireSession();
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  logger.info({
    event: "machine.machineAssignAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    targetUserId: parsed.userId,
  });

  const sessionMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.uid,
        teamId: team.id,
      },
    },
    select: { role: true },
  });

  // Session member should be team owner or application admin to assign a machine
  const isTeamOwner = sessionMember?.role === TeamMemberRole.OWNER;
  const isAdmin = session.role === UserRole.ADMIN;
  const canAssignMachine = isTeamOwner || isAdmin;

  if (!canAssignMachine) {
    logger.warn({
      event: "machine.machineAssignAction.unauthorized",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
      targetUserId: parsed.userId,
    });
    return {
      success: false,
      error: "No tienes permisos para asignar máquinas.",
    };
  }

  await prisma.userMachine.create({
    data: {
      machineId: machine.id,
      userId: parsed.userId,
    },
  });

  logger.info({
    event: "machine.machineAssignAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    targetUserId: parsed.userId,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function machineUnassignAction(payload: unknown) {
  const parsed = machineUnassignSchema.parse(payload);
  const session = requireSession();
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  logger.info({
    event: "machine.machineUnassignAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    targetUserId: parsed.userId,
  });

  const sessionMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.uid,
        teamId: team.id,
      },
    },
    select: { role: true },
  });

  // Session member should be team owner or application admin to unassign a machine
  const isTeamOwner = sessionMember?.role === TeamMemberRole.OWNER;
  const isAdmin = session.role === UserRole.ADMIN;
  const canUnassignMachine = isTeamOwner || isAdmin;

  if (!canUnassignMachine) {
    logger.warn({
      event: "machine.machineUnassignAction.unauthorized",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
      targetUserId: parsed.userId,
    });
    return {
      success: false,
      error: "No tienes permisos para desasignar máquinas.",
    };
  }

  await prisma.userMachine.delete({
    where: {
      userId_machineId: {
        userId: parsed.userId,
        machineId: machine.id,
      },
    },
  });

  logger.info({
    event: "machine.machineUnassignAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    targetUserId: parsed.userId,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function machineAdminAction(payload: unknown) {
  const parsed = machineAdminSchema.parse(payload);
  const session = requireSession();
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "machine.machineAdminAction.unauthorized",
      userId: session.uid,
      teamId: team.id,
      machineId: machine.id,
      terminalSerial: machine.terminalSerialNumber,
    });
    return {
      success: false,
      error: "No tienes permisos para administrar máquinas.",
    };
  }

  logger.info({
    event: "machine.machineAdminAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    updates: {
      activeUntilDate: parsed.activeUntilDate,
      isEnabled: parsed.isEnabled,
    },
  });

  await prisma.machine.update({
    where: { id: machine.id },
    data: {
      activeUntilDate: new Date(parsed.activeUntilDate),
      isEnabled: parsed.isEnabled,
    },
  });

  logger.info({
    event: "machine.machineAdminAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function machineAdminExpirationDateAction(payload: unknown) {
  const parsed = machineAdminExpirationDateSchema.parse(payload);
  const session = requireSession();

  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "machine.machineAdminExpirationDateAction.unauthorized",
      userId: session.uid,
      machineId: parsed.machineId,
    });
    return {
      success: false,
      error: "No tienes permisos para administrar máquinas.",
    };
  }

  logger.info({
    event: "machine.machineAdminExpirationDateAction.start",
    userId: session.uid,
    machineId: parsed.machineId,
    activeUntilDate: parsed.activeUntilDate,
  });

  await prisma.machine.update({
    where: { id: parsed.machineId },
    data: { activeUntilDate: new Date(parsed.activeUntilDate) },
  });

  logger.info({
    event: "machine.machineAdminExpirationDateAction.success",
    userId: session.uid,
    machineId: parsed.machineId,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function machineDexExportAction(payload: unknown) {
  const { machineId, startDate, endDate } = payload as {
    machineId: string;
    startDate: string;
    endDate: string;
  };

  try {
    const session = getSession();
    logger.info({
      event: "machine.machineDexExportAction.start",
      userId: session?.uid,
      machineId,
      startDate,
      endDate,
    });
    // Validate input
    if (!machineId) {
      logger.warn({
        event: "machine.machineDexExportAction.validation.missingMachineId",
        userId: session?.uid,
      });
      return { error: "Machine ID is required" };
    }

    if (!startDate || !endDate) {
      logger.warn({
        event: "machine.machineDexExportAction.validation.missingDates",
        userId: session?.uid,
        machineId,
      });
      return { error: "Start date and end date are required" };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      logger.warn({
        event: "machine.machineDexExportAction.validation.invalidDateFormat",
        userId: session?.uid,
        machineId,
        startDate,
        endDate,
      });
      return { error: "Dates must be in YYYY-MM-DD format" };
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if end date is after start date
    if (end < start) {
      logger.warn({
        event: "machine.machineDexExportAction.validation.invalidRange",
        userId: session?.uid,
        machineId,
        startDate,
        endDate,
      });
      return { error: "End date must be after start date" };
    }

    // Check if date range is within the allowed limit (7 days)
    const MAX_DATE_RANGE_DAYS = 7;
    const daysDifference = differenceInDays(end, start);
    if (daysDifference > MAX_DATE_RANGE_DAYS) {
      logger.warn({
        event: "machine.machineDexExportAction.validation.rangeTooLarge",
        userId: session?.uid,
        machineId,
        daysDifference,
        maxDays: MAX_DATE_RANGE_DAYS,
      });
      return { error: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days` };
    }

    // Set time to start of day and end of day in America/Monterrey timezone
    const startDateTime = toZonedTime(
      new Date(`${startDate}T00:00:00`),
      "America/Monterrey",
    );

    const endDateTime = toZonedTime(
      new Date(`${endDate}T23:59:59.999`),
      "America/Monterrey",
    );

    // Get machine details
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: {
        name: true,
        machineSerial: true,
      },
    });

    if (!machine) {
      logger.warn({
        event: "machine.machineDexExportAction.machineNotFound",
        userId: session?.uid,
        machineId,
      });
      return { error: "Machine not found" };
    }

    // Fetch DEX reports within the date range
    const reports = await prisma.dexReport.findMany({
      where: {
        machineId: machineId,
        createdAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (reports.length === 0) {
      logger.warn({
        event: "machine.machineDexExportAction.noReports",
        userId: session?.uid,
        machineId,
        startDate,
        endDate,
      });
      return { error: "No reports found for the specified date range" };
    }

    // Define CSV columns in Spanish
    const columns = [
      "ID de Reporte",
      "Fecha de Creación (ISO)",
      "Fecha de Creación (Formateada)",
      "ID de Máquina",
      "Nombre de Máquina",
      "Número de Serie",
      "Datos DEX sin Procesar",
    ];

    // Process each report
    const reportPromises = reports.map(async (report) => {
      try {
        const dexReport = await getReportById(report.reportId);

        if (!dexReport?.report) return null;

        // Convert to Monterrey timezone for display
        const reportDateInMonterrey = toZonedTime(
          report.createdAt,
          "America/Monterrey",
        );

        // Format dates using date-fns
        const createdAtISO = report.createdAt.toISOString();
        const formattedDate = format(
          reportDateInMonterrey,
          "dd/MM/yyyy HH:mm:ss",
          { locale: es },
        );

        return {
          "ID de Reporte": report.reportId,
          "Fecha de Creación (ISO)": createdAtISO,
          "Fecha de Creación (Formateada)": formattedDate,
          "ID de Máquina": machineId,
          "Nombre de Máquina": machine.name || "N/A",
          "Número de Serie": machine.machineSerial || "N/A",
          "Datos DEX sin Procesar": dexReport.report.data,
        };
      } catch (error) {
        logger.error({
          event: "machine.machineDexExportAction.reportProcessingError",
          userId: session?.uid,
          machineId,
          reportId: report.reportId,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    });

    // Process all reports with Promise.all
    const reportData = (await Promise.all(reportPromises)).filter(Boolean);

    // Use csv-stringify to generate CSV content
    const csvContent = stringify(reportData, {
      header: true,
      columns: columns,
    });

    logger.info({
      event: "machine.machineDexExportAction.success",
      userId: session?.uid,
      machineId,
      startDate,
      endDate,
      rows: reportData.length,
    });
    return {
      success: true,
      csvData: csvContent,
      filename: `dex-reports-${machineId}-${startDate}-to-${endDate}.csv`,
    };
  } catch (error) {
    const session = getSession();
    logger.error({
      event: "machine.machineDexExportAction.error",
      userId: session?.uid,
      machineId,
      startDate,
      endDate,
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Failed to export DEX reports" };
  }
}

/**
 * Action to export terminal transactions
 */
export async function machineTerminalExportAction(payload: unknown) {
  const parsed = machineTerminalExportSchema.parse(payload);
  const session = requireSession();
  const team = await getTeamBySlug(parsed.teamSlug);
  const machine = await getTeamMachine(team.id, parsed.machineId);

  // Return early if any required values are missing
  if (!machine || !team.pharosMerchantCode || !machine.pharosTerminalCode) {
    logger.warn({
      event: "machine.machineTerminalExportAction.invalidConfiguration",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      machineId: machine?.id,
      terminalSerial: machine?.terminalSerialNumber,
    });
    return {
      success: false,
      error: "La máquina no cuenta con una configuración válida de Pharos.",
    };
  }

  // At this point, we know these values are not null
  const merchantCode = team.pharosMerchantCode;
  const terminalCode = machine.pharosTerminalCode;

  const timezone = "America/Monterrey";

  logger.info({
    event: "machine.machineTerminalExportAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    pharosTerminalCode: terminalCode,
    from: parsed.from,
    to: parsed.to,
  });

  // We need to fetch transactions for each day in the range
  const dateFrom = fromZonedTime(`${parsed.from}T00:00:00`, timezone);
  const dateTo = fromZonedTime(`${parsed.to}T23:59:59.999`, timezone);

  // Create an array of dates between dateFrom and dateTo
  const dates = [];
  let currentDate = new Date(dateFrom);

  while (currentDate <= dateTo) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fetch transactions for each date with concurrency limit of 10
  const transactions = await pMap(
    dates,
    async (date) => {
      return pharos.getTransactions({
        dateUtc: date,
        merchantCode,
        terminalCode,
      });
    },
    { concurrency: 10 },
  ).then((results) => results.flat());

  // Sort transactions by date in ascending order
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  const columns = [
    "Fecha",
    "Monto",
    "Tipo de Tarjeta",
    "Marca de Tarjeta",
    "Últimos 4 Dígitos",
    "Emisor",
    "Estado",
    "Reversada",
    "Contracargo",
  ];

  const csv = stringify(
    [
      columns,
      ...sortedTransactions.map((transaction) => [
        transaction.date,
        transaction.amount,
        renderCardType(transaction.card_type),
        transaction.card_brand || "",
        transaction.card?.slice(-4) || "",
        transaction.card_issuer || "",
        transaction.approved ? "Aprobada" : "Rechazada",
        transaction.reversed ? "Sí" : "No",
        transaction.chargeback ? "Sí" : "No",
      ]),
    ],
    { header: false },
  );

  logger.info({
    event: "machine.machineTerminalExportAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    machineId: machine.id,
    terminalSerial: machine.terminalSerialNumber,
    rows: sortedTransactions.length,
  });

  return { success: true, data: csv };
}

/**
 * Helper function to render card type in Spanish
 */
function renderCardType(cardType: string | null): string {
  if (!cardType) return "";

  switch (cardType) {
    case "credit":
      return "Crédito";
    case "debit":
      return "Débito";
    case "prepaid":
      return "Prepago";
    case "charge_card":
      return "Tarjeta de cargos";
    default:
      return cardType;
  }
}

// ============ MACHINE DETAIL PAGE OPTIMIZED ACTIONS ============

// Helper function to verify machine access for the current user
async function verifyMachineAccess(teamSlug: string, machineId: string) {
  const session = requireSession();
  const team = await getTeamBySlugCached(teamSlug);

  // Use the existing getTeamMachine function to ensure proper access control
  const machine = await getTeamMachine(team.id, machineId);

  // Additional authorization check for team membership
  const sessionMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.uid,
        teamId: team.id,
      },
    },
    select: { role: true },
  });

  // Verify user is a team member or admin
  const isTeamMember = !!sessionMember;
  const isAdmin = session.role === UserRole.ADMIN;

  if (!isTeamMember && !isAdmin) {
    notFound();
  }

  // For operators, check if they have access to this specific machine
  if (sessionMember?.role === TeamMemberRole.OPERATOR) {
    const userMachine = await prisma.userMachine.findUnique({
      where: {
        userId_machineId: {
          userId: session.uid,
          machineId: machine.id,
        },
      },
    });

    if (!userMachine) {
      notFound();
    }
  }

  return { machine, team, session };
}

// Get machine basic info
export async function getMachineBasicInfoAction(
  teamSlug: string,
  machineId: string,
) {
  const { machine, team } = await verifyMachineAccess(teamSlug, machineId);
  return { machine, team };
}

// Get today's sales and inventory in one optimized query
export async function getMachineTodayStatsAction(
  teamSlug: string,
  machineId: string,
) {
  const { machine } = await verifyMachineAccess(teamSlug, machineId);

  const now = new Date();
  const timezone = "America/Monterrey";
  const zoned = toZonedTime(now, timezone);
  const gte = fromZonedTime(startOfDay(zoned), timezone);
  const lte = fromZonedTime(endOfDay(zoned), timezone);

  // Combined query for both sales and inventory stats
  const [sales, spirals] = await Promise.all([
    prisma.sale.aggregate({
      where: { machineId: machine.id, createdAt: { gte, lte } },
      _sum: { machineProductCost: true },
    }),
    prisma.machineSpiral.aggregate({
      where: { machineId: machine.id, deletedAt: null },
      _sum: { currentCount: true, maxCapacity: true },
    }),
  ]);

  const percent =
    spirals?._sum?.currentCount && spirals?._sum?.maxCapacity
      ? Math.round((spirals._sum.currentCount / spirals._sum.maxCapacity) * 100)
      : 0;

  return {
    todaySales: sales._sum.machineProductCost || 0,
    inventoryPercent: percent,
  };
}

// Get recent sales
export async function getMachineRecentSalesAction(
  teamSlug: string,
  machineId: string,
) {
  const { machine } = await verifyMachineAccess(teamSlug, machineId);

  return await prisma.sale.findMany({
    select: {
      id: true,
      machineProductCost: true,
      machineProductId: true,
      machineMdbProductId: true,
      createdAt: true,
      product: { select: { id: true, name: true } },
    },
    where: { machineId: machine.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

// Get sales by day chart data (optimized)
export async function getMachineSalesByDayAction(
  teamSlug: string,
  machineId: string,
) {
  const { machine } = await verifyMachineAccess(teamSlug, machineId);

  const timezone = "America/Monterrey";
  const now = new Date();
  const today = toZonedTime(now, timezone);
  const startDate = subDays(today, 29); // Last 30 days including today

  // Convert zoned dates back to UTC for database query
  const todayUtc = fromZonedTime(today, timezone);
  const startDateUtc = fromZonedTime(startDate, timezone);

  const result = await prisma.$queryRaw<
    Array<{ date: Date; paymentMethod: string; total: bigint }>
  >`
    SELECT
      DATE("createdAt" AT TIME ZONE 'America/Monterrey') as date,
      "paymentMethod",
      SUM("machineProductCost") as total
    FROM "sales"
    WHERE "machineId" = ${machine.id}
      AND "createdAt" >= ${startDateUtc}
      AND "createdAt" <= ${todayUtc}
    GROUP BY DATE("createdAt" AT TIME ZONE 'America/Monterrey'), "paymentMethod"
    ORDER BY date ASC
  `;

  // Create days object with all dates in range, initialized to 0 for each payment method
  const days: Record<
    string,
    { card: number; cash: number; free: number; remote: number }
  > = {};
  let currentDate = startDate;
  while (currentDate <= today) {
    const dateStr = format(currentDate, "dd/MM/yyyy");
    days[dateStr] = { card: 0, cash: 0, free: 0, remote: 0 };
    currentDate = add(currentDate, { days: 1 });
  }

  // Fill in actual sales data
  result.forEach((item) => {
    const dateStr = format(new Date(item.date), "dd/MM/yyyy");
    const amount = Number(item.total) / 100; // Convert from cents to currency

    switch (item.paymentMethod) {
      case "CARD":
        days[dateStr].card += amount;
        break;
      case "CASH":
        days[dateStr].cash += amount;
        break;
      case "FREE":
        days[dateStr].free += amount;
        break;
      case "REMOTE":
        days[dateStr].remote += amount;
        break;
    }
  });

  // Convert to array format
  return Object.entries(days).map(([date, breakdown]) => ({
    date,
    ...breakdown,
  }));
}

// Get top products by sales (optimized)
export async function getMachineTopProductsAction(
  teamSlug: string,
  machineId: string,
) {
  const { machine } = await verifyMachineAccess(teamSlug, machineId);

  const maxDate = new Date();
  const minDate = add(maxDate, { days: -30 });

  const result = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      sales_count: bigint;
      total_sales_value: bigint;
    }>
  >`
    SELECT
      p.id,
      p.name,
      COUNT(s.id) AS sales_count,
      SUM(s."machineProductCost") AS total_sales_value
    FROM "products" p
    JOIN "sales" s ON p.id = s."productId"
    WHERE s."machineId" = ${machine.id}
      AND s."createdAt" >= ${minDate}
      AND s."createdAt" <= ${maxDate}
    GROUP BY p.id, p.name
    ORDER BY sales_count DESC
    LIMIT 10
  `;

  return result.map((item) => ({
    id: item.id,
    name: item.name,
    sales_count: Number(item.sales_count),
    total_sales_value: Number(item.total_sales_value),
  }));
}
