"use client";

import { resetPasswordAction } from "@/app/auth/reset/action";
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
import { authResetPasswordSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  email: string;
  token: string;
};

export default function ResetPasswordForm(props: Props) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(authResetPasswordSchema),
    defaultValues: {
      token: props.token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await resetPasswordAction(values);
    if (!result.success) {
      form.setError("password", { message: result.message });
      return;
    }

    setSuccess(true);
    toast("Tu contraseña ha sido reestablecida.");
    router.push(result.requiresTotp ? "/auth/2fa" : "/");
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting || success}>
          <CardContent className="flex flex-col gap-4">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input type="email" disabled value={props.email} />
            </FormItem>
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
              Reestablecer Contraseña
            </Button>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  );
}
