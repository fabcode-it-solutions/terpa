"use client";

import { terminalCreateAction } from "@/actions/terminal";
import TerminalForm from "@/components/terminals/terminal-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { terminalCreateSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {};

export default function TerminalCreateCard(props: Props) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(terminalCreateSchema),
    defaultValues: {
      type: "VENDING",
      serialNumber: "",
      terminalCode: "",
      merchantCode: "",
      description: "",
      username: "",
      password: "",
      endpointUrl: "",
      fixedComissionCents: "0",
      percentageCommission: "0",
      extra1: "",
      extra2: "",
      initialCredit: "0",
      flowType: "A",
      language: "ES",
      acceptCreditPayments: true,
      acceptCashPayments: true,
      acceptServicePayments: false,
      decimalMode: "1",
      nip: "",
      key: "",
      repeat: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return terminalCreateAction(values).then((result) => {
      if (result.success) {
        toast.success("Terminal creada exitosamente.");
        if (values.repeat) {
          form.reset();
        } else {
          // Ensure result.id is passed if that's the structure
          if (result.id) {
            // Check if id exists on result, as it's conditional
            router.push(`/admin/terminals/${result.id}`);
          } else {
            // This case should ideally not happen if success is true and id is expected
            toast.error("Error: No se pudo redirigir a la terminal creada.");
            form.reset(); // Reset form as a fallback
          }
        }
      } else {
        // Handle specific error types from the action
        if (result.errorType === "DUPLICATE_SERIAL_NUMBER") {
          toast.error(result.message || "El número de serie ya está en uso.");
        } else if (result.errorType === "AUTH_ERROR") {
          toast.error(
            result.message || "No tienes permisos para realizar esta acción.",
          );
        } else if (result.message) {
          // Generic message from action if errorType is not specific or not present
          toast.error(result.message);
        } else {
          // Fallback for truly unexpected errors or old error structures
          toast.error("Error al crear la terminal.");
        }
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting}>
          <Card className="bg-background">
            <CardContent className="md:p-6 p-4">
              <TerminalForm />
            </CardContent>
          </Card>
        </fieldset>
      </form>
    </Form>
  );
}
