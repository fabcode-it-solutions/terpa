"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  getGlobalSalesByDay,
  getTopProductsBySaleVolume,
  getTopTeamsBySaleCount,
  getTopTeamsBySaleVolume,
} from "@/loaders/admin";
import { exportMachinesCSV } from "@/service/core/csv-export";
import { sendDocumentNotificationEmailByTeamId } from "@/service/mailer";
import logger from "@/utils/logger";
import { PaymentMethod, UserRole } from "@prisma/client";
import {
  differenceInDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { redirect } from "next/navigation";

// Helper function to get date range
function getDateRange(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const timezone = "America/Monterrey";
  return {
    from: searchParams.from
      ? fromZonedTime(startOfDay(searchParams.from), timezone)
      : fromZonedTime(
          startOfMonth(startOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
    to: searchParams.to
      ? fromZonedTime(endOfDay(searchParams.to), timezone)
      : fromZonedTime(
          endOfMonth(endOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
  };
}

// Separate action for sales chart data
export async function getAdminSalesChartAction(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.getAdminSalesChartAction.unauthorized",
      userId: session.uid,
    });
    redirect("/admin/teams");
  }

  const date = getDateRange(searchParams);
  logger.info({
    event: "admin.getAdminSalesChartAction.start",
    userId: session.uid,
    from: searchParams.from,
    to: searchParams.to,
    fromResolved: date.from,
    toResolved: date.to,
  });
  return await getGlobalSalesByDay({
    minDate: date.from,
    maxDate: date.to,
  });
}

// Separate action for sales summary (combined card+cash in one query)
export async function getAdminSalesSummaryAction(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.getAdminSalesSummaryAction.unauthorized",
      userId: session.uid,
    });
    redirect("/admin/teams");
  }

  const date = getDateRange(searchParams);
  logger.info({
    event: "admin.getAdminSalesSummaryAction.start",
    userId: session.uid,
    from: searchParams.from,
    to: searchParams.to,
    fromResolved: date.from,
    toResolved: date.to,
  });

  // Single optimized query using raw SQL for better performance
  const salesSummary = await prisma.$queryRaw<
    Array<{
      payment_method: string;
      total_amount: bigint | null;
      sale_count: bigint;
    }>
  >`
    SELECT 
      "paymentMethod" as payment_method,
      SUM("machineProductCost") as total_amount,
      COUNT(*) as sale_count
    FROM "sales"
    WHERE "createdAt" >= ${date.from}
      AND "createdAt" <= ${date.to}
    GROUP BY "paymentMethod"
  `;

  const cardSales = salesSummary.find(
    (s) => s.payment_method === PaymentMethod.CARD,
  ) || {
    total_amount: 0,
    sale_count: 0,
  };

  const cashSales = salesSummary.find(
    (s) => s.payment_method === PaymentMethod.CASH,
  ) || {
    total_amount: 0,
    sale_count: 0,
  };

  const result = {
    cardSales: {
      _sum: { machineProductCost: Number(cardSales.total_amount || 0) },
      _count: { id: Number(cardSales.sale_count) },
    },
    cashSales: {
      _sum: { machineProductCost: Number(cashSales.total_amount || 0) },
      _count: { id: Number(cashSales.sale_count) },
    },
    totalSales:
      Number(cardSales.total_amount || 0) + Number(cashSales.total_amount || 0),
    totalCount: Number(cardSales.sale_count) + Number(cashSales.sale_count),
  };

  logger.info({
    event: "admin.getAdminSalesSummaryAction.success",
    userId: session.uid,
    totalSales: result.totalSales,
    totalCount: result.totalCount,
  });
  return result;
}

