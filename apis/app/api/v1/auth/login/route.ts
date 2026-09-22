/**
 * Login Route
 *
 * 1. Gets username/password from Basic Auth header
 * 2. Validates credentials against the database
 * 3. Returns a JWT token if valid, or an error if invalid
 */

import { prisma } from "@/lib/prisma";
import { createUserToken } from "@/service/authentication";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    // Get header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Decode credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [email, password] = credentials.split(":");

    // Validate email syntax
    const isValid = z.string().email().safeParse(email);
    if (!isValid.success) {
      return new Response("Unauthorized", { status: 400 });
    }

    // Validate against the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        totp: true,
        password: { select: { hash: true } },
      },
    });

    const isCustomer = existingUser?.role === UserRole.CUSTOMER;

    if (
      !existingUser || // user must exist
      !existingUser.password || // user must have a password
      !isCustomer // only customers can log in via this route
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check password
    // If the user exists, check if the password is correct
    const passwordMatch = await compare(password, existingUser.password.hash);
    if (!passwordMatch) {
      return new Response("Unauthorized", { status: 401 });
    }

    // User authenticated successfully
    const jwt = await createUserToken(
      {
        uid: existingUser.id,
        role: existingUser.role,
        type: existingUser.totp ? "totp" : "full",
      },
      { expiresIn: "30d" },
    );

    return NextResponse.json({
      token: jwt,
      requiresTotp: !!existingUser.totp,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
