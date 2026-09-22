import { AppLayout } from "@/components/ui/app-layout";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function Layout(props: { children: React.ReactNode }) {
  const session = requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { role: true },
  });

  if (!user) {
    return redirect("/auth/me/signout");
  }

  const isAdmin = user?.role === UserRole.ADMIN;

  // Only allow admins to access the admin panel.
  if (!isAdmin) {
    return redirect("/");
  }

  const navigation = [
    {
      label: "Dashboard",
      href: `/admin/dashboard`,
    },
    {
      label: "Equipos",
      href: `/admin/teams`,
    },
    {
      label: "Máquinas",
      href: "/admin/machines",
    },
    {
      label: "Terminales",
      href: "/admin/terminals",
    },
    {
      label: "Facturación",
      href: "/admin/invoices",
    },
  ];

  const additionalMenuItems = [
    {
      label: "Incidencias",
      href: "/admin/incidents",
    },
    {
      label: "Experimentos",
      href: "/admin/experimentos",
    },
  ];

  return (
    <AppLayout
      teamName="Admin"
      isAdmin={isAdmin}
      navigation={navigation}
      additionalMenuItems={additionalMenuItems}
    >
      {props.children}
    </AppLayout>
  );
}
