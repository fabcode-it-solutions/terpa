import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getRequestTeam() {
  const headersList = headers();

  const authorization = headersList.get("authorization");
  if (!authorization) return null;

  const [_, token] = authorization.split(" ");
  if (!token) return null;

  const apiKey = await prisma.apiKeys.findUnique({
    where: { value: token, isActive: true },
    select: { id: true, teamId: true },
  });

  if (!apiKey) return null;

  return {
    id: apiKey.teamId,
  };
}
