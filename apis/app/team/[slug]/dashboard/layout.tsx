import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { getTeamBySlugCached } from "@/loaders/team";
import { requireSession } from "@/lib/session";
import { TeamMemberRole, UserRole } from "@prisma/client";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

export default async function Layout(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Show dashboard if user is admin, owner, or has showFinancials permission
  const showDashboard =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}`}>{team.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${props.params.slug}/dashboard`}>
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>{team.name}</Title>
      </div>
      <div>
        <DashboardTabs showDashboard={showDashboard} />
      </div>
      {showDashboard && props.children}
    </AppContainer>
  );
}
