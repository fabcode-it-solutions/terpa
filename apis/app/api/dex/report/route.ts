import { handleDexDiff } from "@/lib/api/dex";
import { prisma } from "@/lib/prisma";
import { compareReports } from "@/service/dex";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  // The serial number of the terminal
  serial: z.string().trim(),
  // The merchant code of the terminal
  merchantCode: z.string().trim(),
  // The terminal code of the terminal
  terminalCode: z.string().trim(),
  // The report uuid
  reportId: z.string().uuid(),
  // The report data
  data: z
    .object({
      tubes: z.object({
        // The amount of money in tubes
        total: z.number(),
        // The amount of money in recycler
        recyclerCount: z.number(),
      }),
      machine: z
        .object({
          serial: z.string().trim(),
          model: z.string().trim(),
          version: z.string().trim(),
        })
        .nullish(),
    })
    .nullish(),
});

/**
 * POST /api/dex/report
 *
 * Handles a new report submission from the dex service
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());

  // check if the request body is valid
  if (!parsed.success) {
    return new Response("Invalid Payload", { status: 400 });
  }

  const nextReportId = parsed.data.reportId;

  // check if a machine with the serial number exists
  const machine = await prisma.machine.findUnique({
    where: { terminalSerialNumber: parsed.data.serial },
    select: { id: true, teamId: true, protocol: true },
  });

  // if the machine does not exist, return a 404
  if (!machine) {
    return new Response("Machine not found", { status: 404 });
  }

  let tubesTotal = 0;
  if (parsed.data.data?.tubes) {
    tubesTotal += parsed.data.data.tubes.total;
    tubesTotal += parsed.data.data.tubes.recyclerCount;
  }

  // update the machine with the new report data
  await prisma.$transaction([
    prisma.machine.update({
      where: { id: machine.id },
      data: {
        tubesTotal,
        machineModel: parsed.data.data?.machine?.model || null,
        machineSerial: parsed.data.data?.machine?.serial || null,
        machineVersion: parsed.data.data?.machine?.version || null,
        pharosTerminalCode: parsed.data.terminalCode,
        lastPingAt: new Date(),
      },
    }),
    prisma.team.update({
      where: { id: machine.teamId },
      data: { pharosMerchantCode: parsed.data.merchantCode },
    }),
  ]);

  /**
   * Handling a report
   *
   * Check if the machine has a previous report
   * If it does,
   *   use the compare service to compare the reports
   *   and act on the result
   * If it doesn't,
   *   just save the report so it can be compared
   *   to at a later time
   */
  return await prisma.dexReport
    .findFirst({
      where: { machineId: machine.id },
      orderBy: { createdAt: "desc" },
    })
    .then(async (existingReport) => {
      if (existingReport) {
        const diff = await compareReports(
          existingReport.reportId,
          parsed.data.reportId,
        );
        await handleDexDiff({
          protocol: machine.protocol,
          machineId: machine.id,
          nextReportId,
          diff,
        });
      } else {
        // idempotently create the report
        await prisma.dexReport.upsert({
          where: { reportId: parsed.data.reportId },
          create: {
            reportId: parsed.data.reportId,
            machineId: machine.id,
          },
          update: {},
        });
      }

      return new Response("OK", { status: 200 });
    })
    .catch((error) => {
      console.error(error);
      return new Response("OK", { status: 200 });
    });
}
