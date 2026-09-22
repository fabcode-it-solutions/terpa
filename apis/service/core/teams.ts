import { prisma } from "@/lib/prisma";

export async function getTeams(userId: string) {
  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return teams;
}
