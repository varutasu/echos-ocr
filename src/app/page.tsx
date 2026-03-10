import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { DashboardContent } from "@/components/cards/dashboard-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Header
        title="Response Cards"
        description="Manage scanned response cards from Echo Life Church"
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
