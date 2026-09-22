import { prisma } from "@/lib/prisma";
import { endOfDay, isBefore } from "date-fns";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { terminalSerial: string } },
) => {
  const { terminalSerial } = params;

  const terminal = await prisma.terminal.findUnique({
    where: { serialNumber: terminalSerial },
    select: {
      id: true,
      type: true,
      serialNumber: true,
      pharosMerchantCode: true,
      pharosTerminalCode: true,
      flowType: true,
      description: true,
      username: true,
      password: true,
      endpointUrl: true,
      fixedComissionCents: true,
      percentageCommission: true,
      extra1: true,
      extra2: true,
      language: true,
      initialCredit: true,
      acceptCreditPayments: true,
      acceptCashPayments: true,
      acceptServicePayments: true,
      decimalMode: true,
      nip: true,
      key: true,
    },
  });

  const machine = await prisma.machine.findUnique({
    where: { terminalSerialNumber: terminalSerial },
    select: { activeUntilDate: true },
  });

  if (!terminal) {
    return NextResponse.json(
      { error: 404, message: "Terminal not found" },
      { status: 404 },
    );
  }

  const isExpired = machine?.activeUntilDate
    ? isBefore(
        toZonedTime(machine.activeUntilDate, "America/Mexico_City"),
        startOfDay(toZonedTime(new Date(), "America/Mexico_City")),
      )
    : false;

  if (machine && isExpired) {
    terminal.acceptCreditPayments = false;
  }

  return NextResponse.json(
    {
      terminal: {
        id: terminal.id,
        type: terminal.type,
        serialNumber: terminal.serialNumber || "",
        pharosMerchantCode: terminal.pharosMerchantCode || "",
        pharosTerminalCode: terminal.pharosTerminalCode || "",
        flowType: terminal.flowType,
        description: terminal.description || "",
        username: terminal.username || "",
        password: terminal.password || "",
        endpointUrl: terminal.endpointUrl || "",
        fixedComissionCents: terminal.fixedComissionCents ?? -1,
        percentageCommission: terminal.percentageCommission || -1,
        extra1: terminal.extra1 || "",
        extra2: terminal.extra2 || "",
        language: terminal.language || "",
        initialCredit: terminal.initialCredit || -1,
        acceptCreditPayments: terminal.acceptCreditPayments,
        acceptCashPayments: terminal.acceptCashPayments,
        acceptServicePayments: terminal.acceptServicePayments,
        decimalMode: terminal.decimalMode.toNumber(),
        nip: terminal.nip || "",
        key: terminal.key || "",
      },
    },
    { status: 200 },
  );
};
