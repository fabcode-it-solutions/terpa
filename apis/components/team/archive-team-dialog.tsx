"use client";

import { archiveTeamAction } from "@/actions/team";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransition } from "react";

interface ArchiveTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  teamSlug: string;
}

export default function ArchiveTeamDialog(props: ArchiveTeamDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleArchiveTeam = () => {
    startTransition(async () => {
      try {
        await archiveTeamAction(props.teamSlug);
        props.onOpenChange(false);
      } catch (error) {
        console.error("Error archiving team:", error);
        // You might want to show a toast notification here
      }
    });
  };

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Seguro que quieres archivar {props.teamName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Este equipo se ocultará de la plataforma. Puedes deshacer esto más
            adelante.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveTeam}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Archivando..." : "Archivar Equipo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
