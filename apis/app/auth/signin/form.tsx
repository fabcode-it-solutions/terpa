"use client";

import { signInAction } from "@/app/auth/signin/action";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
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
import { authSignInSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function SignInForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(authSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signInAction(values);
    if (result?.error) {
      form.setError("email", { message: result.reason });
      form.setError("password", { message: result.reason });
      return;
    }

    setSuccess(true);
  });

  return (
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
                    <Input autoFocus {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full">
              {form.formState.isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
            <Separator />
            <div className="flex justify-between w-full">
              <Button type="button" variant="link" asChild className="p-0">
                <Link href="/auth/signup">Crear Cuenta</Link>
              </Button>
              <Button type="button" variant="link" asChild className="p-0">
                <Link href="/auth/forgot">Recuperar Contraseña</Link>
              </Button>
            </div>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  );
}
