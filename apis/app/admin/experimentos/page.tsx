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
import { getAllExperiments } from "@/service/experiment";
import { ChevronRight, Globe, Users } from "lucide-react";
import Link from "next/link";

export default async function ExperimentosPage() {
  const { experiments, error } = await getAllExperiments();

  if (error) {
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
            <BreadcrumbPage>Experimentos</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <Title>Experimentos</Title>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Error al cargar experimentos: {error}
            </p>
          </CardContent>
        </Card>
      </AppContainer>
    );
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
          <BreadcrumbPage>Experimentos</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <Title>Experimentos</Title>
      </div>

      {experiments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No hay experimentos configurados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {experiments.map((experiment) => (
            <Card
              key={experiment.key}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{experiment.key}</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/experimentos/${experiment.key}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={experiment.isActive ? "default" : "secondary"}
                  >
                    {experiment.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  {experiment.isGlobal && (
                    <Badge variant="outline">Global</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {experiment.isGlobal ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  <span>
                    {experiment.isGlobal
                      ? "Global"
                      : `${experiment.experimentTeams.length} equipo${experiment.experimentTeams.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    Creado:{" "}
                    {new Date(experiment.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppContainer>
  );
}
