import RouteTabs from "@/components/route/route-tabs";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Title } from "@/components/ui/typography";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
    id: string;
  };
  children: React.ReactNode;
};

export default async function Layout({ params, children }: Props) {
  const team = await getTeamBySlugCached(params.slug);
  const route = await prisma.route.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!route) {
    // Handle case where route is not found
    return <div>Route not found</div>;
  }

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
              <Link href={`/team/${params.slug}/routes/${route.id}`}>
                {route.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Title>{route.name}</Title>
      <RouteTabs />
      <div>{children}</div>
    </AppContainer>
  );
}
