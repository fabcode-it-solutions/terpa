import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function TeamReportsControlsSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <Skeleton className="h-10 w-[300px]" /> {/* Machine Filter */}
        <Skeleton className="h-10 w-[200px]" /> {/* Date Range Picker */}
      </div>
      <Skeleton className="h-10 w-[120px]" /> {/* Export Dialog */}
    </div>
  );
}

export function TeamReportsChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-64" />
        </CardDescription>
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

export function TeamReportsSideCardsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Machines by Sales Card */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-5 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <Separator />
        <div className="min-h-[400px] divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-4 pl-2 flex-1">
                <Skeleton className="h-2 w-2 rounded-full" />{" "}
                {/* Presence indicator */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>

      {/* Products by Sales Card */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <Separator />
        <div className="min-h-[400px] divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-4 pl-2 flex-1">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
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
