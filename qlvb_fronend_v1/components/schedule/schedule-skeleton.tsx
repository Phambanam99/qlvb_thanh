import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = "week" | "month" | "list" | "table";

interface ScheduleSkeletonProps {
  viewMode: ViewMode;
}

export function ScheduleSkeleton({ viewMode }: ScheduleSkeletonProps) {
  // For table view, render table skeleton differently (handled by ScheduleTable component)
  if (viewMode === "table") {
    return null; // ScheduleTable component handles its own loading state
  }

  return (
    <Card>
      <CardContent className="p-6">
        {viewMode === "list" ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
          </div>
        ) : viewMode === "week" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-32 border rounded-md p-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array(35)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-24 border rounded-md p-1">
                    <Skeleton className="h-3 w-6 mb-1" />
                    {i % 5 === 0 && (
                      <>
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-3 w-3/4" />
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
