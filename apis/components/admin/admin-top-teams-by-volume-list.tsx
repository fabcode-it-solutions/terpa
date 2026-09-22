"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Team = {
  id: string;
  name: string;
  slug: string;
  total_sales_value: number;
};

type Props = {
  teams: Team[];
};

export default function AdminTopTeamsByVolumeList({ teams }: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayedTeams = showAll ? teams : teams.slice(0, 10);

  return (
    <>
      {displayedTeams.map((team) => (
        <div key={team.id} className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-4 pl-2">
            <div>
              <p className="text-sm">{team.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(team.total_sales_value)}
              </p>
            </div>
          </div>
          <Button size="icon" variant="outline" asChild>
            <Link href={`/team/${team.slug}`}>
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      ))}
      {teams.length > 10 && (
        <div className="p-3 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll
              ? "Ver menos"
              : `Ver ${teams.length - 10} más ${teams.length - 10 === 1 ? "equipo" : "equipos"}`}
          </Button>
        </div>
      )}
    </>
  );
}
