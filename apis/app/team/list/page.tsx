import { AppContainer, AppLayout } from "@/components/ui/app-layout";
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
import { requireSession } from "@/lib/session";
import { getTeams } from "@/service/core/teams";
import Link from "next/link";

export default async function Page() {
  const session = requireSession();
  const teams = await getTeams(session.uid);

  return (
    <AppLayout>
      <AppContainer>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Title>Mis Equipos</Title>
            <p className="text-muted-foreground text-sm">
              Selecciona un equipo para ver sus máquinas y productos.
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/team/${team.slug}/dashboard`}>Ver</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppContainer>
    </AppLayout>
  );
}
