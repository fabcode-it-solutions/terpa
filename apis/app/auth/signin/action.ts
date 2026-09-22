"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import logger from "@/utils/logger";
import { authSignInSchema } from "@/validation/auth";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sign in a user.
 */
export async function signInAction(payload: unknown) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown";

  const parsed = authSignInSchema.parse(payload);
  const logData = { email: parsed.email, userAgent, ip };
  logger.info({
    ...logData,
    event: "auth.signInAction.start",
  });

  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    include: { password: true, totp: true },
  });

  // If the user does not exist or has no password, return an error
  if (!user || !user.password) {
    logger.warn({
      ...logData,
      event: "auth.signInAction.userNotFound",
    });
    return { error: true, reason: "Invalid credentials" };
  }

  // If the user exists, check if the password is correct
  const passwordMatch = await compare(parsed.password, user.password.hash);
  if (!passwordMatch) {
    logger.warn({
      ...logData,
      event: "auth.signInAction.passwordMismatch",
    });
    return { error: true, reason: "Invalid credentials" };
  }

  // Create a session for the user
  const requiresTotp = user.totp?.isActive === true;
  createSession({
    uid: user.id,
    role: user.role,
    type: requiresTotp ? "totp" : "full",
  });

  // Redirect the user to the 2FA page if required
  if (requiresTotp) {
    logger.info({
      ...logData,
      event: "auth.signInAction.success.redirectingToTotp",
    });
    return redirect("/auth/2fa");
  }

  logger.info({
    ...logData,
    event: "auth.signInAction.success.redirectingToHome",
  });
  redirect("/");
}
