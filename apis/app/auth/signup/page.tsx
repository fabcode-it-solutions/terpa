import SignupForm from "@/app/auth/signup/form";
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

  // if the user is already signed in, redirect them
  if (session) {
    redirect("/auth/me");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Introduce tu email y contraseña para crear una cuenta.
        </CardDescription>
      </CardHeader>
      <SignupForm />
    </Card>
  );
}
