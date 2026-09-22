import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { micromarketSaleSchema } from "@/validation/micromarketSaleSchema";
import { MachineType, SaleType, SaleVersion } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { terminalSerial: string } },
) {
  const ip = req.headers.get("x-forwarded-for") || req.ip;
  let token;

  try {
    const json = await req.json();
    const rawPayload = JSON.stringify(json, null, 2);

    const validatedData = micromarketSaleSchema.safeParse(json);
    token = validatedData.data?.token;

    logger.info({
      event: "micromarket.sale.start",
      terminalSerial: params.terminalSerial,
      token,
      ip,
      userAgent: req.headers.get("user-agent"),
      saleDateISO: validatedData.data?.isoDate,
      cartItemCount: validatedData.data?.cart?.length,
    });

    if (!validatedData.success) {
      logger.error({
        event: "micromarket.sale.validation.error",
        terminalSerial: params.terminalSerial,
        error: validatedData.error.errors,
      });
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const machine = await prisma.machine.findUnique({
      where: {
        terminalSerialNumber: params.terminalSerial,
        type: MachineType.MICROMARKET,
      },
    });

    if (!machine) {
      // If the sale is more than 30 days old then we want to tell the client
      // to stop retrying
      const saleDate = new Date(validatedData.data.isoDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (saleDate < thirtyDaysAgo) {
        logger.info({
          event: "micromarket.sale.machine.notFound.forget",
          terminalSerial: params.terminalSerial,
          token,
          saleDateISO: validatedData.data.isoDate,
        });
        return NextResponse.json({ message: "Forget sale" }, { status: 200 });
      }

      logger.error({
        event: "micromarket.sale.machine.notFound",
        terminalSerial: params.terminalSerial,
        token,
        saleDateISO: validatedData.data.isoDate,
      });
      return NextResponse.json(
        { message: "Micromarket machine not found" },
        { status: 404 },
      );
    }

    // Check if a sale with this token already exists
    const existingSale = await prisma.sale.findUnique({
      where: {
        token_machineId: {
          machineId: machine.id,
          token: validatedData.data.token,
        },
      },
    });

    if (existingSale) {
      logger.info({
        event: "micromarket.sale.skipped.duplicate",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        token: validatedData.data.token,
      });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Calculate total cost from cart
    const totalCost = validatedData.data.cart.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Get spiral and product details for each cart item
    const cartItemsWithDetails = await Promise.all(
      validatedData.data.cart.map(async (cartItem) => {
        // Find the spiral by micromarket code first
        const spiral = await prisma.machineSpiral.findFirst({
          where: {
            machineId: machine.id,
            machineMicromarketCode: cartItem.micromarketCode,
            deletedAt: null,
          },
          select: {
            id: true,
            machineMicromarketCode: true,
            currentCount: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
                priceCents: true,
                sku: true,
              },
            },
          },
        });

        // Handle cases where spiral or product don't exist
        let product = null;
        let spiralInfo = null;

        if (spiral) {
          product = spiral.product;
          spiralInfo = {
            id: spiral.id,
            machineMicromarketCode: spiral.machineMicromarketCode,
            currentCount: spiral.currentCount,
            productId: spiral.productId,
          };

          // If productId was provided, validate it matches the spiral's product
          if (cartItem.productId && spiral.productId !== cartItem.productId) {
            throw new Error(
              `Micromarket code ${cartItem.micromarketCode} contains different product than requested`,
            );
          }
        } else {
          // No spiral found - log warning but continue
          logger.warn({
            event: "micromarket.sale.spiral.notFound",
            machineId: machine.id,
            micromarketCode: cartItem.micromarketCode,
            message: `Micromarket code ${cartItem.micromarketCode} not found in machine - sale will proceed without product info`,
          });
        }

        return {
          ...cartItem,
          product,
          spiral: spiralInfo,
        };
      }),
    );

    // Use first cart item for backward compatibility fields
    const firstItem = cartItemsWithDetails[0];

    try {
      // Prepare data for the raw SQL query
      const now = new Date();
      const saleDate = new Date(validatedData.data.isoDate);

      // Prepare arrays for bulk insertion (handle null products)
      const productIds = cartItemsWithDetails.map(
        (item) => item.product?.id || null,
      );
      const productNames = cartItemsWithDetails.map(
        (item) => item.product?.name || null,
      );
      const productPrices = cartItemsWithDetails.map(
        (item) => item.product?.priceCents || item.unitPrice,
      );
      const productSkus = cartItemsWithDetails.map(
        (item) => item.product?.sku || null,
      );
      const micromarketCodes = cartItemsWithDetails.map(
        (item) => item.micromarketCode,
      );

      // Prepare spiral update data (only for items that have spirals)
      const spiralItems = cartItemsWithDetails.filter((item) => item.spiral);
      const spiralIds = spiralItems.map((item) => item.spiral!.id);
      const spiralQuantities = spiralItems.map((item) => item.quantity);

      // Execute atomic operation using raw SQL with CTEs
      // Split query based on whether we have spirals to update
      const result =
        spiralIds.length > 0
          ? await prisma.$queryRaw<
              Array<{
                sale_id: string;
                items_count: bigint;
                spirals_updated: bigint;
              }>
            >`
            WITH 
            -- Update machine ping time
            updated_machine AS (
              UPDATE machines 
              SET "lastPingAt" = ${now}, "updatedAt" = ${now}
              WHERE id = ${machine.id}
              RETURNING id
            ),
            -- Insert the sale
            inserted_sale AS (
              INSERT INTO sales (
                id, "machineId", token, "machineProductCost", 
                "paymentMethod", type, version, "createdAt", 
                "receivedAt", "productId", "productName", 
                "productPriceCents", "productSku", "rawPayload"
              )
              VALUES (
                gen_random_uuid(), ${machine.id}, ${validatedData.data.token}, ${totalCost}, 
                ${validatedData.data.paymentMethod}::"PaymentMethod", 'PRODUCT'::"SaleType", 
                'V2'::"SaleVersion", ${saleDate}, ${now}, ${firstItem.product?.id || null}, 
                ${firstItem.product?.name || null}, ${firstItem.product?.priceCents || firstItem.unitPrice}, 
                ${firstItem.product?.sku || null}, ${rawPayload}
              )
              RETURNING id
            ),
            -- Insert sale items
            inserted_items AS (
              INSERT INTO sale_items (
                id, "saleId", "productId", "productName", 
                "productPriceCents", "productSku", "machineMicromarketCode"
              )
              SELECT 
                gen_random_uuid(),
                (SELECT id FROM inserted_sale),
                unnest(${productIds}::text[]),
                unnest(${productNames}::text[]),
                unnest(${productPrices}::int[]),
                unnest(${productSkus}::text[]),
                unnest(${micromarketCodes}::text[])
              RETURNING id
            ),
            -- Update spiral counts
            updated_spirals AS (
              UPDATE machine_spirals
              SET "currentCount" = GREATEST(0, "currentCount" - s.quantity),
                  "updatedAt" = ${now}
              FROM (
                SELECT unnest(${spiralIds}::text[]) as spiral_id, 
                       unnest(${spiralQuantities}::int[]) as quantity
              ) s
              WHERE machine_spirals.id = s.spiral_id
              RETURNING machine_spirals.id
            )
            SELECT 
              (SELECT id FROM inserted_sale) as sale_id,
              (SELECT COUNT(*) FROM inserted_items) as items_count,
              (SELECT COUNT(*) FROM updated_spirals) as spirals_updated;
          `
          : await prisma.$queryRaw<
              Array<{
                sale_id: string;
                items_count: bigint;
                spirals_updated: bigint;
              }>
            >`
            WITH 
            -- Update machine ping time
            updated_machine AS (
              UPDATE machines 
              SET "lastPingAt" = ${now}, "updatedAt" = ${now}
              WHERE id = ${machine.id}
              RETURNING id
            ),
            -- Insert the sale
            inserted_sale AS (
              INSERT INTO sales (
                id, "machineId", token, "machineProductCost", 
                "paymentMethod", type, version, "createdAt", 
                "receivedAt", "productId", "productName", 
                "productPriceCents", "productSku", "rawPayload"
              )
              VALUES (
                gen_random_uuid(), ${machine.id}, ${validatedData.data.token}, ${totalCost}, 
                ${validatedData.data.paymentMethod}::"PaymentMethod", 'PRODUCT'::"SaleType", 
                'V2'::"SaleVersion", ${saleDate}, ${now}, ${firstItem.product?.id || null}, 
                ${firstItem.product?.name || null}, ${firstItem.product?.priceCents || firstItem.unitPrice}, 
                ${firstItem.product?.sku || null}, ${rawPayload}
              )
              RETURNING id
            ),
            -- Insert sale items
            inserted_items AS (
              INSERT INTO sale_items (
                id, "saleId", "productId", "productName", 
                "productPriceCents", "productSku", "machineMicromarketCode"
              )
              SELECT 
                gen_random_uuid(),
                (SELECT id FROM inserted_sale),
                unnest(${productIds}::text[]),
                unnest(${productNames}::text[]),
                unnest(${productPrices}::int[]),
                unnest(${productSkus}::text[]),
                unnest(${micromarketCodes}::text[])
              RETURNING id
            )
            SELECT 
              (SELECT id FROM inserted_sale) as sale_id,
              (SELECT COUNT(*) FROM inserted_items) as items_count,
              0::bigint as spirals_updated;
          `;

      const saleResult = result[0];

      logger.info({
        event: "micromarket.sale.success",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        token: validatedData.data.token,
        saleId: saleResult.sale_id,
        totalCost,
        cartItemCount: validatedData.data.cart.length,
        itemsCreated: Number(saleResult.items_count),
        spiralsUpdated: Number(saleResult.spirals_updated),
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      logger.error({
        event: "micromarket.sale.error",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        token: validatedData.data.token,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logger.info({
        event: "micromarket.sale.skipped.duplicate",
        terminalSerial: params.terminalSerial,
        token,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    logger.error({
      event: "micromarket.sale.error",
      terminalSerial: params.terminalSerial,
      token,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
