"use client";

import { teamMemberCreateAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamMemberCreateSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
};

export default function UserCreateForm({ teamSlug }: Props) {
  const router = useRouter();
  const params = useParams();
  const form = useForm({
    resolver: zodResolver(teamMemberCreateSchema),
    defaultValues: {
      teamSlug: params.slug,
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await teamMemberCreateAction(values);
    if (result.success) {
      router.push(`/team/${teamSlug}/users/${result.userId}`);
      toast.success("Usuario agregado exitosamente");
    } else {
      toast.error("Error al agregar usuario");
    }
  });

  return (
    <Form {...form}>
      <Card>
        <CardContent className="p-4">
          <form className="space-y-8" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Agregar Usuario</Button>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
