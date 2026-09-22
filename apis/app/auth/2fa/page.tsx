import OTPForm from "@/app/auth/2fa/form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default function Page() {
  const session = getSession("totp");

  // If the user does not have a totp session, redirect them
  if (!session) {
    redirect("/");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Two Factor Verification</CardTitle>
      </CardHeader>
      <OTPForm />
    </Card>
  );
}
