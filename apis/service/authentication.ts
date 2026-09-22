/**
 * Authentication Service
 */

import { env } from "@/lib/env";
import type { Session } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { sign, verify } from "jsonwebtoken";

type ApiClientTokenPayload = {
  uid: string;
  role: UserRole;
  type: "full" | "totp";
};

export function createUserToken(
  payload: ApiClientTokenPayload,
  options?: { expiresIn?: string | number },
) {
  const jwt = sign(payload, env.JWT_SECRET, {
    expiresIn: options?.expiresIn || "1d",
  });

  return jwt;
}

export function verifyUserToken(token: string): Session | null {
  try {
    return verify(token, env.JWT_SECRET) as Session;
  } catch {
    return null;
  }
}
