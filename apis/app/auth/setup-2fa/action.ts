"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { authOptSchema } from "@/validation/auth";
import { revalidatePath } from "next/cache";
import { TOTP } from "totp-generator";

/**
 * Handle setting up the OTP verification action.
 */
export async function setup2FAAction(payload: unknown) {
  const parsed = authOptSchema.parse(payload);

  // Check if there is a valid totp session.
  const session = requireSession();

  // Check if the user has an active TOTP.
  const userTotp = await prisma.userTOTP.findUnique({
    where: { userId: session.uid },
  });

  // Check if the user already has 2FA enabled.
  if (userTotp?.isActive) {
    return { success: false, message: "2FA is already enabled" };
  }

  // If there is no user TOTP, return an error because we don't have a secret.
  if (!userTotp) {
    return { success: false, message: "The user cannot set up 2FA" };
  }

  // Verify the OTP.
  const current = TOTP.generate(userTotp.secret);
  if (current.otp !== parsed.otp) {
    return { success: false, message: "Invalid Code" };
  }

  // Update the user TOTP to be active.
  await prisma.userTOTP.update({
    where: { userId: session.uid },
    data: { isActive: true },
  });

  revalidatePath("/", "layout");

  return { success: true };
}
