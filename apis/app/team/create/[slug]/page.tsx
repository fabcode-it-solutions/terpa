import TeamDocumentsForm from "@/components/team/team-documents-form";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { slug: string } }) {
  const session = requireSession();
  const slug = params.slug;

  // Fetch the team and verify the user has access
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.uid },
      },
    },
  });

  // If the team doesn't exist or the user doesn't have access, redirect
  if (!team || team.members.length === 0) {
    return redirect("/");
  }

  // If the team is already onboarded we redirect to the team page
  if (team.onboardingCompleted) {
    return redirect(`/team/${team.slug}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted dark:bg-muted/30 p-4 md:py-20">
      <TeamDocumentsForm team={team} />
    </div>
  );
}
