import { RESET_PASSWORD_TOKEN_DURATION_SECONDS } from "@/lib/constants/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import mailer from "@/service/mailer";
import { authForgotPasswordSchema } from "@/validation/auth";
import { add } from "date-fns";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = authForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const { email } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      const token = await prisma.passwordResetToken.create({
        data: {
          userId: existingUser.id,
          expiresAt: add(new Date(), {
            seconds: RESET_PASSWORD_TOKEN_DURATION_SECONDS,
          }),
        },
      });

      const url = `${env.APP_BASE_URL}/auth/reset?token=${token.id}`;
      await mailer.sendPasswordResetEmail(email, url);
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/v1/auth/request-recovery-token:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
