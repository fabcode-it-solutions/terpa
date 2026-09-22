"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import {
  routeCreateSchema,
  routeDeleteSchema,
  routeMachineAddSchema,
  routeSettingsSchema,
} from "@/validation/route";
import { revalidatePath } from "next/cache";

/**
 * Handles the creation of a new route.
 */
export async function routeCreateAction(payload: unknown) {
  const session = requireSession();
  const result = routeCreateSchema.parse(payload);
  const { teamSlug, name } = result;

  try {
    const team = await getTeamBySlugCached(teamSlug);

    if (!team) {
      return { error: "Equipo no encontrado" };
    }

    // Check if a route with the same name already exists
    const existingRoute = await prisma.route.findFirst({
      where: {
        teamId: team.id,
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingRoute) {
      return { error: "Ya existe una ruta con ese nombre en este equipo" };
    }

    const route = await prisma.route.create({
      data: {
        name,
        teamId: team.id,
      },
    });

    revalidatePath(`/`, "layout");
    return { success: true, route };
  } catch (error) {
    console.error("Error creating route:", error);
    return { error: "Error al crear la ruta" };
  }
}

/**
 * Handles the deletion of a route.
 */
export async function routeDeleteAction(payload: unknown) {
  const session = requireSession();
  const result = routeDeleteSchema.parse(payload);
  const { teamSlug, routeId } = result;

  try {
    const team = await getTeamBySlugCached(teamSlug);

    if (!team) {
      return { error: "Equipo no encontrado" };
    }

    // Check if the route exists and belongs to the team
    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        teamId: team.id,
        deletedAt: null,
      },
    });

    if (!route) {
      return { error: "Ruta no encontrada" };
    }

    // Check if there are any machines associated with this route
    const associatedMachines = await prisma.routeMachine.findFirst({
      where: { routeId: route.id },
    });

    if (associatedMachines) {
      return { error: "No se puede eliminar una ruta con máquinas asociadas" };
    }

    // Soft delete the route
    await prisma.route.update({
      where: { id: route.id },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/team/${teamSlug}/routes`, "page");
    return { success: true };
  } catch (error) {
    console.error("Error deleting route:", error);
    return { error: "Error al eliminar la ruta" };
  }
}

/**
 * Handles updating the settings of a route.
 */
export async function routeSettingsAction(payload: unknown) {
  const result = routeSettingsSchema.parse(payload);
  const { teamSlug, routeId, name } = result;

  try {
    const team = await getTeamBySlugCached(teamSlug);

    if (!team) {
      return { error: "Equipo no encontrado" };
    }

    // Check if the route exists and belongs to the team
    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        teamId: team.id,
        deletedAt: null,
      },
    });

    if (!route) {
      return { error: "Ruta no encontrada" };
    }

    // Check if a route with the same name already exists (excluding the current route)
    const existingRoute = await prisma.route.findFirst({
      where: {
        teamId: team.id,
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: { not: routeId },
        deletedAt: null,
      },
    });

    if (existingRoute) {
      return { error: "Ya existe una ruta con ese nombre en este equipo" };
    }

    // Update the route name
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: { name },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error updating route settings:", error);
    return { error: "Error al actualizar la configuración de la ruta" };
  }
}

/**
 * Handles adding a machine to a route.
 */
export async function addMachineToRouteAction(payload: unknown) {
  const session = requireSession();
  const result = routeMachineAddSchema.parse(payload);
  const { teamSlug, routeId, machineId } = result;

  try {
    const team = await getTeamBySlugCached(teamSlug);

    if (!team) {
      return { error: "Equipo no encontrado" };
    }

    // Check if the route exists and belongs to the team
    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        teamId: team.id,
        deletedAt: null,
      },
    });

    if (!route) {
      return { error: "Ruta no encontrada" };
    }

    // Check if the machine is already part of the route
    const existingMachine = await prisma.routeMachine.findFirst({
      where: {
        routeId: route.id,
        machineId: machineId,
      },
    });

    if (existingMachine) {
      return { error: "La máquina ya está asociada a esta ruta" };
    }

    // Add the machine to the route
    await prisma.routeMachine.create({
      data: {
        routeId: route.id,
        machineId: machineId,
      },
    });

    revalidatePath(`/team/${teamSlug}/routes`, "page");
    return { success: true };
  } catch (error) {
    console.error("Error adding machine to route:", error);
    return { error: "Error al agregar la máquina a la ruta" };
  }
}
