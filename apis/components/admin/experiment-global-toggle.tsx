"use client";

import { toggleExperimentGlobalStatusAction } from "@/actions/experiment";
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
import { Globe, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  experimentKey: string;
  isGlobal: boolean;
  experimentName: string;
  hasTeamAssignments: boolean;
};

export function ExperimentGlobalToggle({
  experimentKey,
  isGlobal,
  experimentName,
  hasTeamAssignments,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleExperimentGlobalStatusAction(
        experimentKey,
        !isGlobal,
      );
      if (result.success) {
        toast.success(
          isGlobal
            ? "Experimento cambiado a asignación por equipos"
            : "Experimento cambiado a global",
        );
        setOpen(false);
      } else {
        toast.error(
          result.error || "Error al cambiar el alcance del experimento",
        );
      }
    } catch (error) {
      toast.error("Error al cambiar el alcance del experimento");
    } finally {
      setLoading(false);
    }
  };

  const actionText = isGlobal ? "específico" : "global";
  const ActionIcon = isGlobal ? Users : Globe;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ActionIcon className="h-4 w-4 mr-2" />
          )}
          {isGlobal ? "Asignar Por Equipo" : "Hacer Global"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Cambiar Experimento a{" "}
            {isGlobal ? "Asignación Por Equipo" : "Global"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isGlobal ? (
              <>
                ¿Estás seguro que deseas cambiar el experimento{" "}
                <strong>{experimentName}</strong> a{" "}
                <strong>asignación por equipos</strong>?
                <br />
                <br />
                El experimento ya no estará disponible para todos los equipos.
                Deberás asignar equipos manualmente para que tengan acceso.
              </>
            ) : (
              <>
                ¿Estás seguro que deseas cambiar el experimento{" "}
                <strong>{experimentName}</strong> a <strong>global</strong>?
                <br />
                <br />
                {hasTeamAssignments && (
                  <>
                    <span className="font-medium text-amber-600">
                      Advertencia:
                    </span>{" "}
                    Se eliminarán todas las asignaciones de equipos existentes.{" "}
                    <br />
                    <br />
                  </>
                )}
                El experimento estará disponible automáticamente para todos los
                equipos de la plataforma.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar a {isGlobal ? "Por Equipos" : "Global"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
