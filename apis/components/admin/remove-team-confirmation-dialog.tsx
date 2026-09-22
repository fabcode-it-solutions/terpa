"use client";

import { removeTeamFromExperimentAction } from "@/actions/experiment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  experimentKey: string;
  teamId: string;
  teamName: string;
  children: React.ReactNode;
};

export function RemoveTeamConfirmationDialog({
  experimentKey,
  teamId,
  teamName,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await removeTeamFromExperimentAction(
        experimentKey,
        teamId,
      );
      if (result.success) {
        toast.success("Equipo removido del experimento");
        setOpen(false);
      } else {
        toast.error(result.error || "Error al remover equipo");
      }
    } catch (error) {
      toast.error("Error al remover equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remover Equipo del Experimento</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas remover <strong>{teamName}</strong> de este
            experimento? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover Equipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
