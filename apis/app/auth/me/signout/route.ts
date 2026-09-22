import { deleteSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

async function handler(request: NextRequest) {
  deleteSession();
  return NextResponse.redirect(new URL("/auth/signin", request.url));
}

export { handler as GET, handler as POST };
