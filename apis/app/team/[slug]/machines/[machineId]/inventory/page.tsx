import InventoryControls from "@/components/inventory/inventory-controls";
import InventoryDropdown from "@/components/inventory/inventory-dropdown";
import PicklistDropdown from "@/components/inventory/picklist-dropdown";
import PicklistGenerateDialog from "@/components/inventory/picklist-generate-dialog";
import SpiralDropdown from "@/components/inventory/spiral-dropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { getTeamBySlugCached } from "@/loaders/team";
import { ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const [products, spirals, picklist, machine] = await Promise.all([
    prisma.product.findMany({
      where: { teamId: team.id, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
    prisma.machineSpiral.findMany({
      where: { machineId: props.params.machineId, deletedAt: null },
      select: {
        id: true,
        machineCode: true,
        machineMdbCode: true,
        machineMicromarketCode: true,
        currentCount: true,
        maxCapacity: true,
        productId: true,
        product: {
          select: {
            name: true,
            priceCents: true,
            sku: true,
            productImages: {
              where: { deletedAt: null },
              select: { fileUrl: true },
              orderBy: { position: "asc" },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.machinePicklist.findFirst({
      where: {
        machineId: props.params.machineId,
        fulfilledAt: null,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    prisma.machine.findUnique({
      where: { id: props.params.machineId },
      select: { name: true, type: true },
    }),
  ]);

  if (!machine) {
    return notFound();
  }

  // Calculate global inventory and percent
  const [totalCapacity, totalCurrentCount] = spirals.reduce(
    (acc, spiral) => [
      acc[0] + spiral.maxCapacity,
      acc[1] + spiral.currentCount,
    ],
    [0, 0],
  );
  const globalPercent = Math.round((totalCurrentCount * 100) / totalCapacity);

  // If every spiral has a machine code that is a number, sort by machine code
  // as a number, otherwise, sort by machine code as a string
  const sortedSpirals = spirals.every(
    (s) => !isNaN(parseInt(s.machineCode || "")),
  )
    ? spirals.sort(
        (a, b) => parseInt(a.machineCode || "") - parseInt(b.machineCode || ""),
      )
    : spirals.sort((a, b) =>
        (a.machineCode || "").localeCompare(b.machineCode || ""),
      );

  return (
    <Card className="bg-background">
      <CardHeader className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div className="flex flex-col gap-1">
            <CardTitle>Inventario</CardTitle>
            {totalCapacity > 0 && (
              <CardDescription>
                {totalCurrentCount} / {totalCapacity} ({globalPercent}%)
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {picklist ? (
              <PicklistDropdown
                machineName={machine.name}
                picklist={picklist}
              />
            ) : (
              <PicklistGenerateDialog machineType={machine.type} />
            )}
            <InventoryDropdown
              products={products.map((product) => ({
                id: product.id,
                label: `${product.name} (${formatCurrency(
                  product.priceCents,
                )})`,
              }))}
              machineType={machine.type}
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 overflow-x-auto">
        {spirals.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="Sin Inventarios"
              description={
                machine.type === "MICROMARKET"
                  ? "Agrega un producto a tu micromarket"
                  : "Agrega una espiral para utilizar inventarios"
              }
            />
          </div>
        )}
        <div className="divide-y flex flex-col w-max min-w-full">
          {sortedSpirals.map((spiral) => {
            const percent =
              Math.round((spiral.currentCount / spiral.maxCapacity) * 100) || 0;

            const productImage = spiral.product?.productImages?.[0];
            const imageUrl = productImage
              ? getCdnUrl(productImage.fileUrl)
              : undefined;

            return (
              <div
                key={spiral.id}
                className="flex items-center gap-6 py-4 px-4"
              >
                {/* Product Image Thumbnail */}
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={spiral.product?.name || "Product"}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-6 md:gap-12 justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {machine.type === "MICROMARKET" ? (
                          spiral.machineMicromarketCode && (
                            <p className="text-xs text-muted-foreground">
                              MICROMARKET #{spiral.machineMicromarketCode}
                            </p>
                          )
                        ) : (
                          <>
                            {spiral.machineCode && (
                              <p className="text-xs text-muted-foreground">
                                DEX #{spiral.machineCode}
                              </p>
                            )}
                            {spiral.machineMdbCode && (
                              <p className="text-xs text-muted-foreground">
                                MDB #{spiral.machineMdbCode}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <p>{spiral.product?.name || "-"}</p>
                      {spiral.product?.sku && (
                        <p className="text-xs text-muted-foreground font-mono">
                          SKU {spiral.product.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {spiral.product
                        ? formatCurrency(spiral.product.priceCents)
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4 text-sm">
                  <p
                    className={cn("w-10 text-center", {
                      "text-red-500 dark:text-red-400 font-medium":
                        percent <= 25,
                    })}
                  >
                    {percent}%
                  </p>
                  <Progress
                    value={percent}
                    className="w-[30px] md:w-[60px] h-1"
                  />
                  <InventoryControls
                    currentCount={spiral.currentCount}
                    maxCapacity={spiral.maxCapacity}
                    spiralId={spiral.id}
                  />
                </div>
                <div>
                  <SpiralDropdown
                    products={products.map((product) => ({
                      id: product.id,
                      label: product.name,
                    }))}
                    machineType={machine.type}
                    spiral={{
                      id: spiral.id,
                      productId: spiral.productId,
                      machineCode: spiral.machineCode,
                      machineMdbCode: spiral.machineMdbCode,
                      machineMicromarketCode: spiral.machineMicromarketCode,
                      currentCount: spiral.currentCount,
                      maxCapacity: spiral.maxCapacity,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
