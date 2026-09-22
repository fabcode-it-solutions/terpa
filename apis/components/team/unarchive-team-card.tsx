"use client";

import { unarchiveTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransition } from "react";

interface UnarchiveTeamCardProps {
  teamSlug: string;
}

export function UnarchiveTeamCard({ teamSlug }: UnarchiveTeamCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleUnarchiveTeam = () => {
    startTransition(async () => {
      try {
        await unarchiveTeamAction(teamSlug);
      } catch (error) {
        console.error("Error unarchiving team:", error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo Archivado</CardTitle>
      </CardHeader>
      <CardFooter>
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={handleUnarchiveTeam}
          disabled={isPending}
        >
          {isPending ? "Desarchivando..." : "Desarchivar Equipo"}
        </Button>
      </CardFooter>
    </Card>
  );
}
