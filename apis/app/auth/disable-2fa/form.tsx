"use client";

import { disable2faAction } from "@/app/auth/disable-2fa/action";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { authOptSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function Disable2FAForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(authOptSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await disable2faAction(values);
    if (!result.success) {
      form.setError("otp", { message: result.message });
      return;
    }

    toast("Haz deshabilitado la verificación de dos pasos.");
    setSuccess(true);
    router.push("/profile");
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting || success}>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificación</FormLabel>
                  <FormControl>
                    <InputOTP autoFocus maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Introduce el código de verificación generado por tu
                    aplicación de autenticación.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button variant="destructive" type="submit" className="w-full">
              Deshabilitar la verificación de Dos Pasos
            </Button>
            <Separator />
            <Button type="button" variant="link" asChild>
              <Link href="/profile">
                Seguir utilizando la verificación de dos pasos
              </Link>
            </Button>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  );
}
