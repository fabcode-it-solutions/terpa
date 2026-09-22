import { handleUserProtectedRoute } from "@/helpers/api";
import { getTeams } from "@/service/core/teams";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return await handleUserProtectedRoute(req, async (user) => {
    const teams = await getTeams(user.id);
    return NextResponse.json({ teams });
  });
}
