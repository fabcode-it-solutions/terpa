"use client";

import { rejectPaymentAction } from "@/actions/billing";
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
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
  invoiceId: string;
};

export function PaymentProofReject({ teamSlug, invoiceId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleReject = useCallback(async () => {
    try {
      const result = await rejectPaymentAction({
        teamSlug,
        invoiceId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(
        "El pago ha sido rechazado. El equipo deberá contactar a soporte para más información.",
      );
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al rechazar el pago",
      );
    }
  }, [teamSlug, invoiceId, router]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="h-4 w-4 mr-2" />
          Rechazar Pago
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Rechazar el comprobante de pago?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción notificará al equipo que su comprobante de pago ha sido
            rechazado. Deberán contactar a soporte para más información.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReject}>
            Rechazar Pago
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
