"use server";

import { env } from "@/lib/env";
import {
  buildCfdiFromInvoice,
  createClient,
  downloadCfdiPdf,
  downloadCfdiXml,
  generateCfdi,
  getCfdiUses,
  getClient,
  getFiscalRegimes,
  sendCfdiByEmail,
  updateClient,
} from "@/lib/facturama/utilities";
import { createInvoicePaymentUrl } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import logger from "@/utils/logger";
import {
  approvePaymentSchema,
  cancelInvoiceSchema,
  createInvoiceSchema,
  facturamaClientSchema,
  paymentProofSchema,
  rejectPaymentSchema,
} from "@/validation/billing";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  CfdiStatus,
  InvoiceStatus,
  ManualPaymentMethod,
  TeamMemberRole,
  UserRole,
} from "@prisma/client";
import { addDays, addMonths, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";

const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

export async function createInvoiceAction(data: unknown) {
  let parsed;
  try {
    parsed = createInvoiceSchema.parse(data);
  } catch (validationError) {
    logger.warn({
      event: "billing.createInvoiceAction.validation.error",
      error:
        validationError instanceof Error
          ? validationError.message
          : String(validationError),
    });
    throw validationError;
  }

  const session = requireSession();
  const now = new Date();

  logger.info({
    event: "billing.createInvoiceAction.start",
    userId: session.uid,
    teamSlug: parsed.teamSlug,
    machineIdsCount: parsed.machineIds.length,
    months: parsed.months,
    paymentMethod: parsed.paymentMethod,
  });

  // Get the team first
  const team = await prisma.team.findUniqueOrThrow({
    where: { slug: parsed.teamSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      costPerMachineCents: true,
    },
  });

  // Get the selected machines with their expiration dates
  const machines = await prisma.machine.findMany({
    where: {
      id: {
        in: parsed.machineIds,
      },
    },
    select: {
      id: true,
      name: true,
      activeUntilDate: true,
    },
  });

  // Get the latest exchange rate
  const latestExchangeRate = await prisma.exchangeRateHistory.findFirst({
    where: {
      fromCurrency: "USD",
      toCurrency: "MXN",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      rate: true,
    },
  });

  // If there is no exchange rate information in the platform, this is an error
  if (!latestExchangeRate) {
    logger.error({
      event: "billing.createInvoiceAction.noExchangeRate",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
    });
    throw new Error("No se encontró información de cambio de moneda");
  }

  const exchangeRate = latestExchangeRate.rate;

  // VAT rate in cents (16% -> 1600)
  const VAT_RATE_CENTS = 1600;

  // Apply 12-month promotion (pay for 11 months, get 12th free)
  const billableMonths = parsed.months === 12 ? 11 : parsed.months;

  // Create invoice items with proper dates and VAT calculations for each machine
  const invoiceItems = machines.map((machine) => {
    const isExpired = machine.activeUntilDate < now;
    const startDate = isExpired
      ? startOfMonth(now)
      : startOfMonth(addDays(machine.activeUntilDate, 1));
    const endDate = startOfMonth(addMonths(startDate, parsed.months));

    // Calculate costs in cents (using billable months for promotion)
    const subtotalCents = billableMonths * team.costPerMachineCents;
    const vatAmountCents = Math.round((subtotalCents * VAT_RATE_CENTS) / 10000);
    const totalCents = subtotalCents + vatAmountCents;

    return {
      machineId: machine.id,
      description:
        parsed.months === 12
          ? "Servicio de 12 meses (1 mes gratis)"
          : `Servicio de ${parsed.months} ${
              parsed.months === 1 ? "mes" : "meses"
            }`,
      subtotalCents,
      vatAmountCents,
      priceCents: totalCents,
      startDate,
      endDate,
    };
  });

  // Calculate total prices
  const totalSubtotalCents = invoiceItems.reduce(
    (sum, item) => sum + item.subtotalCents,
    0,
  );
  const totalVatAmountCents = invoiceItems.reduce(
    (sum, item) => sum + item.vatAmountCents,
    0,
  );
  const totalPriceCents = invoiceItems.reduce(
    (sum, item) => sum + item.priceCents,
    0,
  );

  // Create invoice with items
  const invoice = await prisma.invoice.create({
    data: {
      status: InvoiceStatus.PAYMENT_PENDING,
      paymentMethod: parsed.paymentMethod,
      subtotalCents: totalSubtotalCents,
      vatRatePercent: 16.0,
      vatAmountCents: totalVatAmountCents,
      totalPriceCents,
      exchangeRate,
      teamId: team.id,
      invoiceItems: {
        create: invoiceItems,
      },
    },
    include: {
      invoiceItems: {
        include: {
          machine: true,
        },
      },
    },
  });

  // If payment method is MercadoPago, create payment URL
  if (parsed.paymentMethod === "MERCADOPAGO") {
    try {
      logger.info({
        event: "billing.createInvoiceAction.mercadoPago.start",
        userId: session.uid,
        teamId: team.id,
        invoiceId: invoice.id,
        totalPriceCents: invoice.totalPriceCents,
      });
      const paymentUrl = await createInvoicePaymentUrl({
        invoice: {
          id: invoice.id,
          totalPriceCents: invoice.totalPriceCents,
          invoiceItems: invoice.invoiceItems.map((item) => ({
            description: item.description || "",
            priceCents: item.priceCents,
            machine: {
              name: item.machine.name,
            },
          })),
        },
        team,
        exchangeRate,
        user: {
          email: session.uid,
        },
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          mercadoPagoPaymentUrl: paymentUrl,
        } as any, // Type assertion needed because Prisma types are not up to date
      });

      logger.info({
        event: "billing.createInvoiceAction.mercadoPago.success",
        userId: session.uid,
        teamId: team.id,
        invoiceId: invoice.id,
        paymentUrl,
      });

      revalidatePath(`/team/${parsed.teamSlug}/billing`);
      return { success: true, invoiceId: invoice.id, redirectUrl: paymentUrl };
    } catch (error) {
      logger.error({
        event: "billing.createInvoiceAction.mercadoPago.error",
        userId: session.uid,
        teamId: team.id,
        invoiceId: invoice.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Delete the invoice and its items if we couldn't create the payment URL
      await prisma.$transaction([
        prisma.invoiceItem.deleteMany({
          where: { invoiceId: invoice.id },
        }),
        prisma.invoice.delete({
          where: { id: invoice.id },
        }),
      ]);
      throw new Error("Failed to create MercadoPago payment URL");
    }
  }

  logger.info({
    event: "billing.createInvoiceAction.success",
    userId: session.uid,
    teamId: team.id,
    invoiceId: invoice.id,
    totalPriceCents: invoice.totalPriceCents,
    items: invoice.invoiceItems.length,
  });
  revalidatePath(`/team/${parsed.teamSlug}/billing`);
  revalidatePath(`/team/${parsed.teamSlug}/billing/listing/${invoice.id}`);
  return { success: true, invoiceId: invoice.id };
}

export async function uploadPaymentProofAction(data: FormData) {
  const file = data.get("file") as File;
  const invoiceId = data.get("invoiceId") as string;

  const parsed = paymentProofSchema.parse({
    file,
    invoiceId,
  });

  logger.info({
    event: "billing.uploadPaymentProofAction.start",
    invoiceId: parsed.invoiceId,
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type,
  });

  // Get the invoice to make sure it exists and is pending payment
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: parsed.invoiceId },
    select: { id: true, status: true },
  });

  if (invoice.status !== InvoiceStatus.PAYMENT_PENDING) {
    logger.warn({
      event: "billing.uploadPaymentProofAction.invalidStatus",
      invoiceId: invoice.id,
      status: invoice.status,
    });
    throw new Error("La factura no está pendiente de pago");
  }

  // Convert file to buffer
  const buffer = Buffer.from(await parsed.file.arrayBuffer());

  // Generate unique filename
  const fileExtension = parsed.file.name.split(".").pop();
  const fileName = `payment-proofs/${
    invoice.id
  }/${Date.now()}.${fileExtension}`;

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: parsed.file.type,
      ACL: "private",
    }),
  );

  // Update invoice with payment proof
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paymentProofUrl: fileName,
      status: InvoiceStatus.PAYMENT_VERIFICATION_PENDING,
    },
  });

  logger.info({
    event: "billing.uploadPaymentProofAction.success",
    invoiceId: invoice.id,
  });
  revalidatePath(`/team/[slug]/billing/invoice/${invoice.id}`);
  return { success: true };
}