// Separate action for metrics with comparison (optimized single query)
export async function getAdminMetricsAction(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.getAdminMetricsAction.unauthorized",
      userId: session.uid,
    });
    redirect("/admin/teams");
  }

  const date = getDateRange(searchParams);
  logger.info({
    event: "admin.getAdminMetricsAction.start",
    userId: session.uid,
    from: searchParams.from,
    to: searchParams.to,
    fromResolved: date.from,
    toResolved: date.to,
  });
  const periodDays = differenceInDays(date.to, date.from) + 1;
  const previousPeriodEnd = subDays(date.from, 1);

  // Single optimized query for all metrics
  const metrics = await prisma.$queryRaw<
    Array<{
      metric_type: string;
      current_count: bigint;
      previous_count: bigint;
    }>
  >`
    SELECT 
      'teams' as metric_type,
      COUNT(CASE WHEN "createdAt" <= ${date.to} AND "isArchived" = false THEN 1 END) as current_count,
      COUNT(CASE WHEN "createdAt" <= ${previousPeriodEnd} AND "isArchived" = false THEN 1 END) as previous_count
    FROM "teams"
    UNION ALL
    SELECT 
      'terminals' as metric_type,
      COUNT(CASE WHEN "createdAt" <= ${date.to} THEN 1 END) as current_count,
      COUNT(CASE WHEN "createdAt" <= ${previousPeriodEnd} THEN 1 END) as previous_count
    FROM "terminals"
    UNION ALL
    SELECT 
      'machines' as metric_type,
      COUNT(CASE WHEN m."createdAt" <= ${date.to} AND m."deletedAt" IS NULL AND m."activeUntilDate" > ${subDays(date.to, 1)} AND t."isArchived" = false THEN 1 END) as current_count,
      COUNT(CASE WHEN m."createdAt" <= ${previousPeriodEnd} AND (m."deletedAt" IS NULL OR m."deletedAt" > ${previousPeriodEnd}) AND m."activeUntilDate" > ${subDays(previousPeriodEnd, 1)} AND t."isArchived" = false THEN 1 END) as previous_count
    FROM "machines" m
    JOIN "teams" t ON m."teamId" = t."id"
  `;

  const calculateChange = (current: number, previous: number) => {
    const numericDiff = current - previous;
    const percentageDiff =
      previous === 0 ? (current > 0 ? 100 : 0) : (numericDiff / previous) * 100;
    return {
      numeric: numericDiff,
      percentage: percentageDiff,
      isPositive: numericDiff >= 0,
    };
  };

  const teamsMetric = metrics.find((m) => m.metric_type === "teams")!;
  const terminalsMetric = metrics.find((m) => m.metric_type === "terminals")!;
  const machinesMetric = metrics.find((m) => m.metric_type === "machines")!;

  const resultMetrics = {
    totalTeams: Number(teamsMetric.current_count),
    totalTerminals: Number(terminalsMetric.current_count),
    totalMachines: Number(machinesMetric.current_count),
    teamsChange: calculateChange(
      Number(teamsMetric.current_count),
      Number(teamsMetric.previous_count),
    ),
    terminalsChange: calculateChange(
      Number(terminalsMetric.current_count),
      Number(terminalsMetric.previous_count),
    ),
    machinesChange: calculateChange(
      Number(machinesMetric.current_count),
      Number(machinesMetric.previous_count),
    ),
  };
  logger.info({
    event: "admin.getAdminMetricsAction.success",
    userId: session.uid,
    totals: {
      teams: resultMetrics.totalTeams,
      terminals: resultMetrics.totalTerminals,
      machines: resultMetrics.totalMachines,
    },
  });
  return resultMetrics;
}

// Separate action for top lists data (teams and products rankings)
export async function getAdminTopListsAction(searchParams: {
  from: string | undefined;
  to: string | undefined;
}) {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.getAdminTopListsAction.unauthorized",
      userId: session.uid,
    });
    redirect("/admin/teams");
  }

  const date = getDateRange(searchParams);
  logger.info({
    event: "admin.getAdminTopListsAction.start",
    userId: session.uid,
    from: searchParams.from,
    to: searchParams.to,
    fromResolved: date.from,
    toResolved: date.to,
  });

  // Fetch all three top lists in parallel for better performance
  const [topTeamsBySaleCount, topTeamsBySaleVolume, topProductsBySaleVolume] =
    await Promise.all([
      getTopTeamsBySaleCount({
        minDate: date.from,
        maxDate: date.to,
      }),
      getTopTeamsBySaleVolume({
        minDate: date.from,
        maxDate: date.to,
      }),
      getTopProductsBySaleVolume({
        minDate: date.from,
        maxDate: date.to,
      }),
    ]);

  const resultTop = {
    topTeamsBySaleCount,
    topTeamsBySaleVolume,
    topProductsBySaleVolume,
  };
  logger.info({
    event: "admin.getAdminTopListsAction.success",
    userId: session.uid,
    counts: {
      topTeamsBySaleCount: Array.isArray(topTeamsBySaleCount)
        ? topTeamsBySaleCount.length
        : undefined,
      topTeamsBySaleVolume: Array.isArray(topTeamsBySaleVolume)
        ? topTeamsBySaleVolume.length
        : undefined,
      topProductsBySaleVolume: Array.isArray(topProductsBySaleVolume)
        ? topProductsBySaleVolume.length
        : undefined,
    },
  });
  return resultTop;
}

