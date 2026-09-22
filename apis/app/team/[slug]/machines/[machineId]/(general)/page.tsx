import MachineInformationDropdown from "@/components/machine/machine-information-dropdown";
import PresenceLabel from "@/components/machine/machine-presence-label";
import MachineSalesByDay from "@/components/machine/machine-sales-by-day";
import MachineTopProductsList from "@/components/machine/machine-top-products-list";
import RecentSalesList from "@/components/machine/recent-sales-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { requireSession } from "@/lib/session";
// import { getTeamMachineCached } from "@/loaders/machine"; // Removed
import { getTeamBySlugCached } from "@/loaders/team";
import { TeamMemberRole, UserRole } from "@prisma/client";
import {
  add,
  endOfDay,
  format,
  formatDistanceToNow,
  startOfDay,
  subDays,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import {
  BinaryIcon, // Added
  CalendarIcon,
  ChevronRightIcon,
  CircleDotIcon,
  Lock,
  MemoryStickIcon,
  PcCaseIcon,
  SmartphoneNfcIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation"; // Added

type Props = {
  params: {
    slug: string;
    machineId: string;
  };
};

export default async function Page(props: Props) {
  const session = requireSession();
  const team = await getTeamBySlugCached(props.params.slug);
  const teamRole = team.members[0]?.role;

  // Check if user has financial access
  const showFinancials =
    session.role === UserRole.ADMIN ||
    teamRole === TeamMemberRole.OWNER ||
    team.members[0]?.showFinancials === true;

  // const machine = await getTeamMachineCached(team.id, props.params.machineId); // Replaced below

  const machine = await prisma.machine.findUnique({
    where: {
      id: props.params.machineId,
      teamId: team.id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      teamId: true,
      machineModel: true,
      machineVersion: true,
      machineSerial: true,
      terminalSerialNumber: true,
      activeUntilDate: true,
      lastPingAt: true,
      tubesTotal: true,
      remoteSaleEnabledUntil: true,
      versionCode: true, // Added versionCode
      type: true, // Add machine type for conditional rendering
      // Ensure all other fields used by the page are here
      // For example, fields needed for MachineInformationDropdown if it uses machine prop directly
      // and any other direct usages on this page.
      // Based on current page content, these seem to be the main ones.
      // If MachineInformationDropdown or other components need more, they should be added.
      // For now, assuming `remoteSaleEnabledUntil` is sufficient for MachineInformationDropdown.
      protocol: true, // Example: if needed by a component
      isEnabled: true, // Example: if needed
    },
  });

  if (!machine) {
    notFound();
  }

  const now = new Date();
  const timezone = "America/Monterrey";
  const zoned = toZonedTime(now, timezone);
  const gte = fromZonedTime(startOfDay(zoned), timezone);
  const lte = fromZonedTime(endOfDay(zoned), timezone);

  // Always fetch non-financial data
  const spirals = await prisma.machineSpiral.aggregate({
    where: { machineId: machine.id, deletedAt: null },
    _sum: { currentCount: true, maxCapacity: true },
  });

  // Conditionally fetch financial data based on permissions
  const [sales, latestSales, productsBySales, salesByDay] = showFinancials
    ? await Promise.all([
        prisma.sale.aggregate({
          where: { machineId: machine.id, createdAt: { gte, lte } },
          _sum: { machineProductCost: true },
        }),
        prisma.sale.findMany({
          select: {
            id: true,
            machineProductCost: true,
            machineProductId: true,
            machineMdbProductId: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                productImages: {
                  where: { deletedAt: null },
                  select: { fileUrl: true },
                  orderBy: { position: "asc" },
                  take: 1,
                },
              },
            },
          },
          where: { machineId: machine.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        getProductsBySales(machine.id),
        getSalesByDay(machine.id),
      ])
    : [{ _sum: { machineProductCost: null } }, [], [], []];

  // Transform latestSales to include CDN URLs for product images
  const latestSalesWithCdnUrls = latestSales.map((sale) => ({
    ...sale,
    product: sale.product
      ? {
          ...sale.product,
          productImages: sale.product.productImages.map((image) => ({
            ...image,
            fileUrl: getCdnUrl(image.fileUrl),
          })),
        }
      : null,
  }));

  const percent =
    spirals?._sum?.currentCount && spirals?._sum?.maxCapacity
      ? Math.round((spirals._sum.currentCount / spirals._sum.maxCapacity) * 100)
      : 0;

  const isRemoteSaleEnabled =
    machine.remoteSaleEnabledUntil &&
    new Date() < machine.remoteSaleEnabledUntil;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Comunicación</CardTitle>
                <Button size="icon" variant="ghost" asChild>
                  <Link href={`/team/${team.slug}/machines/${machine.id}/dex`}>
                    <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                <PresenceLabel lastPresence={machine.lastPingAt} />
                {machine.lastPingAt && (
                  <p className="text-xs text-muted-foreground">
                    Hace{" "}
                    {formatDistanceToNow(machine.lastPingAt, {
                      locale: es,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Inventario</CardTitle>
                <Button size="icon" variant="ghost" asChild>
                  <Link
                    href={`/team/${team.slug}/machines/${machine.id}/inventory`}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl text-muted-foreground">{percent}%</p>
                <Progress value={percent} className="w-[120px] h-1" />
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Ventas Hoy</CardTitle>
                <Button size="icon" variant="ghost" asChild>
                  <Link
                    href={`/team/${team.slug}/machines/${machine.id}/sales`}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {showFinancials ? (
                  <p className="text-xl text-muted-foreground">
                    {formatCurrency(sales._sum.machineProductCost || 0)}
                  </p>
                ) : (
                  <div className="flex justify-center">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
            {machine.type !== "MICROMARKET" && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Cambio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-muted-foreground">
                    {formatCurrency(machine.tubesTotal || 0)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="flex flex-1">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Información</CardTitle>
              <MachineInformationDropdown
                remoteSaleEnabledUntil={machine.remoteSaleEnabledUntil}
              />
            </CardHeader>
            <CardContent>
              <div className="divide-y text-sm">
                {machine.type !== "MICROMARKET" && (
                  <div className="flex items-center gap-4 py-2">
                    <PcCaseIcon className="w-4 h-4 text-muted-foreground" />
                    <p>{machine.machineModel}</p>
                    <p className="text-right flex-1 text-muted-foreground">
                      Modelo
                    </p>
                  </div>
                )}
                {machine.type !== "MICROMARKET" && (
                  <div className="flex items-center gap-4 py-2">
                    <CircleDotIcon className="w-4 h-4 text-muted-foreground" />
                    <p>{machine.machineVersion}</p>
                    <p className="text-right flex-1 text-muted-foreground">
                      Versión
                    </p>
                  </div>
                )}
                {machine.type !== "MICROMARKET" && (
                  <div className="flex items-center gap-4 py-2">
                    <MemoryStickIcon className="w-4 h-4 text-muted-foreground" />
                    <p>{machine.machineSerial}</p>
                    <p className="text-right flex-1 text-muted-foreground">
                      Controlador
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-4 py-2">
                  <SmartphoneNfcIcon className="w-4 h-4 text-muted-foreground" />
                  <p>{machine.terminalSerialNumber}</p>
                  <p className="text-right flex-1 text-muted-foreground">
                    Terminal
                  </p>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <BinaryIcon className="w-4 h-4 text-muted-foreground" />
                  <p>{machine.versionCode || ""}</p>
                  <p className="text-right flex-1 text-muted-foreground">
                    Versión APK
                  </p>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <p>
                    {formatInTimeZone(machine.activeUntilDate, "UTC", "PPP", {
                      locale: es,
                    })}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/50"
                    asChild
                  >
                    <Link href={`/team/${team.slug}/billing/invoice/new`}>
                      Renovar
                    </Link>
                  </Button>
                  <p className="text-right flex-1 text-muted-foreground">
                    Vigencia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center space-y-0">
          <div>
            <CardTitle>Ventas por Día</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </div>
          <Button size="icon" variant="ghost" asChild>
            <Link href={`/team/${team.slug}/machines/${machine.id}/sales`}>
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <MachineSalesByDay
            data={salesByDay}
            machineId={machine.id}
            showFinancials={showFinancials}
          />
        </CardContent>
      </Card>
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="flex-row items-center space-y-0 justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg">Ventas Recientes</CardTitle>
              <CardDescription>
                Últimas {latestSales.length} ventas
              </CardDescription>
            </div>
            <div>
              <Button size="icon" variant="outline" asChild>
                <Link href={`/team/${team.slug}/machines/${machine.id}/sales`}>
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <div className="min-h-[400px] divide-y">
            <RecentSalesList
              sales={latestSalesWithCdnUrls}
              showFinancials={showFinancials}
            />
          </div>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <Separator />
          <div className="min-h-[400px] divide-y">
            <MachineTopProductsList
              products={productsBySales}
              teamSlug={team.slug}
              showFinancials={showFinancials}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

async function getSalesByDay(machineId: string) {
  const timezone = "America/Monterrey";
  const now = new Date();
  const today = toZonedTime(now, timezone);
  const startDate = subDays(today, 29); // Last 30 days including today

  // Convert zoned dates back to UTC for database query
  const todayUtc = fromZonedTime(today, timezone);
  const startDateUtc = fromZonedTime(startDate, timezone);

  const result = await prisma.$queryRaw`
    SELECT
      DATE(s."createdAt" AT TIME ZONE 'America/Monterrey') as date,
      s."paymentMethod",
      SUM(s."machineProductCost") / 100 as total
    FROM
      sales s
    WHERE
      s."machineId" = ${machineId}
      AND s."createdAt" >= ${startDateUtc}
      AND s."createdAt" <= ${todayUtc}
    GROUP BY
      DATE(s."createdAt" AT TIME ZONE 'America/Monterrey'),
      s."paymentMethod"
    ORDER BY
      date ASC;
  `;

  // Create days object with all dates in range, initialized to 0 for each payment method
  const days: Record<
    string,
    { card: number; cash: number; free: number; remote: number }
  > = {};
  let currentDate = startDate;
  while (currentDate <= today) {
    const dateStr = format(currentDate, "dd/MM/yyyy");
    days[dateStr] = { card: 0, cash: 0, free: 0, remote: 0 };
    currentDate = add(currentDate, { days: 1 });
  }

  // Fill in actual sales data
  (
    result as Array<{ date: Date; paymentMethod: string; total: number }>
  ).forEach((item) => {
    const dateStr = format(new Date(item.date), "dd/MM/yyyy");
    const amount = Number(item.total);

    switch (item.paymentMethod) {
      case "CARD":
        days[dateStr].card += amount;
        break;
      case "CASH":
        days[dateStr].cash += amount;
        break;
      case "FREE":
        days[dateStr].free += amount;
        break;
      case "REMOTE":
        days[dateStr].remote += amount;
        break;
    }
  });

  // Convert to array format
  const daysArray = Object.entries(days).map(([date, breakdown]) => ({
    date,
    ...breakdown,
  }));

  return daysArray;
}

async function getProductsBySales(machineId: string) {
  const maxDate = new Date();
  const minDate = add(maxDate, { days: -30 });

  const result = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      COUNT(s.id) AS sales_count,
      SUM(s."machineProductCost") AS total_sales_value
    FROM
      products p
    JOIN
      sales s ON p.id = s."productId"
    JOIN
      machines m ON s."machineId" = m.id
    WHERE
      m.id = ${machineId}
      AND s."createdAt" >= ${minDate}
      AND s."createdAt" <= ${maxDate}
    GROUP BY
      p.id
    ORDER BY
      sales_count DESC
    LIMIT 50;
  `;

  const products = result as Array<{
    id: string;
    name: string;
    sales_count: number;
    total_sales_value: number;
  }>;

  // Fetch product images for all products in a single query
  const productIds = products.map((p) => p.id);
  const productImages = await prisma.productImage.findMany({
    where: {
      productId: { in: productIds },
      deletedAt: null,
    },
    select: {
      productId: true,
      fileUrl: true,
    },
    distinct: ["productId"],
    orderBy: { position: "asc" },
  });

  // Create a map for O(1) lookup
  const imageMap = new Map(
    productImages.map((img) => [img.productId, getCdnUrl(img.fileUrl)]),
  );

  // Map products with their images
  const productsWithImages = products.map((product) => ({
    ...product,
    imageUrl: imageMap.get(product.id) || null,
  }));

  return productsWithImages;
}
