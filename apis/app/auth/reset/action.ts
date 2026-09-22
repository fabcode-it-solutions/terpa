"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { authResetPasswordSchema } from "@/validation/auth";
import { hash } from "bcryptjs";

export async function resetPasswordAction(payload: unknown) {
  const parsed = authResetPasswordSchema.parse(payload);

  const token = await prisma.passwordResetToken.findUnique({
    where: { id: parsed.token, expiresAt: { gt: new Date() }, usedAt: null },
    select: {
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
    return {
      success: false,
      message:
        "El token no es válido o ha expirado. Por favor solicita uno nuevo.",
    };
  }

  const hashedPassword = await hash(parsed.password, 12);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: parsed.token, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.userPassword.upsert({
      where: { userId: token.user.id },
      create: { userId: token.user.id, hash: hashedPassword },
      update: { hash: hashedPassword },
    }),
  ]);

  // Create a new session for the user
  const requiresTotp = token.user.totp?.isActive || false;
  createSession({
    uid: token.user.id,
    type: requiresTotp ? "totp" : "full",
    role: token.user.role,
  });

  return { success: true, requiresTotp };
}
