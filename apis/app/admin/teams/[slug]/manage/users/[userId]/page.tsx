import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { getTeamBySlugCached } from "@/loaders/team";
import { notFound } from "next/navigation";
import AdminUserEditForm from "./form";

type Props = {
  params: {
    slug: string;
    userId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);

  const user = await prisma.user.findUnique({
    where: {
      id: props.params.userId,
      memberships: { some: { teamId: team.id } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      createdAt: true,
      memberships: {
        where: { teamId: team.id },
        select: { role: true },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const userRole = user.memberships[0]?.role;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Usuario</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="mb-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Rol en el equipo:{" "}
              <span className="font-medium">
                {userRole === "OWNER" ? "Propietario" : "Operador"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Fecha de registro:{" "}
              {user.createdAt.toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <AdminUserEditForm
            user={{
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber,
            }}
            teamSlug={props.params.slug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
