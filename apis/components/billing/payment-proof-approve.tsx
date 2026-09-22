"use client";

import { approvePaymentAction } from "@/actions/billing";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { currencyFromZero } from "@/validation/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { ManualPaymentMethod } from "@prisma/client";
import { Check, DollarSignIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const paymentApproveSchema = z.object({
  adjustedAmountCents: currencyFromZero,
  manualPaymentMethod: z
    .nativeEnum(ManualPaymentMethod)
    .default(ManualPaymentMethod.BANK_TRANSFER),
});

type PaymentApproveFormValues = z.infer<typeof paymentApproveSchema>;

type Props = {
  teamSlug: string;
  invoiceId: string;
  totalPriceCents: number;
  exchangeRate: number;
};

export function PaymentProofApprove({
  teamSlug,
  invoiceId,
  totalPriceCents,
  exchangeRate,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const exchangeRateCents = Math.round(exchangeRate * 100);
  const value = formatCurrency(
    Math.round((totalPriceCents * exchangeRateCents) / 100),
  ).replace("$", "");

  const form = useForm({
    resolver: zodResolver(paymentApproveSchema),
    defaultValues: {
      adjustedAmountCents: value,
      manualPaymentMethod: ManualPaymentMethod.BANK_TRANSFER,
    },
  });

  const handleApprovePayment = form.handleSubmit(async (values) => {
    try {
      const result = await approvePaymentAction({
        teamSlug,
        invoiceId,
        adjustedAmountCents: values.adjustedAmountCents,
        manualPaymentMethod: values.manualPaymentMethod,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(
        "El pago ha sido aprobado y las máquinas han sido activadas.",
      );
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al aprobar el pago",
      );
    }
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm">
          <Check className="h-4 w-4 mr-2" />
          Aprobar Pago
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form {...form}>
          <form onSubmit={handleApprovePayment}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Aprobar el comprobante de pago?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción validará el pago y activará las máquinas hasta la
                fecha indicada en la factura. Puede ajustar el monto final
                aprobado si es necesario (ej. por redondeo o acuerdo). El monto
                original es {formatCurrency(totalPriceCents)}. Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="adjustedAmountCents"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Monto Aprobado Final (MXN)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="adjustedAmountInput"
                            {...field}
                            className="pl-6"
                          />
                        </FormControl>
                        <DollarSignIcon className="size-4 top-3 left-2 text-muted-foreground absolute" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="manualPaymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago Manual</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ManualPaymentMethod.BANK_TRANSFER}>
                          Transferencia Bancaria
                        </SelectItem>
                        <SelectItem value={ManualPaymentMethod.CASH}>
                          Efectivo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction type="submit">Aprobar Pago</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
