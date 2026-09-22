import { AppContainer, AppLayout } from "@/components/ui/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Title } from "@/components/ui/typography";
import { ProfileForm } from "@/components/user/profile-form";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function Page() {
  const session = requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { totp: true },
  });

  if (!user) {
    return redirect("/auth/signout");
  }

  return (
    <AppLayout>
      <AppContainer>
        <Title>Perfil</Title>
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal y de contacto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verificación de 2 pasos</CardTitle>
            <CardDescription>
              Protege tu cuenta con una capa adicional de seguridad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.totp?.isActive ? (
              <Link
                href="/auth/disable-2fa"
                className="flex items-center gap-4"
              >
                <Switch checked />
                <Label>Activado</Label>
              </Link>
            ) : (
              <Link href="/auth/setup-2fa" className="flex items-center gap-4">
                <Switch checked={false} />
                <Label>Desactivado</Label>
              </Link>
            )}
          </CardContent>
        </Card>
      </AppContainer>
    </AppLayout>
  );
}
