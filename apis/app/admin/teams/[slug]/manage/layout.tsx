import ManageTabs from "@/components/team/manage-tabs";
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
import { getTeamBySlugCached } from "@/loaders/team";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

export default async function ManageLayout({ children, params }: Props) {
  const team = await getTeamBySlugCached(params.slug);

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
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/teams`}>Equipos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{team.name}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Title>Administrar Equipo</Title>
      </div>

      <ManageTabs />

      <div>{children}</div>
    </AppContainer>
  );
}
