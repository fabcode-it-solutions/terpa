import { convertToMonterreyTimezone } from "@/lib/date-utils";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const todayInMexicoCity = convertToMonterreyTimezone(new Date());

  const result = await prisma.machine.updateMany({
    where: {
      isEnabled: true,
      activeUntilDate: {
        lte: todayInMexicoCity,
      },
    },
    data: {
      isEnabled: false,
    },
  });

  return NextResponse.json({
    message: "Machine deactivation process completed.",
    updatedCount: result.count,
  });
}
