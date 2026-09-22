import { handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    const timezone = "America/Monterrey";
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") ?? undefined;
    const products = await prisma.product.findMany({
      where: {
        teamId: teamId,
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { sku: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        priceCents: true,
        createdAt: true,
        productImages: {
          select: { id: true, fileUrl: true },
          take: 1,
          orderBy: { position: "asc" },
          where: { deletedAt: null },
        },
      },
    });

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: {
          valueCents: product.priceCents,
          valueFormatted: formatCurrency(product.priceCents),
        },
        images: product.productImages.map((image) => ({
          id: image.id,
          url: getCdnUrl(image.fileUrl),
        })),
        createdAt: product.createdAt,
        createdAtFormatted: formatInTimeZone(
          product.createdAt,
          timezone,
          "dd/MM/yyyy hh:mm:ss a",
        ),
      })),
    });
  });
}
