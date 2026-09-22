"use server";

import { formatCurrency } from "@/lib/currency";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamBySlug } from "@/loaders/team";
import {
  sendDocumentNotificationEmailByTeamId,
  sendTeamWelcomeEmail,
} from "@/service/mailer";
import logger from "@/utils/logger";
import {
  teamCreateSchema,
  teamDocumentDeleteSchema,
  teamDocumentsServerSchema,
  teamManageSchema,
  teamMemberCreateSchema,
  teamMemberRemoveSchema,
  teamSalesExportSchema,
} from "@/validation/teams";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  BusinessActivityType,
  TeamDocumentType,
  TeamMemberRole,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import slug from "slug";

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

/**
 * Type for processed file data with content for email attachments
 */
type ProcessedFileData = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  type: TeamDocumentType;
  teamId: string;
  content?: string; // Optional base64 content for email attachments
};

/**
 * Type for team update data
 */
type TeamUpdateData = {
  slug: string;
  website?: string | null;
  productServiceDescription?: string | null;
};

/**
 * Type for business activity data
 */
type BusinessActivityData = {
  type: BusinessActivityType;
  customName: string | null;
};

export async function teamCreateAction(payload: unknown) {
  const session = requireSession();
  const parsed = teamCreateSchema.parse(payload);
  logger.info({
    event: "team.teamCreateAction.start",
    userId: session.uid,
    teamName: parsed.name,
    legalEntityType: parsed.legalEntityType,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { memberships: { include: { team: true } } },
  });

  if (!user) return redirect("/auth/signout");

  // If the user is already member of a team, redirect to the team page
  // remove this if we want to allow multiple teams to be created by the same user
  if (user.memberships[0]) {
    return redirect(`/team/${user.memberships[0].team.slug}`);
  }

  // Update user with new personal information
  await prisma.user.update({
    where: { id: session.uid },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phoneNumber: parsed.phoneNumber,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: parsed.name,
      slug: `${slug(parsed.name)}-${nanoid(4)}`,
      legalEntityType: parsed.legalEntityType,
      totalTerminals: parsed.totalTerminals,
      machineModelBrand: parsed.machineModelBrand,
      terminalSerialDigits: parsed.terminalSerialDigits,
      members: {
        create: {
          userId: session.uid,
          role: TeamMemberRole.OWNER,
        },
      },
    },
  });

  logger.info({
    event: "team.teamCreateAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
  });

  return {
    success: true,
    team: { id: team.id, slug: team.slug },
  };
}

/**
 * Action to update a team's information
 */
