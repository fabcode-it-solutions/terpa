"use client";

import { setup2FAAction } from "@/app/auth/setup-2fa/action";
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
import { authOptSchema } from "@/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  totpSecret: string;
  email: string;
};

export default function Setup2FAForm(props: Props) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const form = useForm({
    resolver: zodResolver(authOptSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await setup2FAAction(values);
    if (!result.success) {
      form.setError("otp", { message: result.message });
      return;
    }

    setSuccess(true);
    toast("Haz activado la verificación de dos pasos.");
    router.push("/profile");
  });

  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(
    `Next Starter (${props.email})`,
  )}?secret=${props.totpSecret}`;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting || success}>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm">
              Escanea el siguiente código QR con tu aplicación de autenticación
              preferida e introduce el código de 6 dígitos generado.
            </p>
            <div className="bg-white p-3">
              <QRCodeSVG value={qrCodeUrl} className="w-full h-full" />
            </div>
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
            <Button type="submit" className="w-full">
              Activar verificación de dos pasos
            </Button>
          </CardFooter>
        </fieldset>
      </form>
    </Form>
  );
}
