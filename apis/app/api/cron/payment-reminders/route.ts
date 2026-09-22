import { env } from "@/lib/env";
import { executeMonthlyPaymentReminders } from "@/lib/payment-reminders";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  //executeMonthlyPaymentReminders
  try {
    const result = await executeMonthlyPaymentReminders();

    return NextResponse.json({
      message: "Payment reminders process completed.",
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed,
      teamsProcessed: result.teamsProcessed,
    });
  } catch (error) {
    console.error("Error executing payment reminders:", error);
    return NextResponse.json(
      {
        message: "Payment reminders process failed.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
