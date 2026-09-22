"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamBySlug } from "@/loaders/team";
import logger from "@/utils/logger";
import {
  teamMemberShowFinancialsSchema,
  userProfileSchema,
} from "@/validation/user";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(payload: unknown) {
  const session = requireSession();
  const parsed = userProfileSchema.parse(payload);

  logger.info({
    event: "user.updateUserProfileAction.start",
    userId: session.uid,
    email: parsed.email,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
  });

  if (!user) {
    logger.warn({
      event: "user.updateUserProfileAction.userNotFound",
      userId: session.uid,
    });
    return { error: "Usuario no encontrado" };
  }

  // Check if email is being changed
  const emailChanged = user.email !== parsed.email;

  // If email is being changed, check if it's already in use
  if (emailChanged) {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser && existingUser.id !== session.uid) {
      logger.warn({
        event: "user.updateUserProfileAction.emailInUse",
        userId: session.uid,
        attemptedEmail: parsed.email,
      });
      return { error: "El correo electrónico ya está en uso" };
    }
  }

  await prisma.user.update({
    where: { id: session.uid },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phoneNumber: parsed.phoneNumber,
    },
  });

  logger.info({
    event: "user.updateUserProfileAction.success",
    userId: session.uid,
    emailChanged,
  });
  revalidatePath("/profile");
  return { success: true };
}

export async function updateTeamMemberShowFinancialsAction(payload: unknown) {
  const session = requireSession();
  const parsed = teamMemberShowFinancialsSchema.parse(payload);

  // Get the team to verify it exists
  const team = await getTeamBySlug(parsed.teamSlug);

  logger.info({
    event: "user.updateTeamMemberShowFinancialsAction.start",
    actorUserId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    targetUserId: parsed.userId,
    showFinancials: parsed.showFinancials,
  });

  // Check if the current user has permission to update this setting
  const currentUserMembership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.uid,
        teamId: team.id,
      },
    },
    select: { role: true },
  });

  // Only OWNER role or platform ADMIN can update showFinancials
  const isOwner = currentUserMembership?.role === TeamMemberRole.OWNER;
  const isPlatformAdmin = session.role === UserRole.ADMIN;

  if (!isOwner && !isPlatformAdmin) {
    logger.warn({
      event: "user.updateTeamMemberShowFinancialsAction.unauthorized",
      actorUserId: session.uid,
      teamId: team.id,
      teamSlug: parsed.teamSlug,
      targetUserId: parsed.userId,
    });
    return { error: "No tienes permisos para modificar esta configuración" };
  }

  // Check if the target user exists in this team
  const targetMembership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: parsed.userId,
        teamId: team.id,
      },
    },
  });

  if (!targetMembership) {
    logger.warn({
      event: "user.updateTeamMemberShowFinancialsAction.targetNotFound",
      actorUserId: session.uid,
      teamId: team.id,
      teamSlug: parsed.teamSlug,
      targetUserId: parsed.userId,
    });
    return { error: "Usuario no encontrado en este equipo" };
  }

  // Update the showFinancials setting
  await prisma.teamMember.update({
    where: {
      userId_teamId: {
        userId: parsed.userId,
        teamId: team.id,
      },
    },
    data: {
      showFinancials: parsed.showFinancials,
    },
  });

  logger.info({
    event: "user.updateTeamMemberShowFinancialsAction.success",
    actorUserId: session.uid,
    teamId: team.id,
    teamSlug: parsed.teamSlug,
    targetUserId: parsed.userId,
    showFinancials: parsed.showFinancials,
  });
  revalidatePath(`/team/${parsed.teamSlug}/users/${parsed.userId}`);
  return { success: true };
}
