import { Suspense } from "react";
import { DashboardContent } from "@/components/cards/dashboard-content";
import { DashboardHero } from "@/components/cards/dashboard-hero";
import { StatCards } from "@/components/cards/stat-cards";
import { QuickActions } from "@/components/cards/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHero />
      <StatCards />
      <QuickActions />

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          All Response Cards
        </h2>
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
