"use client";

import { forgotPasswordAction } from "@/app/auth/forgot/action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authForgotPasswordSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Page() {
  const [success, setSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(authForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await forgotPasswordAction(values);

    if (result.success) {
      setSuccess(true);
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar Contraseña</CardTitle>
        <CardDescription>
          Escribe tu email para recibir un enlace de recuperación.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <fieldset disabled={form.formState.isSubmitting || success}>
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              {success ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">¡Revisa tu correo!</h3>
                  <p className="text-sm">
                    Si el email proporcionado está asociado a una cuenta,
                    recibirás un enlace de recuperación.
                  </p>
                  <Separator />
                </div>
              ) : (
                <Button type="submit" className="w-full">
                  Solicitar Recuperación
                </Button>
              )}
              <Button type="button" variant="link" asChild>
                <Link href="/auth/signin">Recordé mi contraseña</Link>
              </Button>
            </CardFooter>
          </fieldset>
        </form>
      </Form>
    </Card>
  );
}
