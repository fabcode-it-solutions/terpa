import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  documentTypeLabels,
  personaMoralDocumentTypes,
} from "@/lib/team-document-constants";
import logger from "@/utils/logger";
import { S3Client } from "@aws-sdk/client-s3";
import {
  EmailStatus,
  EmailType,
  TeamDocumentType,
  TeamMemberRole,
} from "@prisma/client";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// S3 client setup
const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

const mailer = {
  sendPasswordResetEmail,
};

export default mailer;

async function sendPasswordResetEmail(email: string, url: string) {
  const subject = "Reestablece tu contraseña";
  const body = `Hola, reestablece tu contraseña con el siguiente link:\n\n${url}`;

  let success = false;
  let errorDetails: string | null = null;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[EMAIL:DEV] Password reset to ${email}`);
    console.log(`[EMAIL:DEV] Subject: ${subject}`);
    console.log(`[EMAIL:DEV] Body:\n${body}`);

    try {
      await prisma.emailLog.create({
        data: {
          type: EmailType.PASSWORD_RESET,
          status: EmailStatus.SUCCESS,
          recipientEmail: email,
          subject,
          body,
        },
      });
    } catch (error) {
      console.error(`Failed to log password reset email (dev mode):`, error);
    }

    return;
  }

  try {
    logger.info({
      event: "mailer.sendPasswordResetEmail.start",
      email,
      subject,
    });
    const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: { email: "noreply@terpasolutions.com", name: "TERPA Solutions" },
        subject,
        content: [
          {
            type: "text/plain",
            value: body,
          },
        ],
        personalizations: [{ to: [{ email }] }],
        tracking_settings: {
          click_tracking: {
            enable: false,
          },
        },
      }),
    });

    success = response.ok;

    if (!success) {
      const errorBody = await response.text();
      errorDetails = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      });
      logger.error({
        event: "mailer.sendPasswordResetEmail.sendgrid.error",
        email,
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.error({
      event: "mailer.sendPasswordResetEmail.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    success = false;
    errorDetails = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: "network_error",
    });
  }

  // Log email regardless of success/failure
  try {
    await prisma.emailLog.create({
      data: {
        type: EmailType.PASSWORD_RESET,
        status: success ? EmailStatus.SUCCESS : EmailStatus.FAILED,
        recipientEmail: email,
        subject,
        body,
        errorDetails,
      },
    });
  } catch (error) {
    logger.error({
      event: "mailer.sendPasswordResetEmail.log.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!success) {
    logger.error({
      event: "mailer.sendPasswordResetEmail.failed",
      email,
    });
  } else {
    logger.info({
      event: "mailer.sendPasswordResetEmail.success",
      email,
    });
  }
}

export async function sendTeamWelcomeEmail(email: string, password: string) {
  const subject = "Bienvenido a tu equipo";
  const body = [
    `Hola, haz sido agregado a un equipo en TERPA Solutions.`,
    `Tu correo electrónico es: ${email}\nTu contraseña temporal es: ${password}`,
    `Accede a la plataforma: app.terpasolutions.com`,
    `Puedes cambiar tu contraseña una vez accediendo a la siguiente URL: https://app.terpasolutions.com/auth/forgot`,
  ].join("\n\n");

  let success = false;
  let errorDetails: string | null = null;

  if (process.env.NODE_ENV !== "production") {
    logger.info({
      event: "mailer.sendTeamWelcomeEmail.dev.log",
      email,
      subject,
    });
    return; // Skip actual email sending in non-production environments
  }

  try {
    logger.info({
      event: "mailer.sendTeamWelcomeEmail.start",
      email,
      subject,
    });
    const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: { email: "noreply@terpasolutions.com", name: "TERPA Solutions" },
        subject,
        content: [
          {
            type: "text/plain",
            value: body,
          },
        ],
        personalizations: [{ to: [{ email }] }],
        tracking_settings: {
          click_tracking: {
            enable: false,
          },
        },
      }),
    });

    success = response.ok;

    if (!success) {
      const errorBody = await response.text();
      errorDetails = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      });
      logger.error({
        event: "mailer.sendTeamWelcomeEmail.sendgrid.error",
        email,
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.error({
      event: "mailer.sendTeamWelcomeEmail.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    success = false;
    errorDetails = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: "network_error",
    });
  }

  // Log email regardless of success/failure
  try {
    await prisma.emailLog.create({
      data: {
        type: EmailType.TEAM_WELCOME,
        status: success ? EmailStatus.SUCCESS : EmailStatus.FAILED,
        recipientEmail: email,
        subject,
        body,
        errorDetails,
      },
    });
  } catch (error) {
    logger.error({
      event: "mailer.sendTeamWelcomeEmail.log.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Sends a plain text email to document notification recipients
 */
async function sendPlainTextEmail(
  subject: string,
  bodyText: string,
  customRecipients?: string[],
) {
  let success = false;
  let errorDetails: string | null = null;

  try {
    const recipientsToUse = customRecipients
      ? customRecipients.map((email) => ({ email: email.trim() }))
      : env.NODE_ENV === "production"
        ? [
            { email: "ventas@terpasolutions.com" },
            { email: "eunice@pharospayments.com" },
            { email: "alma@pharospayments.com" },
            { email: "alejandro@terpasolutions.com" },
            { email: "patricio@terpasolutions.com" },
            { email: "luis@terpasolutions.com" },
          ]
        : [{ email: "me@alexcavazos.com" }];

    logger.info({
      event: "mailer.sendPlainTextEmail.start",
      recipientsCount: recipientsToUse.length,
      subject,
    });

    const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: {
          email: "ventas@terpasolutions.com",
          name: "TERPA Solutions / Ventas",
        },
        personalizations: [
          {
            to: recipientsToUse,
          },
        ],
        subject: subject,
        content: [
          {
            type: "text/plain",
            value: bodyText,
          },
        ],
        tracking_settings: {
          click_tracking: {
            enable: false,
          },
        },
      }),
    });

    success = response.ok;

    if (!success) {
      const errorBody = await response.text();
      errorDetails = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      });
      logger.error({
        event: "mailer.sendPlainTextEmail.sendgrid.error",
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.error({
      event: "mailer.sendPlainTextEmail.error",
      error: error instanceof Error ? error.message : String(error),
    });
    success = false;
    errorDetails = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: "network_error",
    });
  }

  // Log email regardless of success/failure
  try {
    await prisma.emailLog.create({
      data: {
        type: EmailType.DOCUMENT_NOTIFICATION,
        status: success ? EmailStatus.SUCCESS : EmailStatus.FAILED,
        recipientEmail: "ventas@terpasolutions.com",
        subject,
        body: bodyText,
        errorDetails,
      },
    });
  } catch (error) {
    logger.error({
      event: "mailer.sendPlainTextEmail.log.error",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!success) {
    logger.error({
      event: "mailer.sendPlainTextEmail.failed",
      subject,
    });
    throw new Error(`Failed to send email: ${errorDetails || "Unknown error"}`);
  } else {
    logger.info({ event: "mailer.sendPlainTextEmail.success", subject });
  }
}

/**
 * Sends a document notification email with document links for a team by team ID
 */
export async function sendDocumentNotificationEmailByTeamId(
  teamId: string,
  customRecipients?: string[],
) {
  let errorDetails: string | null = null;

  try {
    logger.info({
      event: "mailer.sendDocumentNotificationEmailByTeamId.start",
      teamId,
      hasCustomRecipients: !!customRecipients?.length,
    });
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        legalEntityType: true,
        totalTerminals: true,
        members: {
          where: { role: TeamMemberRole.OWNER },
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
          where: { deletedAt: null },
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            type: true,
          },
        },
      },
    });

    if (!team) {
      const error = `Team with ID ${teamId} not found`;
      errorDetails = JSON.stringify({
        error,
        teamId,
        timestamp: new Date().toISOString(),
        type: "team_not_found",
      });
      logger.error({
        event: "mailer.sendDocumentNotificationEmailByTeamId.team.notFound",
        teamId,
      });
      throw new Error(error);
    }

    const user = team.members[0]?.user;
    if (!user) {
      const error = `No owner found for team ${teamId}`;
      errorDetails = JSON.stringify({
        error,
        teamId,
        teamName: team.name,
        timestamp: new Date().toISOString(),
        type: "no_owner_found",
      });
      logger.error({
        event: "mailer.sendDocumentNotificationEmailByTeamId.owner.notFound",
        teamId,
      });
      throw new Error(error);
    }

    if (team.documents.length === 0) {
      const error = `No documents found for team ${teamId}`;
      errorDetails = JSON.stringify({
        error,
        teamId,
        teamName: team.name,
        timestamp: new Date().toISOString(),
        type: "no_documents_found",
      });
      logger.error({
        event: "mailer.sendDocumentNotificationEmailByTeamId.documents.none",
        teamId,
      });
      throw new Error(error);
    }

    // Include all documents regardless of legal entity type
    const filteredDocuments = team.documents;

    if (filteredDocuments.length === 0) {
      const error = `No documents found for team ${teamId}`;
      errorDetails = JSON.stringify({
        error,
        teamId,
        teamName: team.name,
        timestamp: new Date().toISOString(),
        type: "no_documents_found",
      });
      throw new Error(error);
    }

    // Group documents by type
    const documentsByType = filteredDocuments.reduce(
      (acc, doc) => {
        if (!acc[doc.type]) {
          acc[doc.type] = [];
        }
        acc[doc.type].push(doc);
        return acc;
      },
      {} as Record<string, typeof team.documents>,
    );

    // Generate categorized document links
    const generateDocumentLinks = () => {
      const baseUrl = env.APP_BASE_URL || "https://app.terpasolutions.com";
      let documentLinks = "\n\nDOCUMENTOS ADJUNTOS:\n\n";

      // General documents first
      const generalTypes = Object.keys(documentsByType).filter(
        (type) => !personaMoralDocumentTypes.includes(type as TeamDocumentType),
      );

      if (generalTypes.length > 0) {
        documentLinks += "DOCUMENTOS GENERALES:\n";
        generalTypes.forEach((type) => {
          const docs = documentsByType[type];
          documentLinks += `\n• ${documentTypeLabels[type as TeamDocumentType]}:\n`;
          docs.forEach((doc) => {
            const url = `${baseUrl}/api/public/team/${teamId}/document/${doc.id}`;
            documentLinks += `  - ${doc.fileName} - ${url}\n`;
          });
        });
      }

      // Persona Moral documents if applicable
      const moralTypes = Object.keys(documentsByType).filter((type) =>
        personaMoralDocumentTypes.includes(type as TeamDocumentType),
      );

      if (moralTypes.length > 0) {
        documentLinks += "\nDOCUMENTOS PERSONA MORAL:\n";
        moralTypes.forEach((type) => {
          const docs = documentsByType[type];
          documentLinks += `\n• ${documentTypeLabels[type as TeamDocumentType]}:\n`;
          docs.forEach((doc) => {
            const url = `${baseUrl}/api/public/team/${teamId}/document/${doc.id}`;
            documentLinks += `  - ${doc.fileName} - ${url}\n`;
          });
        });
      }

      return documentLinks;
    };

    const dateFormatted = format(
      toZonedTime(new Date(), "America/Mexico_City"),
      "yyyy-MM-dd HH:mm:ss a",
    );

    const emailSubject = `Alta cliente ${user.firstName} ${
      user.lastName
    } - Negocio "${team.name}" - ${new Date().toLocaleDateString()}`;

    const emailBody = `
¡Hola a todos!

Solicito su apoyo para dar de alta el siguiente comercio:

- Fecha y Hora: ${dateFormatted}
- Email del cliente: ${user.email}
- Nombre: ${user.firstName} ${user.lastName}
- Teléfono: ${user.phoneNumber}
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

    logger.info({
      event: "mailer.sendDocumentNotificationEmailByTeamId.email.prepared",
      teamId,
      subject: emailSubject,
      documentsCount: filteredDocuments.length,
    });

    // Send email without attachments, using the new document links
    await sendPlainTextEmail(emailSubject, emailBody, customRecipients);

    logger.info({
      event: "mailer.sendDocumentNotificationEmailByTeamId.success",
      teamId,
      documentsCount: filteredDocuments.length,
    });

    return true;
  } catch (error) {
    // If errorDetails wasn't set during the process, create it from the caught error
    if (!errorDetails) {
      errorDetails = JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        teamId,
        timestamp: new Date().toISOString(),
        type: "unexpected_error",
      });
    }

    // Log the error details to the database
    try {
      await prisma.emailLog.create({
        data: {
          type: EmailType.DOCUMENT_NOTIFICATION,
          status: EmailStatus.FAILED,
          recipientEmail: "ventas@terpasolutions.com",
          subject: `Failed to process team ${teamId}`,
          body: `Error occurred while processing document notification for team ${teamId}`,
          errorDetails,
          teamId,
        },
      });
    } catch (logError) {
      logger.error({
        event: "mailer.sendDocumentNotificationEmailByTeamId.log.error",
        teamId,
        error: logError instanceof Error ? logError.message : String(logError),
      });
    }

    logger.error({
      event: "mailer.sendDocumentNotificationEmailByTeamId.error",
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Sends a payment reminder email to team owners
 */
export async function sendPaymentReminderEmail(
  email: string,
  teamName: string,
  teamSlug: string,
  expiringMachines: Array<{ name: string; activeUntilDate: Date }>,
) {
  const subject = `Recordatorio de Pago - ${teamName}`;
  const renewalUrl = `${env.APP_BASE_URL}/team/${teamSlug}/billing/invoice/new`;

  const machineList = expiringMachines
    .map(
      (machine) =>
        `- ${machine.name} (vence: ${machine.activeUntilDate.toLocaleDateString("es-MX")})`,
    )
    .join("\n");

  const body = `
