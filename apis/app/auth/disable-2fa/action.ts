"use server";

import { createTotpSecret } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { authOptSchema } from "@/validation/auth";
import { revalidatePath } from "next/cache";
import { TOTP } from "totp-generator";

/**
 * Handle the OTP verification action.
 */
export async function disable2faAction(payload: unknown) {
  const parsed = authOptSchema.parse(payload);

  // Check if there is a valid session.
  const session = getSession();
  if (!session) {
    return { success: false, message: "Invalid session" };
  }

  // Check if the user has an active TOTP.
  const userTotp = await prisma.userTOTP.findUnique({
    where: { userId: session.uid, isActive: true },
  });
  if (!userTotp) {
    return { success: false, message: "Invalid session" };
  }

  // Verify the OTP.
  const current = TOTP.generate(userTotp.secret);
  if (current.otp !== parsed.otp) {
    return { success: false, message: "Invalid Code" };
  }

  // Disable the TOTP and generate a new secret.
  await prisma.userTOTP.update({
    where: { userId: session.uid },
    data: {
      isActive: false,
      secret: createTotpSecret(),
    },
  });

  revalidatePath("/", "layout");

  return { success: true };
}
