import { prisma } from "@/lib/prisma";

export async function getExperiment(key: string) {
  try {
    const experiment = await prisma.experiment.findUnique({
      where: { key },
      include: {
        experimentTeams: {
          include: {
            team: {
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
            },
          },
        },
      },
    });

    if (!experiment) {
      return { error: "Experiment not found", experiment: null };
    }

    return { error: null, experiment };
  } catch (error) {
    return { error: "Failed to fetch experiment", experiment: null };
  }
}

export async function getAllExperiments() {
  try {
    const experiments = await prisma.experiment.findMany({
      include: {
        experimentTeams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { error: null, experiments };
  } catch (error) {
    return { error: "Failed to fetch experiments", experiments: [] };
  }
}

export async function getExperimentsForTeam(teamId: string) {
  try {
    // Get global experiments (available to all teams)
    const globalExperiments = await prisma.experiment.findMany({
      where: {
        isGlobal: true,
        isActive: true,
      },
    });

    // Get team-specific experiments
    const teamExperiments = await prisma.experiment.findMany({
      where: {
        isGlobal: false,
        isActive: true,
        experimentTeams: {
          some: {
            teamId,
          },
        },
      },
    });

    // Combine and deduplicate
    const allExperiments = [...globalExperiments, ...teamExperiments];
    const uniqueExperiments = allExperiments.filter(
      (exp, index, self) => index === self.findIndex((e) => e.key === exp.key),
    );

    return { error: null, experiments: uniqueExperiments };
  } catch (error) {
    return { error: "Failed to fetch experiments for team", experiments: [] };
  }
}

export async function isExperimentActiveForTeam(
  experimentKey: string,
  teamId: string,
) {
  try {
    const experiment = await prisma.experiment.findUnique({
      where: { key: experimentKey },
      include: {
        experimentTeams: {
          where: {
            teamId,
          },
        },
      },
    });

    if (!experiment || !experiment.isActive) {
      return { error: null, isActive: false };
    }

    // Check if experiment is global or team has access
    const isActive =
      experiment.isGlobal || experiment.experimentTeams.length > 0;

    return { error: null, isActive };
  } catch (error) {
    return { error: "Failed to check experiment status", isActive: false };
  }
}

export async function isFacturamaEnabledForTeam(teamId: string) {
  const result = await isExperimentActiveForTeam("FACTURAMA", teamId);
  return result.isActive;
}