Hola,

Este es un recordatorio de que tienes máquinas que están próximas a vencer el próximo mes.

Equipo: ${teamName}

Máquinas que vencen:
${machineList}

Para renovar el servicio de tus máquinas, visita:
${renewalUrl}

Si tienes alguna pregunta, no dudes en contactarnos.

Atentamente,
TERPA Solutions
- Teléfono: 81 3960 1949
- Av. Lazaro Cardenas 2932, Mirador Residencial, Monterrey, N.L.
- terpasolutions.com
`.trim();

  let success = false;
  let errorDetails: string | null = null;

  try {
    logger.info({
      event: "mailer.sendPaymentReminderEmail.start",
      email,
      teamSlug,
      subject,
      machinesCount: expiringMachines.length,
    });
    const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: { email: "noreply@terpasolutions.com", name: "TERPA Solutions" },
        subject,
        content: [
          {
            type: "text/plain",
            value: body,
          },
        ],
        personalizations: [{ to: [{ email }] }],
        tracking_settings: {
          click_tracking: {
            enable: false,
          },
        },
      }),
    });

    success = response.ok;

    if (!success) {
      const errorBody = await response.text();
      errorDetails = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      });
      logger.error({
        event: "mailer.sendPaymentReminderEmail.sendgrid.error",
        email,
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.error({
      event: "mailer.sendPaymentReminderEmail.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    success = false;
    errorDetails = JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: "network_error",
    });
  }

  // Log email regardless of success/failure
  try {
    const teamWithOwner = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: {
        id: true,
        members: {
          where: { role: TeamMemberRole.OWNER },
          select: { userId: true },
        },
      },
    });

    await prisma.emailLog.create({
      data: {
        type: EmailType.PAYMENT_REMINDER,
        status: success ? EmailStatus.SUCCESS : EmailStatus.FAILED,
        recipientEmail: email,
        subject,
        body,
        errorDetails,
        teamId: teamWithOwner?.id,
        userId: teamWithOwner?.members[0]?.userId,
      },
    });
  } catch (error) {
    logger.error({
      event: "mailer.sendPaymentReminderEmail.log.error",
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!success) {
    logger.error({
      event: "mailer.sendPaymentReminderEmail.failed",
      email,
    });
    return false;
  } else {
    logger.info({
      event: "mailer.sendPaymentReminderEmail.success",
      email,
    });
    return true;
  }
}
