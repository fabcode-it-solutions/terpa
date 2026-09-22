import SearchBox from "@/components/search-box";
import { TeamFilter } from "@/components/admin/team-filter";
import AdminTerminalsTable from "@/components/terminals/admin-terminals-table";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { DownloadIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  searchParams: {
    query?: string;
    page?: string;
    teamId?: string;
  };
};

export default async function Page(props: Props) {
  const page = props.searchParams.page ? parseInt(props.searchParams.page) : 1;

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
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
          <BreadcrumbPage>Terminales</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>Terminales</Title>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link
              href={`/admin/terminals/export?${new URLSearchParams({
                ...(props.searchParams.query && {
                  query: props.searchParams.query,
                }),
                ...(props.searchParams.teamId && {
                  teamId: props.searchParams.teamId,
                }),
              }).toString()}`}
            >
              <DownloadIcon className="w-4 h-4" />
              Exportar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/terminals/create">
              <PlusIcon className="w-4 h-4" />
              Crear Terminal
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchBox />
        <TeamFilter teams={teams} />
      </div>

      <AdminTerminalsTable
        query={props.searchParams.query}
        page={page}
        teamId={props.searchParams.teamId}
      />
    </AppContainer>
  );
}
