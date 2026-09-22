import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { headers } from "next/headers";
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

  const headerSet = headers();
  const merchantCode = headerSet.get("x-merchant-code");
  const terminalCode = headerSet.get("x-terminal-code");
  const versionCode = headerSet.get("x-version-code");

  logger.debug({
    event: "terminal.ping.start",
    terminalSerial,
    ip: req.ip,
    userAgent: req.headers.get("user-agent"),
    merchantCode,
    terminalCode,
    versionCode,
  });

  const machine = await prisma.machine.findUnique({
    where: { terminalSerialNumber: terminalSerial, deletedAt: null },
    select: { id: true, teamId: true },
  });

  if (!machine) {
    logger.error({
      event: "terminal.ping.machine.notFound",
      terminalSerial,
      merchantCode,
      terminalCode,
      versionCode,
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
    await prisma.$transaction([
      prisma.machine.update({
        where: { terminalSerialNumber: terminalSerial },
        data: {
          lastPingAt: new Date(),
          pharosTerminalCode: terminalCode || null,
          versionCode: versionCode || null,
        },
      }),
      prisma.team.update({
        where: { id: machine.teamId },
        data: { pharosMerchantCode: merchantCode || null },
      }),
    ]);

    logger.debug({
      event: "terminal.ping.success",
      terminalSerial,
      machineId: machine.id,
      teamId: machine.teamId,
      merchantCode,
      terminalCode,
      versionCode,
    });

    return NextResponse.json({ message: "pong" });
  } catch (error) {
    logger.error({
      event: "terminal.ping.error",
      terminalSerial,
      machineId: machine.id,
      teamId: machine.teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
