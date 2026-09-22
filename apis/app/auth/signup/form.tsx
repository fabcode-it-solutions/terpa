"use client";

import { signUpAction } from "@/app/auth/signup/action";
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
import { authSignUpSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function SignupForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(authSignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signUpAction(values);
    if (result?.error) {
      form.setError("email", { message: result.reason });
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
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
                "Crear Cuenta"
              )}
            </Button>
            <Separator />
            <Button type="button" variant="link" asChild>
              <Link href="/auth/signin">Ya tengo una cuenta</Link>
            </Button>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  );
}
