"use server";

import { createTotpSecret } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import logger from "@/utils/logger";
import { authSignUpSchema } from "@/validation/auth";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sign up a new user.
 */
export async function signUpAction(payload: unknown) {
  const parsed = authSignUpSchema.parse(payload);

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown";

  logger.info({
    email: parsed.email,
    userAgent,
    ip,
    event: "auth.signUpAction.start",
  });

  // Check if the email is already in use
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
  });

  // If the email is already in use, return an error
  if (existingUser) {
    logger.warn({
      email: parsed.email,
      userAgent,
      ip,
      event: "auth.signUpAction.emailAlreadyInUse",
    });
    return { error: true, reason: "Email already in use" };
  }

  // Create the user
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      password: { create: { hash: await hash(parsed.password, 12) } },
      totp: { create: { secret: createTotpSecret() } },
    },
  });

  // Create a session for the user
  createSession({
    uid: user.id,
    role: user.role,
    type: "full",
  });

  logger.info({
    email: parsed.email,
    userAgent,
    ip,
    event: "auth.signUpAction.success.redirectingToHome",
  });

  // Redirect the home page
  redirect("/");
}
