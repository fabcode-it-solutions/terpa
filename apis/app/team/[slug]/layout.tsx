import { AppLayout } from "@/components/ui/app-layout";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const team = await prisma.team.findUnique({
    where: { slug: props.params.slug },
    select: { name: true, slug: true },
  });

  if (!team) {
    return notFound();
  }

  return {
    title: {
      default: team.name,
      template: `%s | ${team.name}`,
    },
  };
}

export default async function Layout(props: Props) {
  const session = requireSession();

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { role: true },
  });

  if (!user) {
    return redirect("/auth/me/signout");
  }

  // Get team by slug
  const team = await getTeamBySlugCached(props.params.slug);

  // Ensure the user is a member of the team or an admin
  const canAccess = team.members.length > 0 || user.role === UserRole.ADMIN;
  if (!canAccess) {
    return redirect("/");
  }

  if (!team.onboardingCompleted && user.role === UserRole.CUSTOMER) {
    return redirect(`/team/create/${props.params.slug}`);
  }

  const navigation = [
    {
      label: "Dashboard",
      href: `/team/${props.params.slug}/dashboard`,
    },
    {
      label: "Máquinas",
      href: `/team/${props.params.slug}/machines`,
    },
    {
      label: "Productos",
      href: `/team/${props.params.slug}/products`,
    },
  ];

  // Navigation items for team owners and platform admins
  if (
    team.members.some((member) => member.role === TeamMemberRole.OWNER) ||
    session.role === "ADMIN"
  ) {
    navigation.push({
      label: "Usuarios",
      href: `/team/${props.params.slug}/users`,
    });
    navigation.push({
      label: "Facturación",
      href: `/team/${props.params.slug}/billing`,
    });
  }

  return (
    <AppLayout
      navigation={navigation}
      teamName={team.name}
      merchantCode={team.pharosMerchantCode}
      isAdmin={session.role === "ADMIN"}
    >
      {props.children}
    </AppLayout>
  );
}
