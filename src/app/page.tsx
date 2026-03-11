import { Suspense } from "react";
import { DashboardContent } from "@/components/cards/dashboard-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-64 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
