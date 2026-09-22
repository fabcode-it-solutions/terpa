import SearchBox from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
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
      // Filter by email or name when search query is defined
      ...(props.searchParams.query
        ? {
            OR: [
              {
                user: {
                  email: {
                    contains: props.searchParams.query,
                    mode: "insensitive",
                  },
                },
              },
              {
                user: {
                  firstName: {
                    contains: props.searchParams.query,
                    mode: "insensitive",
                  },
                },
              },
              {
                user: {
                  lastName: {
                    contains: props.searchParams.query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      user: {
        createdAt: "desc",
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <SearchBox placeholder="Buscar por nombre o correo..." />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Fecha de registro</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const fullName = [member.user.firstName, member.user.lastName]
              .filter(Boolean)
              .join(" ");

            return (
              <TableRow key={member.user.id}>
                <TableCell>{fullName || "Sin nombre"}</TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  {member.role === "OWNER" ? "Propietario" : "Operador"}
                </TableCell>
                <TableCell>
                  {member.user.createdAt.toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="outline" asChild className="rounded-md">
                      <Link
                        href={`/admin/teams/${props.params.slug}/manage/users/${member.user.id}`}
                      >
                        Editar
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {props.searchParams.query
              ? "No se encontraron usuarios con esa búsqueda"
              : "No hay usuarios en este equipo"}
          </p>
        </div>
      )}
    </div>
  );
}
