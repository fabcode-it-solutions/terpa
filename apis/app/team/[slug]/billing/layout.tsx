import { requireSession } from "@/lib/session";
import { BillingTabs } from "@/components/team/billing-tabs";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { isFacturamaEnabledForTeam } from "@/service/experiment";

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

  // Only team owners and platform admins can manage billing
  if (!isAdmin && !isTeamOwner) {
    return redirect(`/`);
  }

  const isFacturamaEnabled = await isFacturamaEnabledForTeam(team.id);

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
            <BreadcrumbLink>Facturación</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Title>Facturación</Title>
          <Button asChild size="sm">
            <Link href={`/team/${props.params.slug}/billing/invoice/new`}>
              <Plus className="h-4 w-4" />
              Nuevo Pago
            </Link>
          </Button>
        </div>
        <BillingTabs
          teamSlug={props.params.slug}
          isFacturamaEnabled={isFacturamaEnabled}
        />
        {props.children}
      </div>
    </AppContainer>
  );
}
