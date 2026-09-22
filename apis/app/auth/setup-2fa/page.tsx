import Setup2FAForm from "@/app/auth/setup-2fa/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = requireSession();
  const userTotp = await prisma.userTOTP.findUnique({
    where: { userId: session.uid },
    select: {
      isActive: true,
      secret: true,
      user: { select: { email: true } },
    },
  });

  // Redirect to /auth/me if 2FA is already enabled
  if (userTotp?.isActive) {
    redirect("/auth/me");
  }

  return (
    <>
      <Button className="px-10" asChild>
        <Link href="/">
          <ArrowLeftIcon className="size-4" />
          Regresar
        </Link>
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activar verificación de dos pasos</CardTitle>
        </CardHeader>
        {userTotp && (
          <Setup2FAForm
            totpSecret={userTotp.secret}
            email={userTotp.user!.email}
          />
        )}
      </Card>
    </>
  );
}
