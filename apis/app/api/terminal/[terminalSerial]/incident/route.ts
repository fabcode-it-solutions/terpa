import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { machineIncidentCreateSchema } from "@/validation/machine";
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
  const { message } = machineIncidentCreateSchema.parse(await req.json());

  const machine = await prisma.machine.findUnique({
    where: { terminalSerialNumber: terminalSerial, deletedAt: null },
  });

  if (!machine) {
    logger.error({
      event: "terminal.incident.machine.notFound",
      terminalSerial,
      ip: req.ip,
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json(
      { error: 404, message: "Machine not found" },
      { status: 404 },
    );
  }

  try {
    await prisma.incident.create({
      data: {
        machineId: machine.id,
        message,
      },
    });

    logger.info({
      event: "terminal.incident.created",
      terminalSerial,
      machineId: machine.id,
      messageLength: message.length,
      ip: req.ip,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ message: "Incident created" }, { status: 201 });
  } catch (error) {
    logger.error({
      event: "terminal.incident.error",
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
