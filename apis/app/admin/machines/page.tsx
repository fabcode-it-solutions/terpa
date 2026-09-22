import AdminMachinesTable from "@/components/admin/admin-machines-table";
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
import Link from "next/link";

type Props = {
  searchParams: {
    query?: string;
    page?: string;
    teamId?: string;
    status?: string;
    showArchived?: string;
    sort?:
      | "team-asc"
      | "team-desc"
      | "name-asc"
      | "name-desc"
      | "lastPing-asc"
      | "lastPing-desc"
      | "expiration-asc"
      | "expiration-desc"
      | "team"
      | "name"
      | "lastPing"
      | "expiration";
  };
};

export default async function Page(props: Props) {
  const page = props.searchParams.page ? parseInt(props.searchParams.page) : 1;
  const showArchived = props.searchParams.showArchived !== "false";
  const teams = await getTeams(showArchived);

  // Find the team slug from the teamId parameter
  const selectedTeam = props.searchParams.teamId
    ? teams.find((team) => team.id === props.searchParams.teamId)
    : undefined;

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
          <BreadcrumbPage>Máquinas</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4">
        <Title>Máquinas</Title>
        <AdminMachinesTable
          query={props.searchParams.query}
          page={page}
          teamSlug={selectedTeam?.slug}
          status={props.searchParams.status}
          sort={props.searchParams.sort}
          teams={teams}
          showArchived={showArchived}
        />
      </div>
    </AppContainer>
  );
}

async function getTeams(showArchived?: boolean) {
  const teams = await prisma.team.findMany({
    where: showArchived ? {} : { isArchived: false },
    select: {
      id: true,
      name: true,
      slug: true,
      isArchived: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return teams;
}
