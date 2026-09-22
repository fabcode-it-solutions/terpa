import { requireSession } from "@/lib/session";

import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole } from "@prisma/client";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

export default async function Layout(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);

  const isAdmin = session.role === "ADMIN";
  const isTeamOwner = team.members.some(
    (member) => member.role === TeamMemberRole.OWNER,
  );

  // Only team owners and platform admins can manage users
  if (!isAdmin && !isTeamOwner) {
    return redirect(`/`);
  }

  return <>{props.children}</>;
}
