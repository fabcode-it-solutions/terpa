import {
  FULL_SESSION_DURATION_SECONDS,
  OTP_SESSION_DURATION_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/constants/auth";
import { env } from "@/lib/env";
import { createUserToken } from "@/service/authentication";
import { UserRole } from "@prisma/client";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * A session object
 */
export type Session = {
  /**
   * The user's unique identifier.
   */
  uid: string;

  /**
   * The user's role.
   */
  role: UserRole;

  /**
   * The session's type.
   * - `full` indicates a full session. This is the default session type and
   *   indicates that the user is authenticated.
   * - `totp` indicates a TOTP session. This session type is used when the user
   *  entered valid credentials and needs to complete TOTP verification.
   */
  type: "full" | "totp";
};

/**
 * Creates a new session and stores it in a cookie as a JWT.
 */
export function createSession(session: Session) {
  const cookieStore = cookies();

  // Determine the duration of the session depending on the session type.
  const duration =
    session.type === "full"
      ? FULL_SESSION_DURATION_SECONDS
      : OTP_SESSION_DURATION_SECONDS;

  // Create a new session token.
  const token = createUserToken(
    {
      uid: session.uid,
      role: session.role,
      type: session.type,
    },
    { expiresIn: duration },
  );

  // Store the session token in a cookie.
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires: new Date(Date.now() + duration * 1000),
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
  });
}

/**
 * Gets the current session from the request.
 *
 * @param type The type of session to get. Defaults to `full`. If the session
 * type does not match, `null` is returned.
 */
export function getSession(type: "totp" | "full" = "full"): Session | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  // If there is no token, return null.
  if (!token) {
    return null;
  }

  // Verify the token and return the session if it is valid.
  try {
    const session = verify(token.value, env.JWT_SECRET) as Session;
    if (session.type !== type) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Requires a full session. If the session is not a full session, the user is
 * redirected to the root page.
 */
export function requireSession(): Session {
  const session = getSessionCached();
  if (!session || session.type !== "full") {
    redirect("/auth/signin");
  }

  return session;
}

export const getSessionCached = cache(getSession);

/**
 * Deletes the current session.
 */
export function deleteSession() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(),
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
  });
}
