import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";
import { cache } from "react";

/**
 * Get a team by its slug
 * The user must be signed in and be an admin or a member of the team
 * @param slug - The team's slug
 */
export async function getTeamBySlug(slug: string) {
  // User must be signed in
  const session = requireSession();

  // Get a team by slug and include the current user as a member
  const team = await prisma.team.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      pharosMerchantCode: true,
      costPerMachineCents: true,
      onboardingCompleted: true,
      legalEntityType: true,
      totalTerminals: true,
      machineModelBrand: true,
      terminalSerialDigits: true,
      website: true,
      productServiceDescription: true,
      contactNumber: true,
      facturamaId: true,
      isArchived: true,
      businessActivities: {
        select: {
          type: true,
          customName: true,
        },
      },
      members: {
        where: { userId: session.uid },
        select: { role: true, showFinancials: true },
      },
      // Add documents to the selection (excluding soft-deleted documents)
      documents: {
        where: {
          deletedAt: null, // Filter out soft-deleted documents
        },
        select: {
          id: true,
          type: true,
          fileName: true,
          fileSize: true,
          fileType: true,
          fileUrl: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      electronicSignature: true, // Added to fetch the signature
      legalRepresentativeName: true,
    },
  });

  // The user must be an admin or a member of the team to access it
  const isAdmin = session.role === "ADMIN";
  const isMember = team && team.members.length > 0;
  const canAccess = isAdmin || isMember;

  // Return a 404 if the team is not found or the user doesn't have access
  if (!canAccess || !team) {
    return notFound();
  }

  return team;
}

/**
 * Get a team by its slug with react caching
 */
export const getTeamBySlugCached = cache(getTeamBySlug);
