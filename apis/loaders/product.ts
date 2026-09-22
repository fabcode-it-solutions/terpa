import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

/**
 * Get a product by id if it belongs to the team.
 */
export async function getTeamProduct(teamId: string, productId: string) {
  // The query itself only filters by id to use the index.
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  // If the product doesn't exist or doesn't belong to the team, return 404.
  if (!product || product.teamId !== teamId) {
    return notFound();
  }

  return product;
}
