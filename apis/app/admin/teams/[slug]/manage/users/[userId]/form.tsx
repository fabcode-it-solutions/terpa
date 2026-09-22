"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminUserUpdateSchema } from "@/validation/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateUserFromAdmin } from "./actions";

type Props = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
  teamSlug: string;
};

type FormData = z.infer<typeof adminUserUpdateSchema>;

export default function AdminUserEditForm({ user, teamSlug }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(adminUserUpdateSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserFromAdmin(user.id, values, teamSlug);

      if (result.success) {
        toast.success("Usuario actualizado correctamente");
      } else {
        toast.error(result.error || "Error al actualizar el usuario");
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar el usuario");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Ingresa el nombre"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Ingresa el apellido"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="usuario@ejemplo.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="5512345678"
                    maxLength={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
