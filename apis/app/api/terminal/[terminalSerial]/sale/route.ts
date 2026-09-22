import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { terminalSaleSchema } from "@/validation/terminalSaleSchema";
import { MachineProtocol } from "@prisma/client";
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

    const validatedData = terminalSaleSchema.safeParse(json);
    token = validatedData.data?.token;

    logger.info({
      event: "terminal.sale.start",
      terminalSerial: params.terminalSerial,
      token,
      ip,
      userAgent: req.headers.get("user-agent"),
      saleDateISO: validatedData.data?.isoDate,
    });

    if (!validatedData.success) {
      logger.error({
        event: "terminal.sale.validation.error",
        terminalSerial: params.terminalSerial,
        error: validatedData.error.errors,
      });
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const machine = await prisma.machine.findUnique({
      where: { terminalSerialNumber: params.terminalSerial },
    });

    if (!machine) {
      // If the sale is more than 30 days old then we want to tell the client
      // to stop retrying
      const saleDate = new Date(validatedData.data?.isoDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (saleDate < thirtyDaysAgo) {
        logger.info({
          event: "terminal.sale.machine.notFound.forget",
          terminalSerial: params.terminalSerial,
          token,
          saleDateISO: validatedData.data?.isoDate,
        });
        return NextResponse.json({ message: "Forget sale" }, { status: 200 });
      }

      logger.error({
        event: "terminal.sale.machine.notFound",
        terminalSerial: params.terminalSerial,
        token,
        saleDateISO: validatedData.data?.isoDate,
      });
      return NextResponse.json(
        { message: "Machine not found" },
        { status: 404 },
      );
    }

    // skip the rest of the logic if the machine is not using MDB
    if (machine.protocol !== MachineProtocol.MDB) {
      logger.info({
        event: "terminal.sale.machine.notMdb",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        machineProtocol: machine.protocol,
      });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const machineSpiral = validatedData.data.mdbCode
      ? await prisma.machineSpiral.findUnique({
          where: {
            machineId_machineMdbCode: {
              machineId: machine.id,
              machineMdbCode: validatedData.data.mdbCode,
            },
          },
          select: {
            currentCount: true,
            machineCode: true,
            product: {
              select: {
                id: true,
                name: true,
                priceCents: true,
                sku: true,
              },
            },
          },
        })
      : null;

    // check if a sale with this token already exists
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
        event: "terminal.sale.skipped.duplicate",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        token: validatedData.data.token,
      });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const transactions = [
      prisma.machine.update({
        where: { id: machine.id },
        data: { lastPingAt: new Date() },
      }),
      prisma.sale.create({
        data: {
          machineId: machine.id,
          token: validatedData.data.token,
          machineMdbProductId: validatedData.data.mdbCode,
          machineProductId: machineSpiral?.machineCode,
          machineProductCost: validatedData.data.cost,
          paymentMethod: validatedData.data.paymentMethod,
          type: validatedData.data.type,
          comission: validatedData.data.comission,
          serviceCharge: validatedData.data.serviceCharge,
          taecelServiceId: validatedData.data.taecelServiceId,
          taecelTransactionId: validatedData.data.taecelTransactionId,
          taecelApiResponse: validatedData.data.taecelApiResponse,
          description: validatedData.data.description,
          createdAt: new Date(validatedData.data.isoDate), // sale's actual date
          receivedAt: new Date(), // db insertion date
          productId: machineSpiral?.product?.id,
          productName: machineSpiral?.product?.name,
          productPriceCents: machineSpiral?.product?.priceCents,
          productSku: machineSpiral?.product?.sku,
          rawPayload,
        },
      }),
      validatedData.data.mdbCode
        ? prisma.machineSpiral.upsert({
            where: {
              machineId_machineMdbCode: {
                machineId: machine.id,
                machineMdbCode: validatedData.data.mdbCode,
              },
            },
            update: {
              currentCount: {
                decrement:
                  machineSpiral && machineSpiral.currentCount > 0 ? 1 : 0,
              },
            },
            create: {
              machineId: machine.id,
              machineMdbCode: validatedData.data.mdbCode,
              currentCount: 0,
              maxCapacity: 1,
            },
          })
        : null,
    ].filter((tx) => tx !== null);

    try {
      await prisma.$transaction(transactions);
      logger.info({
        event: "terminal.sale.success",
        terminalSerial: params.terminalSerial,
        machineId: machine.id,
        token: validatedData.data.token,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      logger.error({
        event: "terminal.sale.error",
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
        event: "terminal.sale.skipped.duplicate",
        terminalSerial: params.terminalSerial,
        token,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    logger.error({
      event: "terminal.sale.error",
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
