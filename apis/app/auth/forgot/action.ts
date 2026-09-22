"use server";

import { RESET_PASSWORD_TOKEN_DURATION_SECONDS } from "@/lib/constants/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import mailer from "@/service/mailer";
import { authForgotPasswordSchema } from "@/validation/auth";
import { add } from "date-fns";

/**
 * Handles the forgot password action.
 */
export async function forgotPasswordAction(payload: unknown) {
  const parsed = authForgotPasswordSchema.parse(payload);

  // Check if the user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
  });

  // If the user exists, generate a reset password token and log the URL
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
    await mailer.sendPasswordResetEmail(parsed.email, url);
  } else {
    console.log("Reset password requested for non-existing user", {
      email: parsed.email,
    });
  }

  // Always return success to prevent user enumeration
  return { success: true };
}