export async function createOrUpdateFacturamaClientAction(data: unknown) {
  const session = requireSession();

  // Parse and validate the client data
  let parsed;
  try {
    parsed = facturamaClientSchema.parse(data);
  } catch (validationError) {
    logger.warn({
      event: "billing.createOrUpdateFacturamaClientAction.validation.error",
      userId: session.uid,
      error:
        validationError instanceof Error
          ? validationError.message
          : String(validationError),
    });
    throw validationError;
  }

  const { teamSlug, ...clientData } = parsed;

  logger.info({
    event: "billing.createOrUpdateFacturamaClientAction.start",
    userId: session.uid,
    teamSlug,
    rfc: clientData.Rfc,
    email: clientData.Email,
  });

  // Get the team
  const team = await prisma.team.findUniqueOrThrow({
    where: { slug: teamSlug },
    select: {
      id: true,
      slug: true,
      facturamaId: true,
      members: {
        where: {
          userId: session.uid,
          OR: [
            { role: TeamMemberRole.OWNER },
            { user: { role: UserRole.ADMIN } },
          ],
        },
      },
    },
  });

  // Check if user has permission (team owner or platform admin)
  if (team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  try {
    let facturamaId: string;

    if (team.facturamaId) {
      try {
        // First verify the client exists in Facturama
        await getClient(team.facturamaId);
        // If successful, proceed with update
        await updateClient(team.facturamaId, clientData);
        facturamaId = team.facturamaId;
      } catch (error) {
        // Only create new client if the error is 404 (client not found)
        if ((error as any).status === 404) {
          logger.warn({
            event:
              "billing.createOrUpdateFacturamaClientAction.clientNotFoundCreatingNew",
            teamSlug: team.slug,
            previousFacturamaId: team.facturamaId,
          });

          const response = await createClient(clientData);
          facturamaId = response.Id;

          // Update the database with the new facturamaId
          await prisma.team.update({
            where: { id: team.id },
            data: { facturamaId },
          });
        } else {
          // For other errors (network, auth, etc.), re-throw the error
          throw error;
        }
      }
    } else {
      // Create new client
      const response = await createClient(clientData);
      facturamaId = response.Id;

      // Store the facturamaId in the database
      await prisma.team.update({
        where: { id: team.id },
        data: { facturamaId },
      });
    }

    // Final success log once team is known
    logger.info({
      event: "billing.createOrUpdateFacturamaClientAction.success",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      facturamaId,
    });
    revalidatePath(`/team/${team.slug}/billing/datos-fiscales`);
    return { success: true, facturamaId };
  } catch (error) {
    logger.error({
      event: "billing.createOrUpdateFacturamaClientAction.error",
      userId: session.uid,
      teamSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Error al procesar los datos fiscales");
  }
}

export async function getFacturamaClientAction(teamSlug: string) {
  const session = requireSession();

  // Get the team
  const team = await prisma.team.findUniqueOrThrow({
    where: { slug: teamSlug },
    select: {
      id: true,
      facturamaId: true,
      members: {
        where: {
          userId: session.uid,
        },
      },
    },
  });

  // Check if user has access to this team (team member or admin)
  if (team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes acceso a este equipo");
  }

  if (!team.facturamaId) {
    logger.info({
      event: "billing.getFacturamaClientAction.noFacturamaId",
      userId: session.uid,
      teamId: team.id,
      teamSlug,
    });
    return null;
  }

  try {
    logger.info({
      event: "billing.getFacturamaClientAction.start",
      userId: session.uid,
      teamId: team.id,
      teamSlug,
      facturamaId: team.facturamaId,
    });
    const clientData = await getClient(team.facturamaId);
    logger.info({
      event: "billing.getFacturamaClientAction.success",
      userId: session.uid,
      teamId: team.id,
      teamSlug,
      facturamaId: team.facturamaId,
    });
    return clientData;
  } catch (error) {
    logger.error({
      event: "billing.getFacturamaClientAction.error",
      userId: session.uid,
      teamId: team.id,
      teamSlug,
      facturamaId: team.facturamaId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Error al obtener los datos fiscales");
  }
}

export async function getFiscalRegimesAction(rfc: string) {
  if (!rfc || rfc.length < 12) {
    logger.debug({
      event: "billing.getFiscalRegimesAction.invalidRfc",
      rfc,
      reason: "RFC too short or empty",
    });
    return [];
  }

  try {
    logger.info({ event: "billing.getFiscalRegimesAction.start", rfc });
    const regimes = await getFiscalRegimes(rfc);
    logger.info({
      event: "billing.getFiscalRegimesAction.success",
      rfc,
      count: regimes.length,
    });
    return regimes;
  } catch (error) {
    logger.error({
      event: "billing.getFiscalRegimesAction.error",
      rfc,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getCfdiUsesAction(rfc: string) {
  if (!rfc || rfc.length < 12) {
    logger.debug({
      event: "billing.getCfdiUsesAction.invalidRfc",
      rfc,
      reason: "RFC too short or empty",
    });
    return [];
  }

  try {
    logger.info({ event: "billing.getCfdiUsesAction.start", rfc });
    const cfdiUses = await getCfdiUses(rfc);
    logger.info({
      event: "billing.getCfdiUsesAction.success",
      rfc,
      count: cfdiUses.length,
    });
    return cfdiUses;
  } catch (error) {
    logger.error({
      event: "billing.getCfdiUsesAction.error",
      rfc,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function rejectPaymentAction(data: unknown) {
  const session = requireSession();
  const parsed = rejectPaymentSchema.parse(data);

  // Only admins can reject payments
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "billing.rejectPaymentAction.unauthorized",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return {
      success: false,
      error: "No tienes permisos para realizar esta acción",
    };
  }

  // Get the invoice and verify it exists
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: parsed.invoiceId,
      team: {
        slug: parsed.teamSlug,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!invoice) {
    logger.warn({
      event: "billing.rejectPaymentAction.invoiceNotFound",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return { success: false, error: "Factura no encontrada" };
  }

  if (invoice.status !== InvoiceStatus.PAYMENT_VERIFICATION_PENDING) {
    logger.warn({
      event: "billing.rejectPaymentAction.invalidStatus",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
      status: invoice.status,
    });
    return {
      success: false,
      error: "La factura no está en estado de verificación pendiente",
    };
  }

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: InvoiceStatus.PAYMENT_VERIFICATION_REJECTED,
      rejectedByUserId: session.uid,
      rejectedAt: new Date(),
    },
  });

  logger.info({
    event: "billing.rejectPaymentAction.success",
    userId: session.uid,
    teamSlug: parsed.teamSlug,
    invoiceId: parsed.invoiceId,
  });
  revalidatePath(`/team/${parsed.teamSlug}/billing/listing/${invoice.id}`);
  return { success: true };
}

export async function approvePaymentAction(data: unknown) {
  const session = requireSession();
  const parsed = approvePaymentSchema.parse(data);

  // Only admins can approve payments
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "billing.approvePaymentAction.unauthorized",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return {
      success: false,
      error: "No tienes permisos para realizar esta acción",
    };
  }

  // Get the invoice and verify it exists
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: parsed.invoiceId,
      team: {
        slug: parsed.teamSlug,
      },
    },
    include: {
      invoiceItems: {
        include: {
          machine: true,
        },
      },
    },
  });

  if (!invoice) {
    logger.warn({
      event: "billing.approvePaymentAction.invoiceNotFound",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return { success: false, error: "Factura no encontrada" };
  }

  if (invoice.status !== InvoiceStatus.PAYMENT_VERIFICATION_PENDING) {
    logger.warn({
      event: "billing.approvePaymentAction.invalidStatus",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
      status: invoice.status,
    });
    return {
      success: false,
      error: "La factura no está en estado de verificación pendiente",
    };
  }

  const now = new Date();

  // Create a transaction with an array of operations
  await prisma.$transaction([
    // Update invoice status and approval info
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.PAYMENT_SUCCESS,
        approvedAt: now,
        approvedByUserId: session.uid,
        paidAt: now,
        // Set adjusted amount if provided, otherwise it remains null
        adjustedAmountCents: parsed.adjustedAmountCents,
        manualPaymentMethod: parsed.manualPaymentMethod,
      },
    }),
    // Update each machine's activeUntilDate to one day before the invoice item's end date
    ...invoice.invoiceItems.map((item) =>
      prisma.machine.update({
        where: { id: item.machineId },
        data: {
          activeUntilDate: item.endDate,
        },
      }),
    ),
  ]);

  logger.info({
    event: "billing.approvePaymentAction.success",
    userId: session.uid,
    teamSlug: parsed.teamSlug,
    invoiceId: parsed.invoiceId,
  });
  revalidatePath(`/team/${parsed.teamSlug}/billing/listing/${invoice.id}`);
  return { success: true };
}

export async function cancelInvoiceAction(data: unknown) {
  const session = requireSession();
  const parsed = cancelInvoiceSchema.parse(data);

  // Only admins can cancel invoices
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "billing.cancelInvoiceAction.unauthorized",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return {
      success: false,
      error: "No tienes permisos para realizar esta acción",
    };
  }

  // Get the invoice and verify it exists
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: parsed.invoiceId,
      team: {
        slug: parsed.teamSlug,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!invoice) {
    logger.warn({
      event: "billing.cancelInvoiceAction.invoiceNotFound",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
    });
    return { success: false, error: "Factura no encontrada" };
  }

  if (invoice.status !== InvoiceStatus.PAYMENT_PENDING) {
    logger.warn({
      event: "billing.cancelInvoiceAction.invalidStatus",
      userId: session.uid,
      teamSlug: parsed.teamSlug,
      invoiceId: parsed.invoiceId,
      status: invoice.status,
    });
    return {
      success: false,
      error: "Solo se pueden cancelar facturas pendientes de pago",
    };
  }

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: InvoiceStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledByUserId: session.uid,
    },
  });

  logger.info({
    event: "billing.cancelInvoiceAction.success",
    userId: session.uid,
    teamSlug: parsed.teamSlug,
    invoiceId: parsed.invoiceId,
  });
  revalidatePath(`/team/${parsed.teamSlug}/billing/listing/${invoice.id}`);
  return { success: true };
}

export async function generateCfdiAction(invoiceId: string) {
  const session = requireSession();

  // Get the invoice with all necessary data
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          facturamaId: true,
          members: {
            where: {
              userId: session.uid,
              OR: [
                { role: TeamMemberRole.OWNER },
                { user: { role: UserRole.ADMIN } },
              ],
            },
          },
        },
      },
    },
  });

  // Check permissions (team owner or platform admin)
  if (invoice.team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  // Validate invoice status
  if (invoice.status !== InvoiceStatus.PAYMENT_SUCCESS) {
    throw new Error("Solo se pueden generar CFDIs para facturas pagadas");
  }

  // Validate team has facturamaId
  if (!invoice.team.facturamaId) {
    throw new Error("El equipo no tiene configurados los datos fiscales");
  }

  let cfdiRequest: any = null;

  try {
    logger.info({
      event: "billing.generateCfdiAction.start",
      userId: session.uid,
      invoiceId,
    });
    // Get or create CFDI record
    let cfdiRecord = await prisma.invoiceCfdi.findUnique({
      where: { invoiceId: invoice.id },
    });

    if (!cfdiRecord) {
      cfdiRecord = await prisma.invoiceCfdi.create({
        data: {
          invoiceId: invoice.id,
          status: CfdiStatus.PENDING,
        },
      });
    }

    // Check if we can process (only PENDING or FAILED allowed)
    if (cfdiRecord.status === CfdiStatus.PROCESSING) {
      throw new Error("Ya se está generando un CFDI para esta factura");
    }

    if (cfdiRecord.status === CfdiStatus.COMPLETED) {
      logger.info({
        event: "billing.generateCfdiAction.alreadyCompleted",
        userId: session.uid,
        invoiceId,
        cfdiId: cfdiRecord.id,
      });
      return {
        success: true,
        cfdi: cfdiRecord,
        message: "CFDI ya generado anteriormente",
      };
    }

    // Set status to PROCESSING
    await prisma.invoiceCfdi.update({
      where: { id: cfdiRecord.id },
      data: { status: CfdiStatus.PROCESSING },
    });

    // Fetch client data from Facturama
    const clientData = await getClient(invoice.team.facturamaId);

    // Build CFDI request
    cfdiRequest = buildCfdiFromInvoice(invoice, clientData);

    // Log the request we're about to send
    logger.info({
      event: "billing.generateCfdiAction.facturamaCfdiRequest",
      userId: session.uid,
      invoiceId,
      receiverRfc: cfdiRequest.Receiver?.Rfc,
      currency: cfdiRequest.Currency,
      itemsCount: cfdiRequest.Items?.length,
    });

    // Generate CFDI
    const cfdiResponse = await generateCfdi(cfdiRequest);

    // Update record with success
    const updatedCfdi = await prisma.invoiceCfdi.update({
      where: { id: cfdiRecord.id },
      data: {
        status: CfdiStatus.COMPLETED,
        facturamaId: cfdiResponse.Id,
        folio: cfdiResponse.Folio,
        uuid: cfdiResponse.Complement.TaxStamp.Uuid,
        rawRequest: cfdiRequest as any,
        rawResponse: cfdiResponse as any,
        errorMessage: null,
      },
    });

    // Send CFDI by email to client
    try {
      await sendCfdiByEmail(cfdiResponse.Id, clientData.Email);
    } catch (emailError) {
      logger.error({
        event: "billing.generateCfdiAction.email.error",
        userId: session.uid,
        invoiceId,
        cfdiId: cfdiResponse.Id,
        error:
          emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Don't fail the whole operation if email fails
    }

    revalidatePath(`/team/${invoice.team.slug}/billing/listing/${invoice.id}`);
    return {
      success: true,
      cfdi: updatedCfdi,
      message: "CFDI generado exitosamente",
    };
  } catch (error) {
    // Extract raw response if available from the error
    const rawErrorResponse = (error as any)?.responseText || null;

    logger.error({
      event: "billing.generateCfdiAction.error",
      userId: session.uid,
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
      hasRawResponse: !!rawErrorResponse,
      httpStatus: (error as any)?.status,
    });

    // Update record with failure, including raw request and response if available
    const updateData: any = {
      status: CfdiStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : String(error),
    };

    // Store the request that failed if we have it
    if (cfdiRequest !== null) {
      updateData.rawRequest = cfdiRequest;
    }

    // Store the raw error response if we have it
    if (rawErrorResponse) {
      try {
        updateData.rawResponse = JSON.parse(rawErrorResponse);
      } catch {
        // If it's not valid JSON, store as text in a wrapper
        updateData.rawResponse = { _rawError: rawErrorResponse };
      }
    }

    await prisma.invoiceCfdi.updateMany({
      where: {
        invoiceId: invoice.id,
        status: CfdiStatus.PROCESSING,
      },
      data: updateData,
    });

    // Parse Facturama error message if available
    let errorMessage = "Error al generar el CFDI";
    if (rawErrorResponse) {
      try {
        const parsedError = JSON.parse(rawErrorResponse);
        if (parsedError.Message) {
          errorMessage = parsedError.Message;
        }
      } catch {
        // If parsing fails, keep the default message
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function sendCfdiEmailAction(invoiceId: string) {
  const session = requireSession();

  // Get the invoice with all necessary data
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          facturamaId: true,
          members: {
            where: {
              userId: session.uid,
              OR: [
                { role: TeamMemberRole.OWNER },
                { user: { role: UserRole.ADMIN } },
              ],
            },
          },
        },
      },
      cfdi: true,
    },
  });

  // Check permissions (team owner or platform admin)
  if (invoice.team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  // Validate team has facturamaId
  if (!invoice.team.facturamaId) {
    throw new Error("El equipo no tiene configurados los datos fiscales");
  }

  // Validate CFDI exists and is completed
  if (!invoice.cfdi || invoice.cfdi.status !== CfdiStatus.COMPLETED) {
    throw new Error("No hay CFDI generado para esta factura");
  }

  if (!invoice.cfdi.facturamaId) {
    throw new Error("CFDI no tiene ID de Facturama válido");
  }

  try {
    logger.info({
      event: "billing.sendCfdiEmailAction.start",
      userId: session.uid,
      invoiceId,
    });
    // Fetch client data to get email
    const clientData = await getClient(invoice.team.facturamaId);

    // Send CFDI by email
    await sendCfdiByEmail(invoice.cfdi.facturamaId, clientData.Email);

    logger.info({
      event: "billing.sendCfdiEmailAction.success",
      userId: session.uid,
      invoiceId,
      facturamaId: invoice.cfdi.facturamaId,
    });
    return {
      success: true,
      message: "CFDI enviado por correo exitosamente",
    };
  } catch (error) {
    logger.error({
      event: "billing.sendCfdiEmailAction.error",
      userId: session.uid,
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Error al enviar el CFDI por correo");
  }
}

export async function downloadCfdiPdfAction(invoiceId: string) {
  const session = requireSession();

  // Get the invoice with all necessary data
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          facturamaId: true,
          members: {
            where: {
              userId: session.uid,
              OR: [
                { role: TeamMemberRole.OWNER },
                { user: { role: UserRole.ADMIN } },
              ],
            },
          },
        },
      },
      cfdi: true,
    },
  });

  // Check permissions (team owner or platform admin)
  if (invoice.team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  // Validate CFDI exists and is completed
  if (!invoice.cfdi || invoice.cfdi.status !== CfdiStatus.COMPLETED) {
    throw new Error("No hay CFDI generado para esta factura");
  }

  if (!invoice.cfdi.facturamaId) {
    throw new Error("CFDI no tiene ID de Facturama válido");
  }

  try {
    logger.info({
      event: "billing.downloadCfdiPdfAction.start",
      userId: session.uid,
      invoiceId,
    });
    // Download PDF from Facturama
    const pdfResponse = await downloadCfdiPdf(invoice.cfdi.facturamaId);

    logger.info({
      event: "billing.downloadCfdiPdfAction.success",
      userId: session.uid,
      invoiceId,
      facturamaId: invoice.cfdi.facturamaId,
    });
    return {
      success: true,
      content: pdfResponse.Content,
      contentType: "application/pdf",
      filename: `CFDI_${invoice.cfdi.uuid}.pdf`,
    };
  } catch (error) {
    logger.error({
      event: "billing.downloadCfdiPdfAction.error",
      userId: session.uid,
      invoiceId,
      facturamaId: invoice.cfdi.facturamaId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Error al descargar el PDF del CFDI");
  }
}

export async function downloadCfdiXmlAction(invoiceId: string) {
  const session = requireSession();

  // Get the invoice with all necessary data
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          facturamaId: true,
          members: {
            where: {
              userId: session.uid,
              OR: [
                { role: TeamMemberRole.OWNER },
                { user: { role: UserRole.ADMIN } },
              ],
            },
          },
        },
      },
      cfdi: true,
    },
  });

  // Check permissions (team owner or platform admin)
  if (invoice.team.members.length === 0 && session.role !== UserRole.ADMIN) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  // Validate CFDI exists and is completed
  if (!invoice.cfdi || invoice.cfdi.status !== CfdiStatus.COMPLETED) {
    throw new Error("No hay CFDI generado para esta factura");
  }

  if (!invoice.cfdi.facturamaId) {
    throw new Error("CFDI no tiene ID de Facturama válido");
  }

  try {
    logger.info({
      event: "billing.downloadCfdiXmlAction.start",
      userId: session.uid,
      invoiceId,
    });
    // Download XML from Facturama
    const xmlResponse = await downloadCfdiXml(invoice.cfdi.facturamaId);

    logger.info({
      event: "billing.downloadCfdiXmlAction.success",
      userId: session.uid,
      invoiceId,
      facturamaId: invoice.cfdi.facturamaId,
    });
    return {
      success: true,
      content: xmlResponse.Content,
      contentType: "application/xml",
      filename: `CFDI_${invoice.cfdi.uuid}.xml`,
    };
  } catch (error) {
    logger.error({
      event: "billing.downloadCfdiXmlAction.error",
      userId: session.uid,
      invoiceId,
      facturamaId: invoice.cfdi.facturamaId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Error al descargar el XML del CFDI");
  }
}
