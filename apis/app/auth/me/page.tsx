import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { totp: true },
  });

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="text-center space-y-6">
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <p>2FA: {user?.totp?.isActive ? "Yes" : "No"}</p>
      <div className="flex gap-4 justify-center">
        {user?.totp?.isActive ? (
          <Button asChild>
            <Link href="/auth/disable-2fa">Disable 2FA</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/auth/setup-2fa">Set Up 2FA</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/auth/signout">Sign Out</Link>
        </Button>
      </div>
    </div>
  );
}
