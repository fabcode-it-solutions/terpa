"use client";

import { updateUserProfileAction } from "@/actions/user";
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
import { userProfileSchema } from "@/validation/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProfileFormProps {
  user: User & { totp?: { isActive: boolean } | null };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(userProfileSchema),
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
      const result = await updateUserProfileAction(values);
      if (result.success) {
        toast.success("Perfil actualizado correctamente.");
      } else {
        toast.error(result.error || "Error al actualizar el perfil.");
      }
    } catch (error) {
      toast.error("Error al actualizar el perfil.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tu nombre" />
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
                  <Input {...field} placeholder="Tu apellido" />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormDescription>
                A esta dirección se enviarán las notificaciones y los mensajes
                relacionados con tu cuenta.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Teléfono (10 dígitos)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej. 5512345678" maxLength={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
