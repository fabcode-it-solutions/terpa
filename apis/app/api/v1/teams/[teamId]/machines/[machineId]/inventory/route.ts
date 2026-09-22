import { getMachineIdFromUrl, handleTeamProtectedRoute } from "@/helpers/api";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; machineId: string }> },
) {
  const { teamId } = await params;
  return handleTeamProtectedRoute(req, { teamId }, async ({ teamId }) => {
    const machineId = getMachineIdFromUrl(req);

    const machine = await prisma.machine.findUnique({
      where: { id: machineId, teamId },
      select: { id: true },
    });

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const [products, spirals, picklist, machineMeta] = await Promise.all([
      prisma.product.findMany({
        where: { teamId, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, priceCents: true },
      }),
      prisma.machineSpiral.findMany({
        where: { machineId: machine.id, deletedAt: null },
        select: {
          id: true,
          machineCode: true,
          machineMdbCode: true,
          machineMicromarketCode: true,
          currentCount: true,
          maxCapacity: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceCents: true,
              productImages: {
                select: { id: true, fileUrl: true },
                take: 1,
                orderBy: { position: "asc" },
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { machineCode: "asc" },
      }),
      prisma.machinePicklist.findFirst({
        where: { machineId: machine.id, fulfilledAt: null, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true },
      }),
      prisma.machine.findUnique({
        where: { id: machine.id },
        select: { name: true, type: true },
      }),
    ]);

    const [totalCapacity, totalCurrentCount] = spirals.reduce(
      (acc, spiral) => [
        acc[0] + spiral.maxCapacity,
        acc[1] + spiral.currentCount,
      ],
      [0, 0],
    );
    const globalPercent =
      totalCapacity > 0
        ? Math.round((totalCurrentCount * 100) / totalCapacity)
        : 0;

    return NextResponse.json({
      machine: machineMeta,
      picklist: picklist
        ? { id: picklist.id, createdAt: picklist.createdAt }
        : null,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: {
          valueCents: p.priceCents,
          valueFormatted: formatCurrency(p.priceCents),
        },
      })),
      summary: {
        totalCapacity,
        totalCurrentCount,
        globalPercent,
        formattedSummary: `${totalCurrentCount} / ${totalCapacity} (${globalPercent}%)`,
      },
      inventory: spirals.map((s) => {
        const percent =
          s.maxCapacity > 0
            ? Math.round((s.currentCount * 100) / s.maxCapacity)
            : 0;
        const status =
          percent >= 75 ? "high" : percent >= 25 ? "medium" : "low";

        return {
          id: s.id,
          machineCode: s.machineCode,
          machineMdbCode: s.machineMdbCode,
          machineMicromarketCode: s.machineMicromarketCode,
          currentCount: s.currentCount,
          maxCapacity: s.maxCapacity,
          percent,
          status,
          formattedCapacity: `${s.currentCount} / ${s.maxCapacity}`,
          product: s.product
            ? {
                id: s.product.id,
                name: s.product.name,
                sku: s.product.sku,
                price: {
                  valueCents: s.product.priceCents,
                  valueFormatted: formatCurrency(s.product.priceCents),
                },
                images: s.product.productImages.map((img) => ({
                  id: img.id,
                  url: getCdnUrl(img.fileUrl),
                })),
              }
            : null,
        };
      }),
    });
  });
}
