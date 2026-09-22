import { AdminTeamDocumentsDisplay } from "@/components/team/admin-team-documents-display";
import { AdminTeamDocumentsSidebar } from "@/components/team/admin-team-documents-sidebar";
import { UnarchiveTeamCard } from "@/components/team/unarchive-team-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TEAM_ONBOARDING_TASKS } from "@/lib/constants/team";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import { FileCheckIcon, FileQuestionIcon } from "lucide-react";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const tasks = await prisma.teamOnboardingTask.findMany({
    where: {
      teamId: team.id,
    },
    select: {
      key: true,
      value: true,
    },
  });

  const taskKeys = TEAM_ONBOARDING_TASKS.map((task) => task.key);
  const taskHistories = await prisma.teamOnboardingTaskHistory.findMany({
    where: {
      teamId: team.id,
      key: {
        in: taskKeys,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const latestTaskHistories = Array.from(
    taskHistories
      .reduce((map, history) => {
        if (!map.has(history.key)) {
          map.set(history.key, history);
        }
        return map;
      }, new Map())
      .values(),
  );

  const timeline = await prisma.teamOnboardingTaskHistory.findMany({
    where: {
      teamId: team.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <aside className="w-full md:w-[30%] space-y-4">
        {team.isArchived && <UnarchiveTeamCard teamSlug={team.slug} />}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Onboarding {team.onboardingCompleted ? "Completado" : "Pendiente"}
              {team.onboardingCompleted ? (
                <FileCheckIcon className="size-5" />
              ) : (
                <FileQuestionIcon className="size-5" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.onboardingCompleted ? (
              <p className="text-sm text-muted-foreground">
                El equipo ha completado el proceso de onboarding.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                El equipo aún no ha completado el proceso de onboarding.
              </p>
            )}
          </CardContent>
        </Card>
        <AdminTeamDocumentsSidebar
          teamId={team.id}
          tasks={tasks}
          histories={latestTaskHistories as any}
          timeline={timeline}
          onboardingCompleted={team.onboardingCompleted}
        />
      </aside>
      <main className="w-full md:w-[70%]">
        <Card>
          <CardHeader>
            <CardTitle>Documentos del Equipo</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <AdminTeamDocumentsDisplay
              teamSlug={team.slug}
              documents={team.documents || []}
              legalEntityType={team.legalEntityType}
              electronicSignature={
                team.electronicSignature
                  ? team.electronicSignature.toString("base64")
                  : null
              }
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
