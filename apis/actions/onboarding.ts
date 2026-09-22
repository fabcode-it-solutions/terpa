"use server";

import { TEAM_ONBOARDING_TASKS } from "@/lib/constants/team";
import { prisma } from "@/lib/prisma";
import { getSessionCached } from "@/lib/session";
import logger from "@/utils/logger";
import { updateOnboardingTaskSchema } from "@/validation/onboarding";
import { z } from "zod";

export async function updateOnboardingTask(
  input: z.infer<typeof updateOnboardingTaskSchema>,
) {
  const session = getSessionCached();
  if (!session?.uid) {
    logger.warn({ event: "onboarding.updateOnboardingTask.unauthorized" });
    return {
      error: "Unauthorized",
    };
  }

  const { teamId, taskKey, newValue } = updateOnboardingTaskSchema.parse(input);

  logger.info({
    event: "onboarding.updateOnboardingTask.start",
    userId: session.uid,
    teamId,
    taskKey,
    newValue,
  });

  const task = TEAM_ONBOARDING_TASKS.find((t) => t.key === taskKey);
  if (!task) {
    logger.warn({
      event: "onboarding.updateOnboardingTask.invalidTaskKey",
      userId: session.uid,
      teamId,
      taskKey,
    });
    return {
      error: "Invalid task key",
    };
  }

  const existingTask = await prisma.teamOnboardingTask.findUnique({
    where: {
      teamId_key: {
        teamId,
        key: taskKey,
      },
    },
  });

  const previousValue = existingTask?.value ?? false;

  await prisma.$transaction([
    prisma.teamOnboardingTask.upsert({
      where: {
        teamId_key: {
          teamId,
          key: taskKey,
        },
      },
      update: {
        value: newValue,
      },
      create: {
        teamId,
        key: taskKey,
        value: newValue,
      },
    }),
    prisma.teamOnboardingTaskHistory.create({
      data: {
        teamId,
        key: taskKey,
        previousValue,
        newValue,
        userId: session.uid,
      },
    }),
  ]);

  logger.info({
    event: "onboarding.updateOnboardingTask.success",
    userId: session.uid,
    teamId,
    taskKey,
    previousValue,
    newValue,
  });
  return {
    success: true,
  };
}
