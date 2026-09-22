import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import logger from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { terminalSerial: string } },
) => {
  const { terminalSerial } = params;

  logger.info({
    event: "micromarket.products.request",
    terminalSerial,
  });

  // Find machine by terminal serial number and ensure it's a micromarket type
  const machine = await prisma.machine.findUnique({
    where: {
      terminalSerialNumber: terminalSerial,
      type: "MICROMARKET",
    },
    include: {
      spirals: {
        where: {
          deletedAt: null,
          machineMicromarketCode: { not: null },
          productId: { not: null },
        },
        include: {
          product: {
            include: {
              productImages: {
                where: { deletedAt: null },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });

  // Return 404 if machine not found or not micromarket type
  if (!machine) {
    logger.info({
      event: "micromarket.products.machine_not_found",
      terminalSerial,
    });

    return NextResponse.json(
      { error: 404, message: "Micromarket machine not found" },
      { status: 404 },
    );
  }

  // Filter and prepare spirals for sorting
  const validSpirals = machine.spirals.filter(
    (spiral) =>
      spiral.machineMicromarketCode && spiral.productId && spiral.product,
  );

  // Smart sorting: check if all codes are numeric
  const allCodesNumeric = validSpirals.every((spiral) => {
    const code = spiral.machineMicromarketCode!;
    return !isNaN(parseInt(code, 10)) && parseInt(code, 10).toString() === code;
  });

  // Sort based on whether codes are all numeric or not
  const sortedSpirals = validSpirals.sort((a, b) => {
    const codeA = a.machineMicromarketCode!;
    const codeB = b.machineMicromarketCode!;

    if (allCodesNumeric) {
      return parseInt(codeA, 10) - parseInt(codeB, 10);
    } else {
      return codeA.localeCompare(codeB);
    }
  });

  // Format response according to specification
  const products = sortedSpirals.map((spiral) => ({
    id: spiral.product!.id,
    name: spiral.product!.name,
    sku: spiral.product!.sku || "",
    barcode: spiral.product!.barcode || "",
    position:
      parseInt(spiral.machineMicromarketCode!, 10) ||
      spiral.machineMicromarketCode,
    productCost: {
      cents: spiral.product!.priceCents,
      formatted: formatCurrency(spiral.product!.priceCents),
    },
    images: spiral.product!.productImages.map((image) => ({
      id: image.id,
      url: getCdnUrl(image.fileUrl),
    })),
  }));

  logger.info({
    event: "micromarket.products.success",
    terminalSerial,
    machineId: machine.id,
    productCount: products.length,
    sortingMethod: allCodesNumeric ? "numeric" : "lexical",
  });

  return NextResponse.json(
    {
      success: true,
      products,
    },
    { status: 200 },
  );
};
