import { sendDocumentNotificationEmailByTeamId } from "@/service/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } },
) {
  try {
    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 },
      );
    }

    await sendDocumentNotificationEmailByTeamId(teamId);

    return NextResponse.json(
      {
        success: true,
        message: "Document notification email sent successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API] Error resending document notification:", error);

    return NextResponse.json(
      {
        error: "Failed to send document notification email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
