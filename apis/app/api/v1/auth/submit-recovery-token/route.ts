import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { authResetPasswordSchema } from "@/validation/auth";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = authResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const { token: tokenId, password } = parsed.data;

    const token = await prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            totp: { select: { isActive: true } },
          },
        },
      },
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El token no es válido o ha expirado. Por favor solicita uno nuevo.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(password, 12);

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.userPassword.upsert({
        where: { userId: token.user.id },
        create: { userId: token.user.id, hash: hashedPassword },
        update: { hash: hashedPassword },
      }),
    ]);

    const requiresTotp = token.user.totp?.isActive || false;
    createSession({
      uid: token.user.id,
      type: requiresTotp ? "totp" : "full",
      role: token.user.role,
    });

    return NextResponse.json({ success: true, requiresTotp });
  } catch (error) {
    console.error("Error in POST /api/v1/auth/submit-recovery-token:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  throw new Error("Method not implemented.");
}
