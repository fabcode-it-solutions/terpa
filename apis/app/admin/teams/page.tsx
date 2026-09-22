import TeamsList from "@/components/team/teams-list";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { TeamMemberRole } from "@prisma/client";
import Link from "next/link";

type Props = {
  searchParams: {
    query?: string;
    sort?: "name" | "machines" | "createdAt";
    showArchived?: string;
  };
};

export default async function Page(props: Props) {
  const showArchived = props.searchParams.showArchived === "true";

  const teams = await prisma.team.findMany({
    where: showArchived ? {} : { isArchived: false },
    select: {
      id: true,
      name: true,
      createdAt: true,
      slug: true,
      pharosMerchantCode: true,
      costPerMachineCents: true,
      contactNumber: true,
      onboardingCompleted: true,
      isArchived: true,
      _count: {
        select: {
          machines: {
            where: {
              deletedAt: null,
              isEnabled: true,
              activeUntilDate: { gte: new Date() },
            },
          },
        },
      },
      members: {
        where: {
          role: TeamMemberRole.OWNER,
        },
        select: {
          role: true,
          user: {
            select: {
              email: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin`}>Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Equipos</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Equipos</Title>
      <TeamsList
        teams={teams}
        initialQuery={props.searchParams.query || ""}
        currentSort={props.searchParams.sort}
        showArchived={showArchived}
      />
    </AppContainer>
  );
}
