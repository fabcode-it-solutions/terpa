import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Check if user has dashboard access
  const showDashboard =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;

  // Redirect based on permissions
  if (showDashboard) {
    return redirect(`/team/${props.params.slug}/dashboard`);
  } else {
    return redirect(`/team/${props.params.slug}/machines`);
  }
}
