"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { adminUserUpdateSchema } from "@/validation/user";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateUserFromAdmin(
  userId: string,
  payload: unknown,
  teamSlug: string,
) {
  const session = requireSession();

  // Check admin authorization
  if (session.role !== UserRole.ADMIN) {
    return {
      error: "No tienes permisos para actualizar la información del usuario.",
    };
  }

  // Validate payload
  const parsed = adminUserUpdateSchema.parse(payload);

  // Check if user exists and is part of the team
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      memberships: { some: { team: { slug: teamSlug } } },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return { error: "Usuario no encontrado en este equipo." };
  }

  // Check if email is being changed and if it's already in use
  if (parsed.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      return {
        error: "El correo electrónico ya está en uso por otro usuario.",
      };
    }
  }

  try {
    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phoneNumber: parsed.phoneNumber,
      },
    });

    // Revalidate pages
    revalidatePath("/", "layout");
    revalidatePath(`/admin/teams/${teamSlug}/manage/users`, "page");
    revalidatePath(`/admin/teams/${teamSlug}/manage/users/${userId}`, "page");

    return { success: true };
  } catch (error) {
    console.error("Error updating user from admin:", error);
    return { error: "Error interno del servidor al actualizar el usuario." };
  }
}
