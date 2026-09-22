import { MachineFilter } from "@/components/admin/machine-filter";
import ReportsDateRangePicker from "@/components/dashboard/reports-date-range-picker";
import SalesByDay from "@/components/dashboard/sales-by-day";
import TopMachinesList from "@/components/dashboard/top-machines-list";
import TopProductsList from "@/components/dashboard/top-products-list";
import TeamSalesExportDialog from "@/components/team/team-sales-export-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { requireSession } from "@/lib/session";
import { formatNumber, pluralize } from "@/lib/utils";
import {
  getMachinesBySales,
  getProductsBySales,
  getSalesByDay,
} from "@/loaders/dashboard";
import { getTeamBySlugCached } from "@/loaders/team";
import { PaymentMethod, TeamMemberRole } from "@prisma/client";
import {
  add,
  differenceInDays,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

type Props = {
  params: {
    slug: string;
  };
  searchParams: {
    from: string | undefined;
    to: string | undefined;
    machine: string | undefined;
  };
};

export default async function Page(props: Props) {
  const team = await getTeamBySlugCached(props.params.slug);
  const timezone = "America/Monterrey";
  const date = {
    from: props.searchParams.from
      ? fromZonedTime(new Date(props.searchParams.from), timezone)
      : fromZonedTime(
          startOfMonth(startOfDay(toZonedTime(new Date(), timezone))),
          timezone,
        ),
    to: props.searchParams.to
      ? fromZonedTime(new Date(props.searchParams.to), timezone)
      : fromZonedTime(
          startOfMonth(add(toZonedTime(new Date(), timezone), { months: 1 })),
          timezone,
        ),
  };

  const session = requireSession();
  const teamRole = team.members[0]?.role;

  const dateRangeDays = differenceInDays(date.to, date.from);
  const isDateRangeTooLong = dateRangeDays > 95;

  const userMachines = await prisma.userMachine.findMany({
    where: { userId: session.uid },
    select: { machineId: true },
  });

  const machines = await prisma.machine.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
      // Only show machines that the user is assigned to when they are a customer or operator
      ...(teamRole === TeamMemberRole.OPERATOR
        ? { id: { in: userMachines.map((um) => um.machineId) } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      lastPingAt: true,
    },
  });

  // Parse machine ID from search params (single select)
  const selectedMachineId = props.searchParams.machine;

  // Filter machines based on selection - if no specific machine selected, use all machines
  const filteredMachineIds = selectedMachineId
    ? [selectedMachineId]
    : machines.map((m) => m.id);

  // Only fetch expensive data if date range is within limits
  let sales: Array<{
    date: string;
    card: number;
    cash: number;
    free: number;
    remote: number;
  }> = [];
  let machinesBySales: Array<{
    id: string;
    name: string;
    total_sales_value: number;
    lastPingAt: Date;
  }> = [];
  let productsBySales: Array<{
    id: string;
    name: string;
    sales_count: number;
    total_sales_value: number;
    image_url: string | null;
  }> = [];
  let cardSales = {
    _sum: { machineProductCost: 0 as number | null },
    _count: { id: 0 },
  };
  let cashSales = {
    _sum: { machineProductCost: 0 as number | null },
    _count: { id: 0 },
  };
  let totalSales = 0;
  let totalCount = 0;

  if (!isDateRangeTooLong) {
    sales = await getSalesByDay({
      teamId: team.id,
      minDate: date.from,
      maxDate: date.to,
      machineIds: filteredMachineIds,
    });
    machinesBySales = await getMachinesBySales(
      team.id,
      date.from,
      date.to,
      filteredMachineIds,
    );
    productsBySales = await getProductsBySales(
      team.id,
      date.from,
      date.to,
      filteredMachineIds,
    );

    cardSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.CARD,
        machine: { teamId: team.id, id: { in: filteredMachineIds } },
        createdAt: {
          gte: date.from,
          lt: date.to,
        },
      },
    });

    cashSales = await prisma.sale.aggregate({
      _sum: { machineProductCost: true },
      _count: { id: true },
      where: {
        paymentMethod: PaymentMethod.CASH,
        machine: { teamId: team.id, id: { in: filteredMachineIds } },
        createdAt: {
          gte: date.from,
          lt: date.to,
        },
      },
    });

    totalSales =
      (cardSales._sum.machineProductCost ?? 0) +
      (cashSales._sum.machineProductCost ?? 0);
    totalCount = cardSales._count.id + cashSales._count.id;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <MachineFilter
            machines={machines.map((m) => ({
              id: m.id,
              name: m.name || `Máquina ${m.id.substring(0, 8)}`,
              lastPingAt: m.lastPingAt,
            }))}
            multiSelect={false}
            paramName="machine"
            className="w-full sm:w-[300px]"
          />
          <ReportsDateRangePicker
            timezone={timezone}
            from={date.from}
            to={date.to}
          />
        </div>
        <TeamSalesExportDialog machineIds={filteredMachineIds} />
      </div>
      {isDateRangeTooLong && (
        <Alert variant="destructive">
          <AlertTitle>Rango de fechas demasiado amplio</AlertTitle>
          <AlertDescription>
            El rango de fechas seleccionado es demasiado amplio (más de 95
            días). Por favor, selecciona un rango más corto para obtener mejores
            resultados.
          </AlertDescription>
        </Alert>
      )}
      {!isDateRangeTooLong && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ventas por día</CardTitle>
              <CardDescription>
                Del{" "}
                {format(
                  toZonedTime(date.from, timezone),
                  "EEEE do 'de' MMMM 'del' y",
                  {
                    locale: es,
                  },
                )}{" "}
                al{" "}
                {format(
                  toZonedTime(date.to, timezone),
                  "EEEE do 'de' MMMM 'del' y",
                  {
                    locale: es,
                  },
                )}
              </CardDescription>
            </CardHeader>
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
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cardSales._count.id)}{" "}
                    {pluralize(cardSales._count.id, "venta", "ventas")} en
                    tarjeta
                  </p>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(
                        cardSales._sum.machineProductCost ?? 0,
                      )}{" "}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cashSales._count.id)}{" "}
                    {pluralize(cashSales._count.id, "venta", "ventas")} en
                    efectivo
                  </p>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(cashSales._sum.machineProductCost ?? 0)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="pb-0 pt-4">
              <SalesByDay data={sales} />
            </CardContent>
          </Card>
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">
                  Máquinas Con Más Ventas
                </CardTitle>
                <CardDescription>
                  {`${format(
                    toZonedTime(date.from, timezone),
                    "dd/MM/yyyy",
                  )} - ${format(toZonedTime(date.to, timezone), "dd/MM/yyyy")}`}
                </CardDescription>
              </CardHeader>
              <Separator />
              <div className="min-h-[400px] divide-y">
                <TopMachinesList
                  machines={machinesBySales}
                  teamSlug={team.slug}
                />
              </div>
            </Card>
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">
                  Productos Más Vendidos
                </CardTitle>
                <CardDescription>
                  {`${format(
                    toZonedTime(date.from, timezone),
                    "dd/MM/yyyy",
                  )} - ${format(toZonedTime(date.to, timezone), "dd/MM/yyyy")}`}
                </CardDescription>
              </CardHeader>
              <Separator />
              <div className="min-h-[400px] divide-y">
                <TopProductsList
                  products={productsBySales.map((product) => ({
                    ...product,
                    imageUrl: product.image_url,
                  }))}
                  teamSlug={team.slug}
                  teamRole={teamRole}
                  userRole={session.role}
                />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
