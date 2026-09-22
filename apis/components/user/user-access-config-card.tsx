"use client";

import { updateTeamMemberShowFinancialsAction } from "@/actions/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { teamMemberShowFinancialsSchema } from "@/validation/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type UserAccessConfigCardProps = {
  userId: string;
  showFinancials: boolean;
};

export default function UserAccessConfigCard({
  userId,
  showFinancials,
}: UserAccessConfigCardProps) {
  const params = useParams();

  const form = useForm<z.infer<typeof teamMemberShowFinancialsSchema>>({
    resolver: zodResolver(teamMemberShowFinancialsSchema),
    defaultValues: {
      userId,
      teamSlug: params.slug as string,
      showFinancials,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await updateTeamMemberShowFinancialsAction(values);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.success) {
        toast.success("Configuración actualizada correctamente");
        form.reset(values); // Reset form with new values to mark as clean
      } else {
        toast.error("Error al actualizar la configuración");
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar la configuración");
      console.error("Error updating show financials:", error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Acceso</CardTitle>
        <CardDescription>
          Controla qué información puede ver este usuario
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="showFinancials"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Mostrar Información Financiera
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Permitir que este usuario pueda ver el dashboard, ventas,
                      reportes
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
              className="w-full"
            >
              {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
