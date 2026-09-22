import { handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; productId: string }> },
) {
  const { teamId, productId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    const timezone = "America/Monterrey";
    const product = await prisma.product.findFirst({
      where: { id: productId, teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        priceCents: true,
        purchaseCostCents: true,
        createdAt: true,
        productImages: {
          select: { id: true, fileUrl: true },
          where: { deletedAt: null },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: {
          valueCents: product.priceCents,
          valueFormatted: formatCurrency(product.priceCents),
        },
        purchaseCost: product.purchaseCostCents
          ? {
              valueCents: product.purchaseCostCents,
              valueFormatted: formatCurrency(product.purchaseCostCents),
            }
          : null,
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
      },
    });
  });
}
