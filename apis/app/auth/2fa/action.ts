"use server";

import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/session";
import { authOptSchema } from "@/validation/auth";
import { redirect } from "next/navigation";
import { TOTP } from "totp-generator";

/**
 * Handle the OTP verification action.
 */
export async function otpVerifyAction(payload: unknown) {
  const parsed = authOptSchema.parse(payload);

  // Check if there is a valid totp session.
  const session = getSession("totp");
  if (!session) {
    return { error: true, message: "Invalid session" };
  }

  // Check if the user has an active TOTP.
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { totp: true },
  });
  if (!user?.totp?.isActive) {
    return { error: true, message: "Invalid session" };
  }

  // Verify the OTP.
  const current = TOTP.generate(user.totp.secret);
  if (current.otp !== parsed.otp) {
    return { error: true, message: "Invalid Code" };
  }

  // Create a new full session.
  createSession({
    uid: session.uid,
    type: "full",
    role: user.role,
  });

  redirect("/");
}
