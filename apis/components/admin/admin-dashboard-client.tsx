"use client";

import {
  getAdminMetricsAction,
  getAdminSalesSummaryAction,
  getAdminSalesChartAction,
  getAdminTopListsAction,
} from "@/actions/admin";
import {
  AdminDashboardCardsSkeleton,
  AdminDashboardChartSkeleton,
  AdminTopListsSkeleton,
} from "@/components/admin/admin-dashboard-skeletons";
import AdminTopTeamsList from "@/components/admin/admin-top-teams-list";
import AdminTopTeamsByVolumeList from "@/components/admin/admin-top-teams-by-volume-list";
import AdminTopProductsList from "@/components/admin/admin-top-products-list";
import AdminSalesChart from "@/components/admin/admin-sales-chart";
import ReportsDateRangePicker from "@/components/dashboard/reports-date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppContainer } from "@/components/ui/app-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Title } from "@/components/ui/typography";
import { formatNumber, pluralize } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

type Props = {
  from: Date;
  to: Date;
  isDateRangeTooLong: boolean;
};

export default function AdminDashboardClient({
  from,
  to,
  isDateRangeTooLong,
}: Props) {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? undefined;
  const toParam = searchParams.get("to") ?? undefined;

  const timezone = "America/Monterrey";
  const date = { from, to };

  // Separate queries that run in parallel - only when date range is valid
  const {
    data: salesSummary,
    isLoading: salesSummaryLoading,
    error: salesSummaryError,
  } = useQuery({
    queryKey: ["admin-sales-summary", fromParam, toParam],
    queryFn: () => getAdminSalesSummaryAction({ from: fromParam, to: toParam }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isDateRangeTooLong,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["admin-metrics", fromParam, toParam],
    queryFn: () => getAdminMetricsAction({ from: fromParam, to: toParam }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isDateRangeTooLong,
  });

  const {
    data: salesChart,
    isLoading: salesChartLoading,
    error: salesChartError,
  } = useQuery({
    queryKey: ["admin-sales-chart", fromParam, toParam],
    queryFn: () => getAdminSalesChartAction({ from: fromParam, to: toParam }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isDateRangeTooLong,
  });

  const {
    data: topLists,
    isLoading: topListsLoading,
    error: topListsError,
  } = useQuery({
    queryKey: ["admin-top-lists", fromParam, toParam],
    queryFn: () => getAdminTopListsAction({ from: fromParam, to: toParam }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isDateRangeTooLong,
  });

  const isLoading = salesSummaryLoading || metricsLoading;
  const error =
    salesSummaryError || metricsError || salesChartError || topListsError;

  if (error) {
    return (
      <AppContainer>
        <div className="text-red-500">
          Error loading dashboard data. Please try again.
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin`}>Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <Title>Dashboard</Title>
        <ReportsDateRangePicker
          timezone={timezone}
          from={date.from}
          to={date.to}
        />
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

      {/* Counter Cards */}
      {!isDateRangeTooLong && (
        <>
          {metricsLoading ? (
            <AdminDashboardCardsSkeleton />
          ) : (
            metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Equipos Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(metrics.totalTeams)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Equipos registrados
                    </p>
                    <div
                      className={`text-xs font-medium flex items-center gap-1 ${metrics.teamsChange.isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {metrics.teamsChange.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.teamsChange.numeric > 0 ? "+" : ""}
                      {formatNumber(metrics.teamsChange.numeric)} (
                      {metrics.teamsChange.percentage.toFixed(1)}%)
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Terminales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(metrics.totalTerminals)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Terminales activas
                    </p>
                    <div
                      className={`text-xs font-medium flex items-center gap-1 ${metrics.terminalsChange.isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {metrics.terminalsChange.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.terminalsChange.numeric > 0 ? "+" : ""}
                      {formatNumber(metrics.terminalsChange.numeric)} (
                      {metrics.terminalsChange.percentage.toFixed(1)}%)
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Máquinas Activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(metrics.totalMachines)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Máquinas activas
                    </p>
                    <div
                      className={`text-xs font-medium flex items-center gap-1 ${metrics.machinesChange.isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {metrics.machinesChange.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.machinesChange.numeric > 0 ? "+" : ""}
                      {formatNumber(metrics.machinesChange.numeric)} (
                      {metrics.machinesChange.percentage.toFixed(1)}%)
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}

          <div className="flex flex-col gap-4">
            {/* Sales Chart */}
            {salesSummaryLoading || salesChartLoading ? (
              <AdminDashboardChartSkeleton />
            ) : (
              salesSummary &&
              salesChart && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ventas Globales por Día</CardTitle>
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
                          {formatNumber(salesSummary.totalCount)}{" "}
                          {pluralize(
                            salesSummary.totalCount,
                            "venta",
                            "ventas",
                          )}{" "}
                          totales
                        </p>
                        <p className="text-xl font-medium">
                          {formatCurrency(salesSummary.totalSales)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-1 text-center">
                        <p className="text-muted-foreground text-sm">
                          {formatNumber(salesSummary.cardSales._count.id)}{" "}
                          {pluralize(
                            salesSummary.cardSales._count.id,
                            "venta",
                            "ventas",
                          )}{" "}
                          en tarjeta
                        </p>
                        <p className="space-x-2">
                          <span className="text-xl font-medium">
                            {formatCurrency(
                              salesSummary.cardSales._sum.machineProductCost ??
                                0,
                            )}{" "}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-1 text-center">
                        <p className="text-muted-foreground text-sm">
                          {formatNumber(salesSummary.cashSales._count.id)}{" "}
                          {pluralize(
                            salesSummary.cashSales._count.id,
                            "venta",
                            "ventas",
                          )}{" "}
                          en efectivo
                        </p>
                        <p className="space-x-2">
                          <span className="text-xl font-medium">
                            {formatCurrency(
                              salesSummary.cashSales._sum.machineProductCost ??
                                0,
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pb-0 pt-4">
                    <AdminSalesChart data={salesChart} />
                  </CardContent>
                </Card>
              )
            )}

            {/* Top Lists Section */}
            {topListsLoading ? (
              <AdminTopListsSkeleton />
            ) : (
              topLists && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Top 10 Equipos por Cantidad de Ventas
                      </CardTitle>
                      <CardDescription>
                        Del{" "}
                        {format(toZonedTime(date.from, timezone), "dd/MM/yyyy")}{" "}
                        al{" "}
                        {format(toZonedTime(date.to, timezone), "dd/MM/yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <div className="min-h-[400px] divide-y">
                      <AdminTopTeamsList teams={topLists.topTeamsBySaleCount} />
                    </div>
                  </Card>

                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Top 10 Equipos por Volumen de Ventas
                      </CardTitle>
                      <CardDescription>
                        Del{" "}
                        {format(toZonedTime(date.from, timezone), "dd/MM/yyyy")}{" "}
                        al{" "}
                        {format(toZonedTime(date.to, timezone), "dd/MM/yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <div className="min-h-[400px] divide-y">
                      <AdminTopTeamsByVolumeList
                        teams={topLists.topTeamsBySaleVolume}
                      />
                    </div>
                  </Card>

                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Top 10 Productos por Volumen
                      </CardTitle>
                      <CardDescription>
                        Del{" "}
                        {format(toZonedTime(date.from, timezone), "dd/MM/yyyy")}{" "}
                        al{" "}
                        {format(toZonedTime(date.to, timezone), "dd/MM/yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <div className="min-h-[400px] divide-y">
                      <AdminTopProductsList
                        products={topLists.topProductsBySaleVolume}
                      />
                    </div>
                  </Card>
                </div>
              )
            )}
          </div>
        </>
      )}
    </AppContainer>
  );
}
