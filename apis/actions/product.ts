"use server";

import { prisma } from "@/lib/prisma";
import { generateFileKey, getCdnUrl, uploadFilePublic } from "@/lib/s3";
import { requireSession } from "@/lib/session";
import { getTeamProduct } from "@/loaders/product";
import { getTeamBySlug, getTeamBySlugCached } from "@/loaders/team";
import logger from "@/utils/logger";
import {
  productCreateSchema,
  productDeleteSchema,
  productEditSchema,
} from "@/validation/product";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

/**
 * Action to handle the creation of a product.
 */
export async function productCreateAction(payload: unknown) {
  const session = requireSession();
  const parsed = productCreateSchema.parse(payload);
  const team = await getTeamBySlugCached(parsed.teamSlug);

  logger.info({
    event: "product.productCreateAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    name: parsed.name,
    sku: parsed.sku,
    barcode: parsed.barcode,
    priceCents: parsed.price,
    purchaseCostCents: parsed.purchaseCost,
  });

  // A product with the same name (case-insensitive) should not exist.
  const existingProduct = await prisma.product.findFirst({
    where: {
      teamId: team.id,
      deletedAt: null,
      name: {
        equals: parsed.name,
        mode: "insensitive",
      },
    },
  });

  if (existingProduct) {
    logger.warn({
      event: "product.productCreateAction.duplicateName",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      name: parsed.name,
      existingProductId: existingProduct.id,
    });
    return { error: "Ya existe un producto con ese nombre." };
  }

  // Create the product.
  const product = await prisma.product.create({
    data: {
      name: parsed.name,
      priceCents: parsed.price,
      purchaseCostCents: parsed.purchaseCost,
      sku: parsed.sku,
      barcode: parsed.barcode,
      teamId: team.id,
      createdById: session.uid,
    },
  });

  logger.info({
    event: "product.productCreateAction.success",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
    name: product.name,
    sku: product.sku,
  });

  return { success: true, productId: product.id };
}

/**
 * Action to handle the editing of a product.
 */
export async function productEditAction(payload: unknown) {
  const parsed = productEditSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const product = await getTeamProduct(team.id, parsed.productId);

  logger.info({
    event: "product.productEditAction.start",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
    updates: {
      name: parsed.name,
      sku: parsed.sku,
      barcode: parsed.barcode,
      priceCents: parsed.price,
      purchaseCostCents: parsed.purchaseCost,
    },
  });

  // A different product with the same name should not exist
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: { equals: parsed.name, mode: "insensitive" },
      teamId: team.id,
      deletedAt: null,
    },
  });

  if (existingProduct && existingProduct.id !== product.id) {
    logger.warn({
      event: "product.productEditAction.duplicateName",
      userId: requireSession().uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      conflictingProductId: existingProduct.id,
      name: parsed.name,
    });
    return {
      error: `Ya existe un producto con ese nombre.`,
    };
  }

  // Update the product with the new values
  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: parsed.name,
      priceCents: parsed.price,
      purchaseCostCents: parsed.purchaseCost,
      sku: parsed.sku,
      barcode: parsed.barcode,
    },
  });

  logger.info({
    event: "product.productEditAction.success",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
  });

  revalidatePath("/", "layout");
  redirect(`/team/${parsed.teamSlug}/products`);
}

/**
 * Action to handle the deletion of a product.
 */
