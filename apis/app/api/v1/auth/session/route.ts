import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/service/authentication";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let token: string | undefined;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    if (!token) {
      const cookieStore = cookies();
      const cookie = cookieStore.get(SESSION_COOKIE_NAME);
      token = cookie?.value;
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.uid, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        totp: { select: { isActive: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      requiresTotp: user.totp?.isActive === true,
      session: {
        uid: payload.uid,
        role: payload.role,
        type: payload.type,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/auth/session:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
