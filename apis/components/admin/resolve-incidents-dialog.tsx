"use client";

import { machineIncidentResolveAllAction } from "@/actions/incident";
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
import { CheckCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  machineId?: string;
};

export default function ResolveIncidentsDialog({ machineId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    const response = await machineIncidentResolveAllAction(machineId);
    if (response.success) {
      toast.success(
        machineId
          ? "Incidencias de la máquina resueltas correctamente."
          : "Todas las incidencias resueltas correctamente.",
      );
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <CheckCheckIcon className="w-5 h-5" />
          {machineId
            ? "Resolver Incidencias de Máquina"
            : "Resolver Todas las Incidencias"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {machineId
              ? "Resolver Incidencias de Máquina"
              : "Resolver Todas las Incidencias"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {machineId
              ? "Estás a punto de resolver todas las incidencias de esta máquina. Esta acción no se puede deshacer."
              : "Estás a punto de resolver todas las incidencias. Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
