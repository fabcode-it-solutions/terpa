import SignInForm from "@/app/auth/signin/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default function Page() {
  const session = getSession();

  // If the user is already signed in, redirect them
  if (session) {
    redirect("/auth/me");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Introduce tus credenciales para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>
      <SignInForm />
    </Card>
  );
}
