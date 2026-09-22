"use client";

import { toggleExperimentStatusAction } from "@/actions/experiment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  experimentKey: string;
  isActive: boolean;
  experimentName: string;
};

export function ExperimentStatusToggle({
  experimentKey,
  isActive,
  experimentName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleExperimentStatusAction(
        experimentKey,
        !isActive,
      );
      if (result.success) {
        toast.success(
          isActive
            ? "Experimento desactivado correctamente"
            : "Experimento activado correctamente",
        );
        setOpen(false);
      } else {
        toast.error(
          result.error || "Error al cambiar el estado del experimento",
        );
      }
    } catch (error) {
      toast.error("Error al cambiar el estado del experimento");
    } finally {
      setLoading(false);
    }
  };

  const actionText = isActive ? "desactivar" : "activar";
  const ActionIcon = isActive ? Pause : Play;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={isActive ? "destructive" : "default"}
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ActionIcon className="h-4 w-4 mr-2" />
          )}
          {isActive ? "Desactivar" : "Activar"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Desactivar" : "Activar"} Experimento
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                ¿Estás seguro que deseas <strong>desactivar</strong> el
                experimento <strong>{experimentName}</strong>?
                <br />
                <br />
                Los equipos ya no tendrán acceso a este experimento hasta que lo
                vuelvas a activar.
              </>
            ) : (
              <>
                ¿Estás seguro que deseas <strong>activar</strong> el experimento{" "}
                <strong>{experimentName}</strong>?
                <br />
                <br />
                {/* Add note about global vs team-specific access */}
                Los equipos configurados tendrán acceso inmediatamente a este
                experimento.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isActive ? "Desactivar" : "Activar"} Experimento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
