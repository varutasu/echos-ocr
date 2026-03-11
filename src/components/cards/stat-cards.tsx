"use client";

import * as React from "react";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  byOcrStatus: Record<string, number>;
  byReviewStatus: Record<string, number>;
};

type StatCardData = {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  accentClass: string;
};

export function StatCards() {
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards: StatCardData[] = React.useMemo(() => {
    if (!stats) {
      return [
        { label: "Total Cards", value: 0, icon: FileText, accentClass: "text-primary bg-primary/10" },
        { label: "OCR Complete", value: 0, icon: CheckCircle, accentClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
        { label: "Errors", value: 0, icon: AlertTriangle, accentClass: "text-red-600 bg-red-500/10 dark:text-red-400" },
        { label: "Pending Review", value: 0, icon: Clock, accentClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
      ];
    }
    return [
      {
        label: "Total Cards",
        value: stats.total,
        icon: FileText,
        accentClass: "text-primary bg-primary/10",
      },
      {
        label: "OCR Complete",
        value: stats.byOcrStatus["complete"] || 0,
        icon: CheckCircle,
        accentClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
        trendUp: true,
      },
      {
        label: "Errors",
        value: stats.byOcrStatus["error"] || 0,
        icon: AlertTriangle,
        accentClass: "text-red-600 bg-red-500/10 dark:text-red-400",
        trendUp: false,
      },
      {
        label: "Pending Review",
        value: stats.byReviewStatus["unreviewed"] || 0,
        icon: Clock,
        accentClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
      },
    ];
  }, [stats]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="gradient-stat flex flex-col gap-3 rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div className={cn("flex size-10 items-center justify-center rounded-xl", card.accentClass)}>
                <Icon className="size-5" />
              </div>
              {card.trendUp !== undefined && card.value > 0 && (
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  card.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                )}>
                  {card.trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {stats ? card.value.toLocaleString() : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
