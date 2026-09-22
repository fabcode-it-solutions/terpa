"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type Props = {
  showDashboard?: boolean;
};

export default function DashboardTabs({ showDashboard = true }: Props) {
  const params = useParams();
  const pathname = usePathname();
  const parts = pathname.split("/");
  const last = parts[parts.length - 1];

  if (!showDashboard) {
    return (
      <div className="text-center py-8 px-6 mx-auto max-w-md">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Esta sección está disponible solo para ciertos miembros del equipo.
          Mientras tanto, puedes revisar y gestionar las máquinas de tu equipo.
        </p>
        <Button asChild>
          <Link href={`/team/${params.slug}/machines`}>Ver Máquinas</Link>
        </Button>
      </div>
    );
  }

  return (
    <Tabs value={last}>
      <TabsList>
        <TabsTrigger value="dashboard" asChild>
          <Link href={`/team/${params.slug}/dashboard`}>General</Link>
        </TabsTrigger>
        <TabsTrigger value="reports" asChild>
          <Link href={`/team/${params.slug}/dashboard/reports`}>Reportes</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
