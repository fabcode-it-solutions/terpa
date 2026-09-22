"use client";

import { machineIncidentResolveAction } from "@/actions/incident";
import { Button } from "@/components/ui/button";
import { machineIncidentResolveSchema } from "@/validation/machine";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  incidentId: string;
};

export default function AdminIncidentResolveForm(props: Props) {
  const form = useForm({
    resolver: zodResolver(machineIncidentResolveSchema),
    values: {
      incidentId: props.incidentId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return machineIncidentResolveAction(values).then((result) => {
      if (result.success) {
        toast.success("Se ha resuelto el incidente.");
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={form.formState.isSubmitting}>
        <Button variant="outline" size="sm" type="submit">
          <CheckIcon className="w-5 h-5 mr-2" />
          Resolver
        </Button>
      </fieldset>
    </form>
  );
}