export async function productDeleteAction(payload: unknown) {
  const parsed = productDeleteSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const product = await getTeamProduct(team.id, parsed.productId);

  logger.info({
    event: "product.productDeleteAction.start",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
  });

  // check if any spirals are using the product
  const spirals = await prisma.machineSpiral.findMany({
    where: { productId: product.id, deletedAt: null },
  });

  if (spirals.length > 0) {
    logger.warn({
      event: "product.productDeleteAction.productInUse",
      userId: requireSession().uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      spiralsInUse: spirals.length,
    });
    return {
      error:
        "No se pueden eliminar productos que estén en uso por alguna máquina.",
    };
  }

  // Soft delete the product
  await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date() },
  });

  logger.info({
    event: "product.productDeleteAction.success",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Schema for product image upload validation
 */
const productImageUploadSchema = z.object({
  teamSlug: z.string(),
  productId: z.string().uuid(),
  image: z
    .custom<File>()
    .refine((file) => file instanceof File, "Por favor selecciona una imagen")
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      "La imagen no puede ser mayor a 2MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Solo se aceptan archivos JPG, PNG o WebP",
    ),
});

/**
 * Schema for product image deletion validation
 */
const productImageDeleteSchema = z.object({
  teamSlug: z.string(),
  productId: z.string().uuid(),
  imageId: z.string().uuid(),
});

/**
 * Action to handle product image upload
 */
export async function uploadProductImageAction(formData: FormData) {
  const session = requireSession();

  const parsed = productImageUploadSchema.parse({
    teamSlug: formData.get("teamSlug"),
    productId: formData.get("productId"),
    image: formData.get("image"),
  });

  const team = await getTeamBySlug(parsed.teamSlug);
  const product = await getTeamProduct(team.id, parsed.productId);

  logger.info({
    event: "product.uploadProductImageAction.start",
    userId: session.uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
    file: parsed.image
      ? {
          name: parsed.image.name,
          size: parsed.image.size,
          type: parsed.image.type,
        }
      : undefined,
  });

  // Check if product already has an image (for now we only support one)
  const existingImage = await prisma.productImage.findFirst({
    where: {
      productId: product.id,
      deletedAt: null,
    },
  });

  if (existingImage) {
    logger.warn({
      event: "product.uploadProductImageAction.alreadyHasImage",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      existingImageId: existingImage.id,
    });
    return {
      error:
        "El producto ya tiene una imagen. Elimínala primero para subir una nueva.",
    };
  }

  try {
    // Generate file key for the product image
    const fileKey = generateFileKey(
      `product-images/${team.id}/${product.id}`,
      parsed.image.name,
    );

    // Upload to S3 with public ACL
    const uploadResult = await uploadFilePublic(parsed.image, fileKey);

    // Save to database
    await prisma.productImage.create({
      data: {
        productId: product.id,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        position: 1,
      },
    });

    logger.info({
      event: "product.uploadProductImageAction.success",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      imageUrl: uploadResult.fileUrl,
      imageName: uploadResult.fileName,
      imageSize: uploadResult.fileSize,
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      imageUrl: getCdnUrl(uploadResult.fileUrl),
    };
  } catch (error) {
    logger.error({
      event: "product.uploadProductImageAction.error",
      userId: session.uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      error,
    });
    return { error: "Error al subir la imagen. Intenta más tarde." };
  }
}

/**
 * Action to handle product image deletion
 */
export async function deleteProductImageAction(payload: unknown) {
  const parsed = productImageDeleteSchema.parse(payload);
  const team = await getTeamBySlug(parsed.teamSlug);
  const product = await getTeamProduct(team.id, parsed.productId);

  logger.info({
    event: "product.deleteProductImageAction.start",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
    imageId: parsed.imageId,
  });

  // Find the image
  const image = await prisma.productImage.findFirst({
    where: {
      id: parsed.imageId,
      productId: product.id,
      deletedAt: null,
    },
  });

  if (!image) {
    logger.warn({
      event: "product.deleteProductImageAction.notFound",
      userId: requireSession().uid,
      teamId: team.id,
      teamSlug: team.slug,
      productId: product.id,
      imageId: parsed.imageId,
    });
    return { error: "Imagen no encontrada." };
  }

  // Soft delete the image
  await prisma.productImage.update({
    where: { id: image.id },
    data: { deletedAt: new Date() },
  });

  logger.info({
    event: "product.deleteProductImageAction.success",
    userId: requireSession().uid,
    teamId: team.id,
    teamSlug: team.slug,
    productId: product.id,
    imageId: parsed.imageId,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
