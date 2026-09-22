import SalesByDay from "@/components/dashboard/sales-by-day";
import TopMachinesList from "@/components/dashboard/top-machines-list";
import TopProductsList from "@/components/dashboard/top-products-list";
import TeamSalesExportDialog from "@/components/team/team-sales-export-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { requireSession } from "@/lib/session";
import {
  cn,
  formatNumber,
  getMachineOnlineStatus,
  pluralize,
} from "@/lib/utils";
import {
  getMachinesBySales,
  getProductsBySales,
  getSalesByDay,
} from "@/loaders/dashboard";
import { getTeamBySlugCached } from "@/loaders/team";
import { PaymentMethod, TeamMemberRole, UserRole } from "@prisma/client";
import { add } from "date-fns";

type Props = {
  params: {
    slug: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);

  const teamRole = team.members[0]?.role;

  const userMachines = await prisma.userMachine.findMany({
    where: { userId: session.uid },
    select: { machineId: true },
  });

  const machines = await prisma.machine.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      activeUntilDate: { gte: new Date() },
      // Only show machines that the user is assigned to when they are an operator
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    },
    select: {
      id: true,
      lastPingAt: true,
    },
  });

  const maxDate = new Date();
  const minDate = add(maxDate, { days: -30 });
  const machineIds = machines.map((m) => m.id);

  const sales = await getSalesByDay({
    teamId: team.id,
    minDate: minDate,
    maxDate: maxDate,
    machineIds: machineIds,
  });

  const machinesBySales = await getMachinesBySales(
    team.id,
    minDate,
    maxDate,
    machineIds,
  );
  const productsBySales = await getProductsBySales(
    team.id,
    minDate,
    maxDate,
    machineIds,
  );

  // Get product images for the top selling products
  const productImages = await prisma.product.findMany({
    where: {
      id: { in: productsBySales.map((p) => p.id) },
      deletedAt: null,
    },
    select: {
      id: true,
      productImages: {
        where: { deletedAt: null },
        select: { fileUrl: true },
        orderBy: { position: "asc" },
        take: 1,
      },
    },
  });

  // Create a map for quick lookup of product images
  const productImageMap = new Map(
    productImages.map((p) => [p.id, p.productImages[0]?.fileUrl]),
  );

  // Combine products with their image URLs for TopProductsList
  const productsWithImages = productsBySales.map((product) => {
    const imageKey = productImageMap.get(product.id);
    return {
      ...product,
      imageUrl: imageKey ? getCdnUrl(imageKey) : undefined,
    };
  });

  const cardSales = await prisma.sale.aggregate({
    _sum: { machineProductCost: true },
    _count: { id: true },
    where: {
      paymentMethod: PaymentMethod.CARD,
      machine: { teamId: team.id, id: { in: machineIds } },
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  const cashSales = await prisma.sale.aggregate({
    _sum: { machineProductCost: true },
    _count: { id: true },
    where: {
      paymentMethod: PaymentMethod.CASH,
      machine: { teamId: team.id, id: { in: machineIds } },
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  const freeSales = await prisma.sale.aggregate({
    _sum: { machineProductCost: true },
    _count: { id: true },
    where: {
      paymentMethod: PaymentMethod.FREE,
      machine: { teamId: team.id, id: { in: machineIds } },
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  const remoteSales = await prisma.sale.aggregate({
    _sum: { machineProductCost: true },
    _count: { id: true },
    where: {
      paymentMethod: PaymentMethod.REMOTE,
      machine: { teamId: team.id, id: { in: machineIds } },
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  const totalSales =
    (cardSales._sum.machineProductCost ?? 0) +
    (cashSales._sum.machineProductCost ?? 0) +
    (freeSales._sum.machineProductCost ?? 0) +
    (remoteSales._sum.machineProductCost ?? 0);
  const totalCount =
    cardSales._count.id +
    cashSales._count.id +
    freeSales._count.id +
    remoteSales._count.id;

  const counts = machines.reduce(
    (acc, machine) => {
      if (machine.lastPingAt) {
        const status = getMachineOnlineStatus(machine.lastPingAt);
        if (status === "online") return { ...acc, online: acc.online + 1 };
        if (status === "warning") return { ...acc, warning: acc.warning + 1 };
        if (status === "offline" || status === "noData")
          return { ...acc, offline: acc.offline + 1 };
      }

      return acc;
    },
    { online: 0, warning: 0, offline: 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Card className="min-h-[150px]">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2 p-4">
              <h3 className="text-lg font-medium">Ventas últimos 30 días</h3>
            </div>
            <div className="p-4">
              <TeamSalesExportDialog />
            </div>
          </div>
          <div className="py-6 border-t border-b">
            <div className="flex md:flex-row flex-col justify-around md:gap-2 gap-8">
              <div className="flex flex-col gap-1 flex-1 text-center">
                <p className="text-muted-foreground text-sm">
                  {formatNumber(totalCount)}{" "}
                  {pluralize(totalCount, "venta", "ventas")} totales
                </p>
                <p className="text-xl font-medium">
                  {formatCurrency(totalSales)}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cardSales._count.id)}{" "}
                    {pluralize(cardSales._count.id, "venta", "ventas")} en
                    tarjeta
                  </p>
                </div>
                <p className="space-x-2">
                  <span className="text-xl font-medium">
                    {formatCurrency(
                      cardSales._sum.machineProductCost ?? 0,
                    )}{" "}
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cashSales._count.id)}{" "}
                    {pluralize(cashSales._count.id, "venta", "ventas")} en
                    efectivo
                  </p>
                </div>
                <p className="space-x-2">
                  <span className="text-xl font-medium">
                    {formatCurrency(cashSales._sum.machineProductCost ?? 0)}
                  </span>
                </p>
              </div>
              {freeSales._count.id > 0 && (
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <p className="text-muted-foreground text-sm">
                      {formatNumber(freeSales._count.id)}{" "}
                      {pluralize(freeSales._count.id, "venta", "ventas")} gratis
                    </p>
                  </div>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(freeSales._sum.machineProductCost ?? 0)}
                    </span>
                  </p>
                </div>
              )}
              {remoteSales._count.id > 0 && (
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-muted-foreground text-sm">
                      {formatNumber(remoteSales._count.id)}{" "}
                      {pluralize(remoteSales._count.id, "venta", "ventas")}{" "}
                      remotas
                    </p>
                  </div>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(remoteSales._sum.machineProductCost ?? 0)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="pt-6">
            <SalesByDay data={sales} />
          </div>
        </Card>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-md">Maquinas Totales</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {formatNumber(machines.length)}{" "}
              {pluralize(machines.length, "máquina", "máquinas")}
            </CardContent>
          </Card>
          <Card className="w-full gap-4">
            <CardHeader>
              <CardTitle className="text-md">Sin Conexión</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <span
                className={cn(
                  "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                  "border-red-300 bg-red-600 dark:border-red-900",
                )}
              />
              <p className="text-muted-foreground">
                {formatNumber(counts.offline)}{" "}
                {pluralize(counts.offline, "máquina", "máquinas")}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-1 gap-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-md">Intermitentes</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <span
                className={cn(
                  "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                  "border-yellow-300 bg-yellow-500 dark:border-yellow-700",
                )}
              />
              <p className="text-muted-foreground">
                {formatNumber(counts.warning)}{" "}
                {pluralize(counts.warning, "máquina", "máquinas")}
              </p>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-md">En Línea</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <span
                className={cn(
                  "animate-pulse w-3 h-3 border-4 block rounded-full shadow",
                  "border-emerald-300 bg-emerald-600 dark:border-emerald-900",
                )}
              />
              <p className="text-muted-foreground">
                {formatNumber(counts.online)}{" "}
                {pluralize(counts.online, "máquina", "máquinas")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Máquinas Con Más Ventas</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <Separator />
          <div className="min-h-[400px] divide-y">
            <TopMachinesList machines={machinesBySales} teamSlug={team.slug} />
          </div>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <Separator />
          <div className="min-h-[400px] divide-y">
            <TopProductsList
              products={productsWithImages}
              teamSlug={team.slug}
              teamRole={teamRole}
              userRole={session.role}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
