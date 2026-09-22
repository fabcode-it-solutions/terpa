import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * This is the root page of the application. It is used to redirect users to
 * their respective dashboards based on their authentication status, role, and
 * team membership.
 */
export default async function Page() {
  /**
   * Session Data
   * @desc This call will redirect the client to the authentication page if
   * they are not authenticated.
   */
  const session = requireSession();

  /**
   * User Data
   */
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { memberships: { include: { team: true } } },
  });

  // If the user does not exist, redirect them to the signout page
  if (!user) redirect("/auth/signout");

  // Admins are redirected to the admin dashboard
  if (user.role === UserRole.ADMIN) redirect("/admin");

  // Customers are redirected to their team dashboard
  if (user.role === UserRole.CUSTOMER) {
    if (user.memberships.length === 0) {
      return redirect("/team/create");
    }

    if (user.memberships.length === 1) {
      return redirect(`/team/${user.memberships[0].team.slug}`);
    }

    if (user.memberships.length > 1) {
      return redirect("/team/list");
    }
  }

  return null;
}