export async function generateEmailPreviewAction(teamId: string): Promise<{
  success: boolean;
  data?: { subject: string; body: string };
  error?: string;
}> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.generateEmailPreviewAction.unauthorized",
      userId: session.uid,
      teamId,
    });
    return { success: false, error: "Unauthorized" };
  }

  try {
    logger.info({
      event: "admin.generateEmailPreviewAction.start",
      userId: session.uid,
      teamId,
    });
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        legalEntityType: true,
        totalTerminals: true,
        members: {
          where: { role: "OWNER" },
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
          },
        },
      },
    });

    if (!team) {
      logger.warn({
        event: "admin.generateEmailPreviewAction.teamNotFound",
        userId: session.uid,
        teamId,
      });
      return { success: false, error: "Team not found" };
    }

    const user = team.members[0]?.user;
    if (!user) {
      logger.warn({
        event: "admin.generateEmailPreviewAction.ownerNotFound",
        userId: session.uid,
        teamId,
      });
      return { success: false, error: "No owner found for team" };
    }

    // Generate email subject
    const emailSubject = `Alta cliente ${user.firstName} ${
      user.lastName
    } - Negocio "${team.name}" - ${new Date().toLocaleDateString()}`;

    // Document type labels matching the UI
    const documentTypeLabels = {
      BUSINESS_OPERATION_PROOF: "Prueba de Operación de Negocio",
      LEGAL_REPRESENTATIVE_ID: "Identificación del Representante Legal",
      TAX_SITUATION:
        "Constancia de Situación Fiscal (Persona Física/Representante Legal)",
      ARTICLES_OF_INCORPORATION: "Acta Constitutiva",
      PUBLIC_REGISTRY_REGISTRATION: "Inscripción al Registro Público",
      LEGAL_ENTITY_TAX_SITUATION: "Constancia de Situación Fiscal",
      LEGAL_ENTITY_PROOF_OF_ADDRESS: "Comprobante de Domicilio",
      LEGAL_ENTITY_BANK_STATEMENT: "Estado de Cuenta Bancario",
      SIGNED_CONTRACT: "Contrato Firmado",
    } as const;

    // Generate document links
    const generateDocumentLinks = () => {
      if (team.documents.length === 0) {
        return "\n\nNo hay documentos adjuntos.";
      }

      const baseUrl =
        process.env.APP_BASE_URL || "https://app.terpasolutions.com";
      let documentLinks = "\n\nDOCUMENTOS ADJUNTOS:\n\n";

      // Group documents by type
      const documentsByType = team.documents.reduce(
        (acc, doc) => {
          if (!acc[doc.type]) {
            acc[doc.type] = [];
          }
          acc[doc.type].push(doc);
          return acc;
        },
        {} as Record<string, typeof team.documents>,
      );

      // Generate links grouped by document type
      Object.entries(documentsByType).forEach(([type, docs]) => {
        const typeLabel =
          documentTypeLabels[type as keyof typeof documentTypeLabels] || type;
        documentLinks += `${typeLabel.toUpperCase()}:\n`;

        docs.forEach((doc) => {
          const url = `${baseUrl}/api/public/team/${teamId}/document/${doc.id}`;
          documentLinks += `  - ${doc.fileName} - ${url}\n`;
        });

        documentLinks += "\n";
      });

      return documentLinks.trim();
    };

    const dateFormatted = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Generate email body
    const emailBody = `
¡Hola a todos!

Solicito su apoyo para dar de alta el siguiente comercio:

- Fecha y Hora: ${dateFormatted}
- Email del cliente: ${user.email}
- Nombre: ${user.firstName} ${user.lastName}
- Teléfono: ${user.phoneNumber || "No proporcionado"}
- Tipo de persona: ${
      team.legalEntityType === "PERSONA_FISICA"
        ? "Persona Física"
        : "Persona Moral"
    }
- Nombre del Comercio: ${team.name}
- Cantidad de Terminales: ${team.totalTerminals ? team.totalTerminals + 2 : ""}

**Lleva la nueva encriptación** Favor de coordinar con Maco.

${generateDocumentLinks()}

Atentamente,
TERPA Solutions,
- Teléfono: 81 3960 1949
- Av. Lazaro Cardenas 2932, Mirador Residencial, Monterrey, N.L.
- terpasolutions.com
`.trim();

    const result = {
      success: true,
      data: {
        subject: emailSubject,
        body: emailBody,
      },
    };
    logger.info({
      event: "admin.generateEmailPreviewAction.success",
      userId: session.uid,
      teamId,
    });
    return result;
  } catch (error) {
    logger.error({
      event: "admin.generateEmailPreviewAction.error",
      userId: session.uid,
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function sendSetupEmailAction(
  teamId: string,
  emailList: string,
  customEmailContent?: { subject: string; body: string },
): Promise<{ success: boolean; error?: string }> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.sendSetupEmailAction.unauthorized",
      userId: session.uid,
      teamId,
    });
    return { success: false, error: "Unauthorized" };
  }

  try {
    logger.info({
      event: "admin.sendSetupEmailAction.start",
      userId: session.uid,
      teamId,
      hasCustomContent: !!customEmailContent,
    });
    // Parse and validate email list
    const emails = emailList
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      logger.warn({
        event: "admin.sendSetupEmailAction.noEmails",
        userId: session.uid,
        teamId,
      });
      return { success: false, error: "No se proporcionaron emails válidos" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      logger.warn({
        event: "admin.sendSetupEmailAction.invalidEmails",
        userId: session.uid,
        teamId,
        invalidEmails,
      });
      return {
        success: false,
        error: `Emails inválidos: ${invalidEmails.join(", ")}`,
      };
    }

    if (customEmailContent) {
      // Send custom email content using SendGrid API directly
      const { env } = await import("@/lib/env");
      const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          from: {
            email: "noreply@terpasolutions.com",
            name: "TERPA Solutions",
          },
          personalizations: [
            {
              to: emails.map((email) => ({ email: email.trim() })),
              subject: customEmailContent.subject,
            },
          ],
          content: [
            {
              type: "text/plain",
              value: customEmailContent.body,
            },
          ],
          tracking_settings: {
            click_tracking: {
              enable: false,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `SendGrid API error: ${response.status} ${response.statusText}`,
        );
      }
    } else {
      // Send the email using the existing function with custom recipients
      await sendDocumentNotificationEmailByTeamId(teamId, emails);
    }

    logger.info({
      event: "admin.sendSetupEmailAction.success",
      userId: session.uid,
      teamId,
      recipientsCount: emails.length,
      hasCustomContent: !!customEmailContent,
    });
    return { success: true };
  } catch (error) {
    logger.error({
      event: "admin.sendSetupEmailAction.error",
      userId: session.uid,
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function exportMachinesCSVAction(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "admin.exportMachinesCSVAction.unauthorized",
      userId: session.uid,
    });
    return { success: false, error: "No autorizado" };
  }

  try {
    logger.info({
      event: "admin.exportMachinesCSVAction.start",
      userId: session.uid,
    });

    const csvData = await exportMachinesCSV();

    logger.info({
      event: "admin.exportMachinesCSVAction.success",
      userId: session.uid,
      csvLength: csvData.length,
    });

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    logger.error({
      event: "admin.exportMachinesCSVAction.error",
      userId: session.uid,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
