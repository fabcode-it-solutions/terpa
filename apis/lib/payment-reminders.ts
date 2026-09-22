import { prisma } from "@/lib/prisma";
import { sendPaymentReminderEmail } from "@/service/mailer";
import logger from "@/utils/logger";
import { TeamMemberRole } from "@prisma/client";
import pMap from "p-map";

/**
 * Executes the monthly payment reminder logic
 * Finds teams with machines expiring at the start of next month and sends email reminders
 */
export async function executeMonthlyPaymentReminders() {
  logger.info({ event: "paymentReminders.execute.start" });

  try {
    // Get Mexico City timezone date for calculations
    const now = new Date();
    const mexicoCityDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
    );

    // Calculate the start of next month in Mexico City timezone
    const nextMonthStart = new Date(
      mexicoCityDate.getFullYear(),
      mexicoCityDate.getMonth() + 1,
      1,
    );
    const nextMonthEnd = new Date(
      mexicoCityDate.getFullYear(),
      mexicoCityDate.getMonth() + 2,
      0,
    );

    logger.info({
      event: "paymentReminders.execute.window",
      from: nextMonthStart.toISOString().split("T")[0],
      to: nextMonthEnd.toISOString().split("T")[0],
    });

    // Find teams with machines expiring in the upcoming month
    const teamsWithExpiringMachines = await prisma.team.findMany({
      where: {
        machines: {
          some: {
            isEnabled: true,
            deletedAt: null,
            activeUntilDate: {
              gte: nextMonthStart,
              lte: nextMonthEnd,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        members: {
          where: { role: TeamMemberRole.OWNER },
          select: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        machines: {
          where: {
            isEnabled: true,
            deletedAt: null,
            activeUntilDate: {
              gte: nextMonthStart,
              lte: nextMonthEnd,
            },
          },
          select: {
            name: true,
            activeUntilDate: true,
          },
        },
      },
    });

    logger.info({
      event: "paymentReminders.execute.teamsFound",
      teamsCount: teamsWithExpiringMachines.length,
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send payment reminder emails to team owners using p-map for controlled concurrency
    const results = await pMap(
      teamsWithExpiringMachines,
      async (team) => {
        const owner = team.members[0]?.user;

        if (!owner?.email) {
          logger.warn({
            event: "paymentReminders.execute.teamMissingOwnerEmail",
            teamId: team.id,
            teamName: team.name,
          });
          return { success: false, skipped: true };
        }

        logger.info({
          event: "paymentReminders.execute.sending",
          email: owner.email,
          teamId: team.id,
          teamName: team.name,
          teamSlug: team.slug,
          machinesCount: team.machines.length,
        });

        try {
          const success = await sendPaymentReminderEmail(
            owner.email,
            team.name,
            team.slug,
            team.machines,
          );

          if (success) {
            logger.info({
              event: "paymentReminders.execute.sent",
              email: owner.email,
              teamId: team.id,
            });
            return { success: true };
          } else {
            logger.error({
              event: "paymentReminders.execute.sendFailed",
              email: owner.email,
              teamId: team.id,
            });
            return { success: false };
          }
        } catch (error) {
          logger.error({
            event: "paymentReminders.execute.errorSending",
            email: owner.email,
            teamId: team.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return { success: false };
        }
      },
      { concurrency: 10 },
    );

    // Count results
    emailsSent = results.filter((r) => r.success).length;
    emailsFailed = results.filter((r) => !r.success && !r.skipped).length;

    logger.info({
      event: "paymentReminders.execute.completed",
      emailsSent,
      emailsFailed,
      teamsProcessed: teamsWithExpiringMachines.length,
    });
    return {
      success: true,
      emailsSent,
      emailsFailed,
      teamsProcessed: teamsWithExpiringMachines.length,
    };
  } catch (error) {
    logger.error({
      event: "paymentReminders.execute.error",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
