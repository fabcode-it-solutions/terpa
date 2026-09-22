"use client";

import { Button } from "@/components/ui/button";
import PresenceIndicator from "@/components/machine/machine-presence-indicator";
import { formatCurrency } from "@/lib/currency";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Machine = {
  id: string;
  name: string;
  total_sales_value: number;
  lastPingAt: Date;
};

type Props = {
  machines: Machine[];
  teamSlug: string;
};

export default function TopMachinesList({ machines, teamSlug }: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayedMachines = showAll ? machines : machines.slice(0, 10);

  return (
    <>
      {displayedMachines.map((machine) => (
        <div key={machine.id} className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-4 pl-2">
            <PresenceIndicator lastPresence={machine.lastPingAt} />
            <div>
              <p className="text-sm">{machine.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(Number(machine.total_sales_value))}
              </p>
            </div>
          </div>
          <Button size="icon" variant="outline" asChild>
            <Link href={`/team/${teamSlug}/machines/${machine.id}`}>
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      ))}
      {machines.length > 10 && (
        <div className="p-3 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll
              ? "Ver menos"
              : `Ver ${machines.length - 10} más ${machines.length - 10 === 1 ? "máquina" : "máquinas"}`}
          </Button>
        </div>
      )}
    </>
  );
}
