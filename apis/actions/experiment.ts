"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import logger from "@/utils/logger";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addTeamToExperimentAction(
  experimentKey: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "experiment.addTeamToExperimentAction.unauthorized",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    redirect("/admin/teams");
  }

  try {
    logger.info({
      event: "experiment.addTeamToExperimentAction.start",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    // Check if experiment exists
    const experiment = await prisma.experiment.findUnique({
      where: { key: experimentKey },
    });

    if (!experiment) {
      logger.warn({
        event: "experiment.addTeamToExperimentAction.experimentNotFound",
        userId: session.uid,
        experimentKey,
      });
      return { success: false, error: "Experimento no encontrado" };
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      logger.warn({
        event: "experiment.addTeamToExperimentAction.teamNotFound",
        userId: session.uid,
        experimentKey,
        teamId,
      });
      return { success: false, error: "Equipo no encontrado" };
    }

    // Check if relationship already exists
    const existingRelation = await prisma.experimentTeam.findUnique({
      where: {
        experimentId_teamId: {
          experimentId: experimentKey,
          teamId,
        },
      },
    });

    if (existingRelation) {
      logger.warn({
        event: "experiment.addTeamToExperimentAction.alreadyAssigned",
        userId: session.uid,
        experimentKey,
        teamId,
      });
      return {
        success: false,
        error: "El equipo ya está asignado a este experimento",
      };
    }

    // Create the relationship
    await prisma.experimentTeam.create({
      data: {
        experimentId: experimentKey,
        teamId,
      },
    });

    revalidatePath(`/admin/experimentos`);
    revalidatePath(`/admin/experimentos/${experimentKey}`);

    logger.info({
      event: "experiment.addTeamToExperimentAction.success",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    return { success: true };
  } catch (error) {
    logger.error({
      event: "experiment.addTeamToExperimentAction.error",
      userId: session.uid,
      experimentKey,
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function removeTeamFromExperimentAction(
  experimentKey: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "experiment.removeTeamFromExperimentAction.unauthorized",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    redirect("/admin/teams");
  }

  try {
    logger.info({
      event: "experiment.removeTeamFromExperimentAction.start",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    // Check if relationship exists
    const existingRelation = await prisma.experimentTeam.findUnique({
      where: {
        experimentId_teamId: {
          experimentId: experimentKey,
          teamId,
        },
      },
    });

    if (!existingRelation) {
      logger.warn({
        event: "experiment.removeTeamFromExperimentAction.notAssigned",
        userId: session.uid,
        experimentKey,
        teamId,
      });
      return {
        success: false,
        error: "El equipo no está asignado a este experimento",
      };
    }

    // Remove the relationship
    await prisma.experimentTeam.delete({
      where: {
        experimentId_teamId: {
          experimentId: experimentKey,
          teamId,
        },
      },
    });

    revalidatePath(`/admin/experimentos`);
    revalidatePath(`/admin/experimentos/${experimentKey}`);

    logger.info({
      event: "experiment.removeTeamFromExperimentAction.success",
      userId: session.uid,
      experimentKey,
      teamId,
    });
    return { success: true };
  } catch (error) {
    logger.error({
      event: "experiment.removeTeamFromExperimentAction.error",
      userId: session.uid,
      experimentKey,
      teamId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function getAllTeamsAction() {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "experiment.getAllTeamsAction.unauthorized",
      userId: session.uid,
    });
    redirect("/admin/teams");
  }

  try {
    logger.info({
      event: "experiment.getAllTeamsAction.start",
      userId: session.uid,
    });
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            machines: {
              where: {
                deletedAt: null, // Only count non-soft-deleted machines
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include machine count directly
    const teamsWithMachineCount = teams.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      machineCount: team._count.machines,
    }));

    logger.info({
      event: "experiment.getAllTeamsAction.success",
      userId: session.uid,
      teamsCount: teamsWithMachineCount.length,
    });
    return { success: true, teams: teamsWithMachineCount };
  } catch (error) {
    logger.error({
      event: "experiment.getAllTeamsAction.error",
      userId: session.uid,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, teams: [], error: "Error al cargar equipos" };
  }
}

export async function toggleExperimentStatusAction(
  experimentKey: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "experiment.toggleExperimentStatusAction.unauthorized",
      userId: session.uid,
      experimentKey,
      isActive,
    });
    redirect("/admin/teams");
  }

  try {
    logger.info({
      event: "experiment.toggleExperimentStatusAction.start",
      userId: session.uid,
      experimentKey,
      isActive,
    });
    // Check if experiment exists
    const experiment = await prisma.experiment.findUnique({
      where: { key: experimentKey },
    });

    if (!experiment) {
      logger.warn({
        event: "experiment.toggleExperimentStatusAction.experimentNotFound",
        userId: session.uid,
        experimentKey,
      });
      return { success: false, error: "Experimento no encontrado" };
    }

    // Update the experiment status
    await prisma.experiment.update({
      where: { key: experimentKey },
      data: { isActive },
    });

    revalidatePath(`/admin/experimentos`);
    revalidatePath(`/admin/experimentos/${experimentKey}`);

    logger.info({
      event: "experiment.toggleExperimentStatusAction.success",
      userId: session.uid,
      experimentKey,
      isActive,
    });
    return { success: true };
  } catch (error) {
    logger.error({
      event: "experiment.toggleExperimentStatusAction.error",
      userId: session.uid,
      experimentKey,
      isActive,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function toggleExperimentGlobalStatusAction(
  experimentKey: string,
  isGlobal: boolean,
): Promise<{ success: boolean; error?: string }> {
  const session = requireSession();
  if (session.role !== UserRole.ADMIN) {
    logger.warn({
      event: "experiment.toggleExperimentGlobalStatusAction.unauthorized",
      userId: session.uid,
      experimentKey,
      isGlobal,
    });
    redirect("/admin/teams");
  }

  try {
    logger.info({
      event: "experiment.toggleExperimentGlobalStatusAction.start",
      userId: session.uid,
      experimentKey,
      isGlobal,
    });
    // Check if experiment exists
    const experiment = await prisma.experiment.findUnique({
      where: { key: experimentKey },
    });

    if (!experiment) {
      logger.warn({
        event:
          "experiment.toggleExperimentGlobalStatusAction.experimentNotFound",
        userId: session.uid,
        experimentKey,
      });
      return { success: false, error: "Experimento no encontrado" };
    }

    // Use transaction to ensure data consistency
    const operations = [];

    // If switching to global, remove all team assignments
    if (isGlobal) {
      operations.push(
        prisma.experimentTeam.deleteMany({
          where: { experimentId: experimentKey },
        }),
      );
    }

    // Update the experiment global status
    operations.push(
      prisma.experiment.update({
        where: { key: experimentKey },
        data: { isGlobal },
      }),
    );

    await prisma.$transaction(operations);

    revalidatePath(`/admin/experimentos`);
    revalidatePath(`/admin/experimentos/${experimentKey}`);

    logger.info({
      event: "experiment.toggleExperimentGlobalStatusAction.success",
      userId: session.uid,
      experimentKey,
      isGlobal,
    });
    return { success: true };
  } catch (error) {
    logger.error({
      event: "experiment.toggleExperimentGlobalStatusAction.error",
      userId: session.uid,
      experimentKey,
      isGlobal,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Error interno del servidor" };
  }
}

export async function getExperimentStatusAction(
  experimentKey: string,
  teamSlug: string,
): Promise<{ success: boolean; isActive: boolean; error?: string }> {
  const session = requireSession();

  try {
    logger.info({
      event: "experiment.getExperimentStatusAction.start",
      userId: session.uid,
      experimentKey,
      teamSlug,
    });

    // First, get the team by slug
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    });

    if (!team) {
      logger.warn({
        event: "experiment.getExperimentStatusAction.teamNotFound",
        userId: session.uid,
        experimentKey,
        teamSlug,
      });
      return { success: true, isActive: false };
    }

    // Check if experiment exists and get its details
    const experiment = await prisma.experiment.findUnique({
      where: { key: experimentKey },
      include: {
        experimentTeams: {
          where: {
            teamId: team.id,
          },
        },
      },
    });

    if (!experiment) {
      logger.warn({
        event: "experiment.getExperimentStatusAction.experimentNotFound",
        userId: session.uid,
        experimentKey,
        teamSlug,
      });
      return { success: true, isActive: false };
    }

    if (!experiment.isActive) {
      logger.info({
        event: "experiment.getExperimentStatusAction.experimentInactive",
        userId: session.uid,
        experimentKey,
        teamSlug,
      });
      return { success: true, isActive: false };
    }

    // Check if experiment is global or team has access
    const isActive =
      experiment.isGlobal || experiment.experimentTeams.length > 0;

    logger.info({
      event: "experiment.getExperimentStatusAction.success",
      userId: session.uid,
      experimentKey,
      teamSlug,
      teamId: team.id,
      isActive,
      isGlobal: experiment.isGlobal,
    });

    return { success: true, isActive };
  } catch (error) {
    logger.error({
      event: "experiment.getExperimentStatusAction.error",
      userId: session.uid,
      experimentKey,
      teamSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      isActive: false,
      error: "Error interno del servidor",
    };
  }
}
