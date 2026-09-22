import Disable2FAForm from "@/app/auth/disable-2fa/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = requireSession();
  const userTotp = await prisma.userTOTP.findUnique({
    where: { userId: session.uid },
  });

  // Redirect to /auth/me if user does not have 2FA enabled
  if (!userTotp || !userTotp.isActive) {
    return redirect("/auth/me");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Deshabilitar verificación de dos pasos</CardTitle>
        <CardDescription>
          Introduce el código de verificación de dos pasos para deshabilitar
          esta función.
        </CardDescription>
      </CardHeader>
      <Disable2FAForm />
    </Card>
  );
}
