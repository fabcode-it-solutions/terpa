"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type AdminTeam = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  teams: Array<AdminTeam>;
};

export function TeamFilter({ teams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const teamId = searchParams.get("teamId") ?? "";

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams);
    if (id === teamId) {
      params.delete("teamId");
    } else {
      params.set("teamId", id);
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const selectedTeam = teams.find((t) => t.id === teamId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-auto md:min-w-[200px] justify-between"
          size="sm"
        >
          {selectedTeam ? selectedTeam.name : "Todos los equipos"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar equipo..." />
          <CommandList>
            <CommandEmpty>No hay equipos.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => handleSelect("")} value="">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    teamId === "" ? "opacity-100" : "opacity-0",
                  )}
                />
                Todos los equipos
              </CommandItem>
              {teams?.length === 0 ? (
                <CommandItem value="no-teams">No hay equipos</CommandItem>
              ) : null}
              {teams?.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name.replace(/\W/g, "")}
                  onSelect={() => handleSelect(team.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      teamId === team.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {team.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
