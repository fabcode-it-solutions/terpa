import SearchBox from "@/components/search-box";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Title } from "@/components/ui/typography";
import { UserRoleLabel } from "@/components/user/user-role-label";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    query?: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  const members = await prisma.teamMember.findMany({
    where: {
      teamId: team.id,
      // Filter by email when search query is defined
      ...(props.searchParams.query
        ? {
            user: {
              email: {
                contains: props.searchParams.query,
                mode: "insensitive",
              },
            },
          }
        : {}),
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

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
              <Link href={`/team/${props.params.slug}/users`}>Usuarios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>Usuarios</Title>
        <Button size="sm" asChild>
          <Link href={`/team/${props.params.slug}/users/create`}>
            <PlusIcon className="w-4 h-4" />
            Agregar Usuario
          </Link>
        </Button>
      </div>

      <div>
        <SearchBox placeholder="Buscar por correo..." />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            return (
              <TableRow key={member.user.id}>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <UserRoleLabel role={member.role} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="outline" asChild className="rounded-md">
                      <Link
                        href={`/team/${props.params.slug}/users/${member.user.id}`}
                      >
                        Ver
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AppContainer>
  );
}