export async function teamManageAction(payload: unknown) {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    return {
      error: "No tienes permisos para actualizar la información del equipo.",
    };
  }

  const parsed = teamManageSchema.parse(payload);
  logger.info({
    event: "team.teamManageAction.start",
    userId: session.uid,
    teamSlug: parsed.slug,
  });

  const team = await prisma.team.findUnique({
    where: { slug: parsed.slug },
  });

  if (!team) {
    logger.warn({
      event: "team.teamManageAction.teamNotFound",
      userId: session.uid,
      teamSlug: parsed.slug,
    });
    return { error: "Equipo no encontrado" };
  }

  const updatedTeam = await prisma.team.update({
    where: { slug: parsed.slug },
    data: {
      name: parsed.name,
      pharosMerchantCode: parsed.pharosMerchantCode,
      costPerMachineCents: parsed.costPerMachineCents,
      legalEntityType: parsed.legalEntityType,
      totalTerminals: parsed.totalTerminals,
      machineModelBrand: parsed.machineModelBrand,
      terminalSerialDigits: parsed.terminalSerialDigits,
      website: parsed.website,
      productServiceDescription: parsed.productServiceDescription,
      contactNumber: parsed.contactNumber,
      legalRepresentativeName: parsed.legalRepresentativeName,
    },
  });

  logger.info({
    event: "team.teamManageAction.success",
    userId: session.uid,
    teamId: updatedTeam.id,
    teamSlug: updatedTeam.slug,
  });

  // Handle business activities if provided
  if (parsed.businessActivities && parsed.businessActivities.length > 0) {
    // Delete existing business activities
    await prisma.teamBusinessActivity.deleteMany({
      where: { teamId: team.id },
    });

    // Create new business activities
    await prisma.teamBusinessActivity.createMany({
      data: parsed.businessActivities.map((activity) => ({
        teamId: team.id,
        type: activity.type,
        customName:
          activity.type === BusinessActivityType.OTHER
            ? activity.customName
            : null,
      })),
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Action to export team sales by date range into a CSV string
 */
export async function teamSalesExportAction(payload: unknown) {
  const parsed = teamSalesExportSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  logger.info({
    event: "team.teamSalesExportAction.start",
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    from: parsed.from,
    to: parsed.to,
    machineIdsCount: parsed.machineIds?.length || 0,
  });

  const timezone = "America/Mexico_City";
  const dateFrom = fromZonedTime(`${parsed.from}T00:00:00`, timezone);
  const dateTo = fromZonedTime(`${parsed.to}T23:59:59.999`, timezone);

  // Add machine filter if machineIds are provided
  const machineFilter =
    parsed.machineIds && parsed.machineIds.length > 0
      ? { id: { in: parsed.machineIds } }
      : {};

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      machine: {
        teamId: team.id,
        ...machineFilter,
      },
    },
    select: {
      createdAt: true,
      machineProductCost: true,
      machineProductId: true,
      machineMdbProductId: true,
      paymentMethod: true,
      product: {
        select: {
          name: true,
          priceCents: true,
          sku: true,
        },
      },
      machine: {
        select: {
          name: true,
        },
      },
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
        sale.product?.name,
        sale.product?.sku,
        formatCurrency(sale.machineProductCost || 0),
        sale.product ? formatCurrency(sale.product.priceCents) : "",
        sale.paymentMethod,
        sale.machineMdbProductId,
        sale.machineProductId,
        sale.machine.name,
      ]),
    ],
    { header: false },
  );
  logger.info({
    event: "team.teamSalesExportAction.success",
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    rows: sales.length,
  });

  return { success: true, data: csv };
}

export async function teamMemberCreateAction(payload: unknown) {
  const session = requireSession();

  const parsed = teamMemberCreateSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  logger.info({
    event: "team.teamMemberCreateAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    email: parsed.email,
  });

  let existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true, role: true },
  });

  // If the user does not exist, create a new user and send a welcome email
  // with a temporary password
  if (!existingUser) {
    const randomPassword = crypto.randomBytes(12).toString("base64");
    const hashedPassword = await hash(randomPassword, 12);

    existingUser = await prisma.user.create({
      data: {
        email: parsed.email,
        password: { create: { hash: hashedPassword } },
      },
      select: { id: true, role: true },
    });

    logger.info({
      event: "team.teamMemberCreateAction.welcomeEmail.start",
      teamId: team.id,
      email: parsed.email,
    });
    try {
      await sendTeamWelcomeEmail(parsed.email, randomPassword);
      logger.info({
        event: "team.teamMemberCreateAction.welcomeEmail.success",
        teamId: team.id,
        email: parsed.email,
      });
    } catch (error) {
      logger.error({
        event: "team.teamMemberCreateAction.welcomeEmail.error",
        teamId: team.id,
        email: parsed.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (existingUser.role === UserRole.ADMIN) {
    logger.warn({
      event: "team.teamMemberCreateAction.userIsAdmin",
      teamId: team.id,
      email: parsed.email,
    });
    return {
      success: false,
      error: "User is an admin",
    };
  }

  // Create team member
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: existingUser.id,
      role: TeamMemberRole.OPERATOR,
    },
  });
  logger.info({
    event: "team.teamMemberCreateAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    newUserId: existingUser.id,
  });

  revalidatePath(`/`, "layout");
  return {
    success: true,
    userId: existingUser.id,
  };
}

