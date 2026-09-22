import { AddTeamToExperimentDialog } from "@/components/admin/add-team-to-experiment-dialog";
import { ExperimentGlobalToggle } from "@/components/admin/experiment-global-toggle";
import { ExperimentStatusToggle } from "@/components/admin/experiment-status-toggle";
import { RemoveTeamConfirmationDialog } from "@/components/admin/remove-team-confirmation-dialog";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Title } from "@/components/ui/typography";
import { getExperiment } from "@/service/experiment";
import { Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: {
    key: string;
  };
};

export default async function ExperimentDetailPage({ params }: Props) {
  const { experiment, error } = await getExperiment(params.key);

  if (error || !experiment) {
    notFound();
  }

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/experimentos">Experimentos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{experiment.key}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>{experiment.key}</Title>
      </div>

      <div className="space-y-6">
        {/* Experiment Details */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant={experiment.isActive ? "default" : "secondary"}>
                  {experiment.isActive ? "Activo" : "Inactivo"}
                </Badge>
                {experiment.isGlobal && <Badge variant="outline">Global</Badge>}
              </div>
              <div className="flex gap-2">
                <ExperimentGlobalToggle
                  experimentKey={experiment.key}
                  isGlobal={experiment.isGlobal}
                  experimentName={experiment.key}
                  hasTeamAssignments={experiment.experimentTeams.length > 0}
                />
                <ExperimentStatusToggle
                  experimentKey={experiment.key}
                  isActive={experiment.isActive}
                  experimentName={experiment.key}
                />
              </div>
            </div>

            <div className="space-y-2">
              {!experiment.isGlobal && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Equipos asignados:</span>
                  <span>{experiment.experimentTeams.length}</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Creado:</span>{" "}
                {new Date(experiment.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Última actualización:</span>{" "}
                {new Date(experiment.updatedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Management - Only show for non-global experiments */}
        {!experiment.isGlobal && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Equipos Asignados</CardTitle>
                  <CardDescription>
                    Gestiona qué equipos tienen acceso a este experimento
                  </CardDescription>
                </div>
                <AddTeamToExperimentDialog
                  experimentKey={experiment.key}
                  assignedTeamIds={experiment.experimentTeams.map(
                    (et) => et.team.id,
                  )}
                >
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipo
                  </Button>
                </AddTeamToExperimentDialog>
              </div>
            </CardHeader>
            <CardContent>
              {experiment.experimentTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Sin equipos asignados</p>
                  <p className="text-sm">
                    Agrega equipos para que puedan acceder a este experimento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {experiment.experimentTeams.map((experimentTeam) => (
                    <div
                      key={experimentTeam.teamId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {experimentTeam.team.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {experimentTeam.team._count.machines} máquina
                            {experimentTeam.team._count.machines !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RemoveTeamConfirmationDialog
                          experimentKey={experiment.key}
                          teamId={experimentTeam.team.id}
                          teamName={experimentTeam.team.name}
                        >
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RemoveTeamConfirmationDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppContainer>
  );
}
