import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/service/authentication";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const uuid = z.string().uuid();

type UserReturnType = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  memberships: {
    teamId: string;
    showFinancials: boolean;
  }[];
};

type TeamReturnType = {
  user: UserReturnType;
  teamId: string;
};

export async function getApiUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return null;
  }

  const session = verifyUserToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.uid,
      deletedAt: null,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      memberships: {
        select: {
          teamId: true,
          showFinancials: true,
        },
      },
    },
  });

  return user;
}

export async function handleUserProtectedRoute(
  req: NextRequest,
  callback: (user: UserReturnType) => Promise<NextResponse> | NextResponse,
) {
  const user = await getApiUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return callback({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    memberships: user.memberships,
  });
}

export async function handleTeamProtectedRoute(
  req: NextRequest,
  { teamId }: { teamId: string },
  callback: (user: TeamReturnType) => Promise<NextResponse> | NextResponse,
) {
  return handleUserProtectedRoute(req, async (user) => {
    const parts = req.nextUrl.pathname.split("/");
    const teamId = uuid.parse(parts[4]);

    const teamInUser = !!user.memberships.find((membership) => {
      return membership.teamId === teamId;
    });

    if (!teamInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return callback({ user, teamId });
  });
}

export function getMachineIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return uuid.parse(parts[6]);
}
