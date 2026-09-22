"use client";

import {
  addTeamToExperimentAction,
  getAllTeamsAction,
} from "@/actions/experiment";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Team = {
  id: string;
  name: string;
  slug: string;
  machineCount: number;
};

type Props = {
  experimentKey: string;
  children: React.ReactNode;
  assignedTeamIds?: string[];
};

export function AddTeamToExperimentDialog({
  experimentKey,
  children,
  assignedTeamIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch available teams using React Query
  const {
    data: teams = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["available-teams", experimentKey, assignedTeamIds],
    queryFn: async () => {
      const result = await getAllTeamsAction();
      if (result.success) {
        // Filter out teams that are already assigned to this experiment
        return result.teams.filter(
          (team) => !assignedTeamIds.includes(team.id),
        );
      } else {
        throw new Error(result.error || "Error al cargar equipos");
      }
    },
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle query errors
  if (error && open) {
    toast.error("Error al cargar equipos");
  }

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      toast.error("Selecciona un equipo");
      return;
    }

    setSubmitting(true);
    try {
      const result = await addTeamToExperimentAction(
        experimentKey,
        selectedTeamId,
      );
      if (result.success) {
        toast.success("Equipo agregado al experimento");
        setOpen(false);
        setSelectedTeamId("");
      } else {
        toast.error(result.error || "Error al agregar equipo");
      }
    } catch (error) {
      toast.error("Error al agregar equipo");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Equipo al Experimento</DialogTitle>
          <DialogDescription>
            Selecciona un equipo para darle acceso a este experimento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full justify-between"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando equipos...
                  </>
                ) : selectedTeam ? (
                  selectedTeam.name
                ) : (
                  "Seleccionar equipo..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar equipo..." />
                <CommandList>
                  <CommandEmpty>No se encontraron equipos.</CommandEmpty>
                  <CommandGroup>
                    {teams.map((team) => (
                      <CommandItem
                        key={team.id}
                        value={team.name}
                        onSelect={() => {
                          setSelectedTeamId(
                            team.id === selectedTeamId ? "" : team.id,
                          );
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTeamId === team.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {team.machineCount} máquina
                            {team.machineCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTeamId || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agregar Equipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