export async function teamMemberRemoveAction(payload: unknown) {
  const session = requireSession();
  const parsed = teamMemberRemoveSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  logger.info({
    event: "team.teamMemberRemoveAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    targetUserId: parsed.userId,
  });

  await prisma.$transaction([
    prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: parsed.userId,
          teamId: team.id,
        },
      },
    }),
    prisma.userMachine.deleteMany({
      where: { userId: parsed.userId, machine: { teamId: team.id } },
    }),
  ]);
  logger.info({
    event: "team.teamMemberRemoveAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    targetUserId: parsed.userId,
  });

  revalidatePath(`/`, "layout");
  return { success: true };
}

/**
 * Action to update a team's documents
 */
export async function teamDocumentsUpdateAction(formData: FormData) {
  const session = requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { email: true, firstName: true, lastName: true, phoneNumber: true },
  });

  if (!user) {
    logger.error({
      event: "teamDocumentsUpdateAction.userNotFound",
      userId: session.uid,
    });
    return {
      success: false,
      error: "User not found",
    };
  }

  // Extract basic form data
  const slug = formData.get("slug") as string;
  const website = formData.get("website") as string;
  const productServiceDescription = formData.get(
    "productServiceDescription",
  ) as string;
  const legalRepresentativeName = formData.get("legalRepresentativeName") as
    | string
    | null;
  const electronicSignatureFromForm = formData.get("electronicSignature") as
    | string
    | null;

  // Extract business activities
  const businessActivitiesJson = formData.get("businessActivities") as string;
  const businessActivities = JSON.parse(businessActivitiesJson);

  logger.info({
    event: "teamDocumentsUpdateAction.start",
    userId: session.uid,
    userEmail: user.email,
    teamSlug: slug,
  });

  // Validate form data
  const dataToParse: any = {
    slug,
    website,
    productServiceDescription,
    businessActivities,
    legalRepresentativeName, // Add new field here
  };

  if (electronicSignatureFromForm !== null) {
    dataToParse.electronicSignature = electronicSignatureFromForm;
  }

  const parsed = teamDocumentsServerSchema.parse(dataToParse);

  const team = await getTeamBySlug(parsed.slug);

  // If the team is already onboarded we redirect to the team page
  if (team.onboardingCompleted) {
    return redirect(`/team/${team.slug}`);
  }

  // Process all files first (outside of any transaction)
  const allFileData: ProcessedFileData[] = [];

  // Process business operation proof files
  const businessOperationProofFiles = formData.getAll(
    "businessOperationProofFiles",
  ) as File[];
  if (businessOperationProofFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      businessOperationProofFiles,
      "BUSINESS_OPERATION_PROOF",
    );
    allFileData.push(...fileData);
  }

  // Process legal representative ID files
  const legalRepresentativeIdFiles = formData.getAll(
    "legalRepresentativeIdFiles",
  ) as File[];
  if (legalRepresentativeIdFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalRepresentativeIdFiles,
      "LEGAL_REPRESENTATIVE_ID",
    );
    allFileData.push(...fileData);
  }

  // Process tax situation files
  const taxSituationFiles = formData.getAll("taxSituationFiles") as File[];
  if (taxSituationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      taxSituationFiles,
      "TAX_SITUATION",
    );
    allFileData.push(...fileData);
  }

  // Process Articles of Incorporation files
  const articlesOfIncorporationFiles = formData.getAll(
    "articlesOfIncorporationFiles",
  ) as File[];
  if (articlesOfIncorporationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      articlesOfIncorporationFiles,
      "ARTICLES_OF_INCORPORATION",
    );
    allFileData.push(...fileData);
  }

  // Process Public Registry Registration files
  const publicRegistryRegistrationFiles = formData.getAll(
    "publicRegistryRegistrationFiles",
  ) as File[];
  if (publicRegistryRegistrationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      publicRegistryRegistrationFiles,
      "PUBLIC_REGISTRY_REGISTRATION",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Tax Situation files
  const legalEntityTaxSituationFiles = formData.getAll(
    "legalEntityTaxSituationFiles",
  ) as File[];
  if (legalEntityTaxSituationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityTaxSituationFiles,
      "LEGAL_ENTITY_TAX_SITUATION",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Proof of Address files
  const legalEntityProofOfAddressFiles = formData.getAll(
    "legalEntityProofOfAddressFiles",
  ) as File[];
  if (legalEntityProofOfAddressFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityProofOfAddressFiles,
      "LEGAL_ENTITY_PROOF_OF_ADDRESS",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Bank Statement files
  const legalEntityBankStatementFiles = formData.getAll(
    "legalEntityBankStatementFiles",
  ) as File[];
  if (legalEntityBankStatementFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityBankStatementFiles,
      "LEGAL_ENTITY_BANK_STATEMENT",
    );
    allFileData.push(...fileData);
  }

  // Define transaction operations
  const transactionOperations = [
    // Update team with basic fields
    prisma.team.update({
      where: { slug: parsed.slug },
      data: {
        website: parsed.website,
        productServiceDescription: parsed.productServiceDescription,
        legalRepresentativeName: parsed.legalRepresentativeName, // Add new field here
        onboardingCompleted: true,
        ...(parsed.electronicSignature &&
          parsed.electronicSignature.startsWith("data:image/png;base64,") && {
            electronicSignature: Buffer.from(
              parsed.electronicSignature.split(",")[1],
              "base64",
            ),
          }),
      },
    }),

    // Delete existing business activities
    prisma.teamBusinessActivity.deleteMany({
      where: { teamId: team.id },
    }),
  ];

  // Add business activities creation if needed
  if (parsed.businessActivities.length > 0) {
    transactionOperations.push(
      prisma.teamBusinessActivity.createMany({
        data: parsed.businessActivities.map((activity) => ({
          teamId: team.id,
          type: activity.type,
          customName:
            activity.type === BusinessActivityType.OTHER
              ? activity.customName
              : null,
        })),
      }),
    );
  }

  // Add document creation if needed
  if (allFileData.length > 0) {
    const dbFileData = allFileData.map(({ content, ...rest }) => rest);
    transactionOperations.push(
      prisma.teamDocument.createMany({
        data: dbFileData,
      }),
    );
  }

  // Execute transaction
  await prisma.$transaction(transactionOperations);

  logger.info({
    event: "teamDocumentsUpdateAction.success",
    userId: session.uid,
    userEmail: user.email,
  });

  // Send email with attachments if files were processed
  if (allFileData.length > 0) {
    try {
      await sendDocumentNotificationEmailByTeamId(team.id);
    } catch (error) {
      logger.error({ event: "teamDocumentsUpdate.email.error", error });
      // Continue execution even if email fails
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Action to update a team's documents by admin
 * This action allows admins to selectively update documents without requiring all fields
 */
export async function adminTeamDocumentsUpdateAction(formData: FormData) {
  const session = requireSession();

  // Check if user is admin
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "team.adminTeamDocumentsUpdateAction.unauthorized",
      userId: session.uid,
    });
    return {
      success: false,
      error: "Solo los administradores pueden usar esta función",
    };
  }

  // Extract basic form data
  const slug = formData.get("slug") as string;
  const website = (formData.get("website") as string) || null;
  const productServiceDescription =
    (formData.get("productServiceDescription") as string) || null;

  // Extract business activities if provided
  let businessActivities: BusinessActivityData[] = [];
  const businessActivitiesJson = formData.get("businessActivities") as string;
  if (businessActivitiesJson) {
    businessActivities = JSON.parse(businessActivitiesJson);
  }

  const team = await getTeamBySlug(slug);
  if (!team) {
    logger.warn({
      event: "team.adminTeamDocumentsUpdateAction.teamNotFound",
      userId: session.uid,
      teamSlug: slug,
    });
    return {
      success: false,
      error: "Equipo no encontrado",
    };
  }

  // Process all files first (outside of any transaction)
  const allFileData: ProcessedFileData[] = [];
  const updateData: TeamUpdateData = { slug: team.slug };

  // Add optional fields to update data if provided
  if (website !== null) {
    updateData.website = website === "" ? null : website;
  }

  if (productServiceDescription !== null) {
    updateData.productServiceDescription = productServiceDescription;
  }

  // Process business operation proof files
  const businessOperationProofFiles = formData.getAll(
    "businessOperationProofFiles",
  ) as File[];
  if (businessOperationProofFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      businessOperationProofFiles,
      "BUSINESS_OPERATION_PROOF",
    );
    allFileData.push(...fileData);
  }

  // Process legal representative ID files
  const legalRepresentativeIdFiles = formData.getAll(
    "legalRepresentativeIdFiles",
  ) as File[];
  if (legalRepresentativeIdFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalRepresentativeIdFiles,
      "LEGAL_REPRESENTATIVE_ID",
    );
    allFileData.push(...fileData);
  }

  // Process tax situation files
  const taxSituationFiles = formData.getAll("taxSituationFiles") as File[];
  if (taxSituationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      taxSituationFiles,
      "TAX_SITUATION",
    );
    allFileData.push(...fileData);
  }

  // Process Articles of Incorporation files
  const articlesOfIncorporationFiles = formData.getAll(
    "articlesOfIncorporationFiles",
  ) as File[];
  if (articlesOfIncorporationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      articlesOfIncorporationFiles,
      "ARTICLES_OF_INCORPORATION",
    );
    allFileData.push(...fileData);
  }

  // Process Public Registry Registration files
  const publicRegistryRegistrationFiles = formData.getAll(
    "publicRegistryRegistrationFiles",
  ) as File[];
  if (publicRegistryRegistrationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      publicRegistryRegistrationFiles,
      "PUBLIC_REGISTRY_REGISTRATION",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Tax Situation files
  const legalEntityTaxSituationFiles = formData.getAll(
    "legalEntityTaxSituationFiles",
  ) as File[];
  if (legalEntityTaxSituationFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityTaxSituationFiles,
      "LEGAL_ENTITY_TAX_SITUATION",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Proof of Address files
  const legalEntityProofOfAddressFiles = formData.getAll(
    "legalEntityProofOfAddressFiles",
  ) as File[];
  if (legalEntityProofOfAddressFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityProofOfAddressFiles,
      "LEGAL_ENTITY_PROOF_OF_ADDRESS",
    );
    allFileData.push(...fileData);
  }

  // Process Legal Entity Bank Statement files
  const legalEntityBankStatementFiles = formData.getAll(
    "legalEntityBankStatementFiles",
  ) as File[];
  if (legalEntityBankStatementFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      legalEntityBankStatementFiles,
      "LEGAL_ENTITY_BANK_STATEMENT",
    );
    allFileData.push(...fileData);
  }

  // Process Signed Contract files
  const signedContractFiles = formData.getAll("signedContractFiles") as File[];
  if (signedContractFiles.length > 0) {
    const fileData = await processFiles(
      team.id,
      signedContractFiles,
      "SIGNED_CONTRACT", // Use the new enum member
    );
    allFileData.push(...fileData);
  }

  // Prepare transaction operations
  const transactionOperations = [];

  // Update team with basic fields if any were provided
  if (Object.keys(updateData).length > 1) {
    // More than just slug
    transactionOperations.push(
      prisma.team.update({
        where: { slug: team.slug },
        data: {
          // Explicitly specify only the fields we want to update
          website: updateData.website,
          productServiceDescription: updateData.productServiceDescription,
        },
      }),
    );
  }

  // Update business activities if provided
  if (businessActivities.length > 0) {
    transactionOperations.push(
      prisma.teamBusinessActivity.deleteMany({
        where: { teamId: team.id },
      }),
      prisma.teamBusinessActivity.createMany({
        data: businessActivities.map((activity: BusinessActivityData) => ({
          teamId: team.id,
          type: activity.type,
          customName:
            activity.type === BusinessActivityType.OTHER
              ? activity.customName
              : null,
        })),
      }),
    );
  }

  // Create file documents if any
  if (allFileData.length > 0) {
    // Ensure we don't include content in the database operation
    const dbFileData = allFileData.map(({ content, ...rest }) => rest);

    transactionOperations.push(
      prisma.teamDocument.createMany({
        data: dbFileData,
      }),
    );
  }

  // Execute transaction if there are operations to perform
  if (transactionOperations.length > 0) {
    await prisma.$transaction(transactionOperations);
  }

  logger.info({
    event: "team.adminTeamDocumentsUpdateAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
  });
  revalidatePath("/", "layout");
  revalidatePath(`/admin/teams/${team.slug}`, "page");
  return { success: true };
}

