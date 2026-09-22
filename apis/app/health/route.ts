import { prisma } from "@/lib/prisma";
import logger from "@/utils/logger";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("OK");
  } catch (error) {
    logger.error({
      event: "health.check.error",
      ip: req.ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response("ERROR", { status: 500 });
  }
}
