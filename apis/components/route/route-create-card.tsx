"use client";

import { routeCreateAction } from "@/actions/route";
import RouteForm from "@/components/route/route-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { routeCreateSchema } from "@/validation/route";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function RouteCreateCard() {
  const params = useParams();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: {
      teamSlug: params.slug,
      name: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    return routeCreateAction(values)
      .then((result) => {
        if (result?.error) return toast.error(result.error);
        toast.success("Ruta creada exitosamente.");
        if (result?.route?.id) {
          router.push(`/team/${params.slug}/routes/${result.route.id}`);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al crear la ruta. Intenta más tarde.");
      });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <RouteForm />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
