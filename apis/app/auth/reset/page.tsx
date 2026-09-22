import ResetPasswordForm from "@/app/auth/reset/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Props = {
  searchParams: { token: string };
};

export default async function Page(props: Props) {
  const tokenId = props.searchParams.token;
  const token = await prisma.passwordResetToken.findUnique({
    where: { id: tokenId, expiresAt: { gt: new Date() }, usedAt: null },
    select: { id: true, user: { select: { email: true } } },
  });

  // If the token is valid, show the reset password form
  if (token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reestablecer Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para reestablecerla.
          </CardDescription>
        </CardHeader>
        <ResetPasswordForm email={token.user.email} token={token.id} />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>El link ha expirado</CardTitle>
        <CardDescription>
          El link para recuperar la contraseña ha expirado. Por favor solicita
          uno nuevo.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/auth/forgot">Solicitar nuevo link</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