// Helper function to process files - returns database operations to be performed
async function processFiles(
  teamId: string,
  files: File[],
  documentType: TeamDocumentType,
): Promise<
  {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    type: TeamDocumentType;
    teamId: string;
    content?: string; // Optional base64 content for email attachments
  }[]
> {
  const fileData = [];

  // Upload new files
  for (const file of files) {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    // Add base64 content for email attachments
    const base64Content = buffer.toString("base64");

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `team-documents/${teamId}/${documentType}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExtension}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ACL: "private",
      }),
    );

    // Collect file data for database operation
    fileData.push({
      teamId,
      type: documentType,
      fileUrl: fileName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      content: base64Content, // Include base64 content for email attachments
    });
  }

  return fileData;
}

/**
 * Action to soft delete a team document
 */
export async function adminTeamDocumentDeleteAction(payload: unknown) {
  const session = requireSession();

  // Check if user is admin
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "team.adminTeamDocumentDeleteAction.unauthorized",
      userId: session.uid,
    });
    return {
      success: false,
      error: "Solo los administradores pueden eliminar documentos",
    };
  }

  const parsed = teamDocumentDeleteSchema.parse(payload);

  // Find the document to ensure it exists (excluding already soft-deleted documents)
  const document = await prisma.teamDocument.findUnique({
    where: {
      id: parsed.documentId,
      deletedAt: null, // Only find non-deleted documents
    },
    select: { id: true, teamId: true },
  });

  if (!document) {
    logger.warn({
      event: "team.adminTeamDocumentDeleteAction.documentNotFound",
      userId: session.uid,
      documentId: parsed.documentId,
      teamSlug: parsed.teamSlug,
    });
    return {
      success: false,
      error: "Documento no encontrado",
    };
  }

  // Soft delete the document
  await prisma.teamDocument.update({
    where: { id: parsed.documentId },
    data: { deletedAt: new Date() },
  });

  logger.info({
    event: "team.adminTeamDocumentDeleteAction.success",
    userId: session.uid,
    documentId: parsed.documentId,
    teamId: document.teamId,
    teamSlug: parsed.teamSlug,
  });
  // Revalidate paths
  revalidatePath("/", "layout");
  revalidatePath(`/admin/teams/${parsed.teamSlug}`, "page");

  return { success: true };
}

export async function archiveTeamAction(teamSlug: string) {
  const session = await requireSession();

  // Only admins can archive teams
  if (session.role !== UserRole.ADMIN) {
    throw new Error("Solo los administradores pueden archivar equipos");
  }

  // Update the team to set isArchived to true
  await prisma.team.update({
    where: { slug: teamSlug },
    data: { isArchived: true },
  });

  // Revalidate paths
  revalidatePath("/", "layout");
  revalidatePath("/admin/teams", "page");

  return { success: true };
}

export async function unarchiveTeamAction(teamSlug: string) {
  const session = await requireSession();

  // Only admins can unarchive teams
  if (session.role !== UserRole.ADMIN) {
    throw new Error("Solo los administradores pueden desarchivar equipos");
  }

  // Update the team to set isArchived to false
  await prisma.team.update({
    where: { slug: teamSlug },
    data: { isArchived: false },
  });

  // Revalidate paths
  revalidatePath("/", "layout");
  revalidatePath("/admin/teams", "page");

  return { success: true };
}
