import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function MachineDetailCardsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Communication Card */}
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Comunicación</CardTitle>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
            {/* Inventory Card */}
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Inventario</CardTitle>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-1 w-[120px]" />
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-4">
            {/* Sales Today Card */}
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-center space-y-0">
                <CardTitle>Ventas Hoy</CardTitle>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
            {/* Change Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Cambio</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Information Card */}
        <div className="flex flex-1">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Información</CardTitle>
              <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent>
              <div className="divide-y text-sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MachineDetailChartSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center space-y-0">
        <div>
          <CardTitle>Ventas por Día</CardTitle>
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-8 w-8" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

export function MachineDetailSideCardsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Recent Sales Card */}
      <Card className="flex-1">
        <CardHeader className="flex-row items-center space-y-0 justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">Ventas Recientes</CardTitle>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <Separator />
        <div className="min-h-[400px] divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 flex justify-between items-center">
              <div className="space-y-1 flex-1">
                <div className="flex gap-2 items-center text-xs">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Top Products Card */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <Separator />
        <div className="min-h-[400px] divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-4 pl-2 flex-1">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
