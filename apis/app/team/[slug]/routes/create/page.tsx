import RouteCreateCard from "@/components/route/route-create-card";
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
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
};

export default async function CreateRoutePage({ params }: Props) {
  const team = await getTeamBySlugCached(params.slug);

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${params.slug}`}>{team.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${params.slug}/routes`}>Rutas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/team/${params.slug}/routes/create`}>
                Agregar Ruta
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <Title>Agregar Ruta</Title>
      </div>
      <RouteCreateCard />
    </AppContainer>
  );
}
