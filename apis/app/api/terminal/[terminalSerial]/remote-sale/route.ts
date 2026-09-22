import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      terminalSerial: string;
    };
  },
) {
  const { terminalSerial } = params;

  logger.info({
    event: "terminal.remoteSale.start",
    terminalSerial,
    ip: req.ip,
    userAgent: req.headers.get("user-agent"),
  });

  const machine = await prisma.machine.findUnique({
    where: { terminalSerialNumber: terminalSerial },
  });

  if (!machine) {
    logger.error({
      event: "terminal.remoteSale.machine.notFound",
      terminalSerial,
    });
    return NextResponse.json(
      {
        error: 404,
        message: "Machine not found",
      },
      { status: 404 },
    );
  }

  try {
    if (
      machine.remoteSaleEnabledUntil &&
      new Date() < machine.remoteSaleEnabledUntil
    ) {
      await prisma.machine.update({
        where: { terminalSerialNumber: terminalSerial },
        data: { remoteSaleEnabledUntil: null },
      });

      logger.info({
        event: "terminal.remoteSale.success",
        terminalSerial,
        machineId: machine.id,
        isEnabled: true,
      });

      return NextResponse.json({ isEnabled: true }, { status: 200 });
    }

    logger.info({
      event: "terminal.remoteSale.notEnabled",
      terminalSerial,
      machineId: machine.id,
      isEnabled: false,
    });

    return NextResponse.json({ isEnabled: false }, { status: 200 });
  } catch (error) {
    logger.error({
      event: "terminal.remoteSale.error",
      terminalSerial,
      machineId: machine.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
