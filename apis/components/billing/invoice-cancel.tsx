"use client";

import { cancelInvoiceAction } from "@/actions/billing";
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
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
  invoiceId: string;
};

export function InvoiceCancel({ teamSlug, invoiceId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleCancel = useCallback(async () => {
    try {
      const result = await cancelInvoiceAction({
        teamSlug,
        invoiceId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("El pago ha sido cancelado.");
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cancelar el pago",
      );
    }
  }, [teamSlug, invoiceId, router]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban className="h-4 w-4 mr-2" />
          Cancelar Pago
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar el pago?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cancelará el pago y no podrá ser revertido. El equipo
            tendrá que crear un nuevo pago si desea continuar con el proceso.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            Sí, Cancelar Pago
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
