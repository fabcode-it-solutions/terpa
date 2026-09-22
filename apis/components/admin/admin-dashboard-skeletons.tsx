import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboardCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminDashboardChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <div className="py-6 border-t border-b">
        <div className="flex md:flex-row flex-col justify-around md:gap-2 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 flex-1 text-center">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-6 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <CardContent className="pb-0 pt-4">
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

export function AdminTopListsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, cardIndex) => (
        <Card key={cardIndex} className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">
              <Skeleton className="h-5 w-48" />
            </CardTitle>
          </CardHeader>
          <div className="min-h-[400px] divide-y">
            {Array.from({ length: 10 }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className="p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-4 pl-2">
                  {cardIndex === 2 && (
                    <Skeleton className="w-12 h-12 rounded-md flex-shrink-0" />
                  )}
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                    {cardIndex === 2 && <Skeleton className="h-3 w-20 mt-1" />}
                  </div>
                </div>
                <Skeleton className="w-10 h-10 rounded-md" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
