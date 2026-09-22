"use client";

import { terminalUpdateAction } from "@/actions/terminal";
import TerminalForm from "@/components/terminals/terminal-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { terminalUpdateSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  defaultValues: {
    id: string;
    type: string;
    serialNumber: string;
    terminalCode: string;
    merchantCode: string;
    description: string | null;
    initialCredit: number;
    flowType: string;
    language: string;
    acceptCreditPayments: boolean;
    acceptCashPayments: boolean;
    acceptServicePayments: boolean;
    decimalMode: number;
    username: string | null;
    password: string | null;
    endpointUrl: string | null;
    fixedComissionCents: number | string | null;
    percentageCommission: number | string | null;
    nip: string | null;
    key: string | null;
    extra1: string | null;
    extra2: string | null;
  };
  teamName?: string | null;
};

export default function TerminalUpdateCard(props: Props) {
  const form = useForm({
    resolver: zodResolver(terminalUpdateSchema),
    defaultValues: {
      id: props.defaultValues.id,
      type: props.defaultValues.type,
      serialNumber: props.defaultValues.serialNumber ?? "",
      terminalCode: props.defaultValues.terminalCode ?? "",
      merchantCode: props.defaultValues.merchantCode ?? "",
      description: props.defaultValues.description ?? "",
      initialCredit: props.defaultValues.initialCredit ?? 0,
      flowType: props.defaultValues.flowType ?? "",
      language: props.defaultValues.language ?? "",
      acceptCreditPayments: props.defaultValues.acceptCreditPayments ?? false,
      acceptCashPayments: props.defaultValues.acceptCashPayments ?? false,
      acceptServicePayments: props.defaultValues.acceptServicePayments ?? false,
      decimalMode: props.defaultValues.decimalMode ?? 0,
      username: props.defaultValues.username ?? "",
      password: props.defaultValues.password ?? "",
      endpointUrl: props.defaultValues.endpointUrl ?? "",
      fixedComissionCents: props.defaultValues.fixedComissionCents ?? 0,
      percentageCommission: props.defaultValues.percentageCommission ?? 0,
      nip: props.defaultValues.nip ?? "",
      key: props.defaultValues.key ?? "",
      extra1: props.defaultValues.extra1 ?? "",
      extra2: props.defaultValues.extra2 ?? "",
      repeat: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return terminalUpdateAction(values).then((result) => {
      if (result.success) {
        toast.success("Terminal actualizada exitosamente.");
      } else {
        toast.error("Error al actualizar la terminal.");
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting}>
          <Card className="bg-background">
            <CardContent className="md:p-6 p-4">
              <TerminalForm isEdit teamName={props.teamName} />
            </CardContent>
          </Card>
        </fieldset>
      </form>
    </Form>
  );
}
