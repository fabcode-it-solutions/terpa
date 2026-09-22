import TeamCreateForm from "@/components/team/team-create-form";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: {
      memberships: { include: { team: true } },
    },
  });

  // If the user does not exist, sign them out
  if (!user) {
    redirect("/auth/signout");
  }

  // If the user is already member of a team, redirect to the team page
  if (user.memberships.length) {
    return redirect(`/team/${user.memberships[0].team.slug}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted dark:bg-muted/30">
      <TeamCreateForm />
    </div>
  );
}
