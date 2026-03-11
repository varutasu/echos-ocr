"use client";

import * as React from "react";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  byOcrStatus: Record<string, number>;
  byReviewStatus: Record<string, number>;
};

export type StatFilter = "all" | "complete" | "error" | "unreviewed" | null;

type StatCardData = {
  label: string;
  value: number;
  icon: React.ElementType;
  filterKey: StatFilter;
  accentClass: string;
  activeRing: string;
};

interface StatCardsProps {
  activeFilter: StatFilter;
  onFilterChange: (filter: StatFilter) => void;
}

export function StatCards({ activeFilter, onFilterChange }: StatCardsProps) {
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
        { label: "Total Cards", value: 0, icon: FileText, filterKey: "all", accentClass: "text-primary bg-primary/10", activeRing: "ring-primary/40" },
        { label: "OCR Complete", value: 0, icon: CheckCircle, filterKey: "complete", accentClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400", activeRing: "ring-emerald-500/40" },
        { label: "Errors", value: 0, icon: AlertTriangle, filterKey: "error", accentClass: "text-red-600 bg-red-500/10 dark:text-red-400", activeRing: "ring-red-500/40" },
        { label: "Pending Review", value: 0, icon: Clock, filterKey: "unreviewed", accentClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400", activeRing: "ring-amber-500/40" },
      ];
    }
    return [
      {
        label: "Total Cards",
        value: stats.total,
        icon: FileText,
        filterKey: "all" as StatFilter,
        accentClass: "text-primary bg-primary/10",
        activeRing: "ring-primary/40",
      },
      {
        label: "OCR Complete",
        value: stats.byOcrStatus["complete"] || 0,
        icon: CheckCircle,
        filterKey: "complete" as StatFilter,
        accentClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
        activeRing: "ring-emerald-500/40",
      },
      {
        label: "Errors",
        value: stats.byOcrStatus["error"] || 0,
        icon: AlertTriangle,
        filterKey: "error" as StatFilter,
        accentClass: "text-red-600 bg-red-500/10 dark:text-red-400",
        activeRing: "ring-red-500/40",
      },
      {
        label: "Pending Review",
        value: stats.byReviewStatus["unreviewed"] || 0,
        icon: Clock,
        filterKey: "unreviewed" as StatFilter,
        accentClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
        activeRing: "ring-amber-500/40",
      },
    ];
  }, [stats]);

  const handleClick = (filterKey: StatFilter) => {
    if (activeFilter === filterKey) {
      onFilterChange(null);
    } else {
      onFilterChange(filterKey);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.filterKey;
        return (
          <button
            key={card.label}
            type="button"
            onClick={() => handleClick(card.filterKey)}
            className={cn(
              "gradient-stat flex flex-col gap-3 rounded-2xl p-4 text-left transition-all sm:p-5",
              "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
              isActive && `ring-2 ${card.activeRing} shadow-lg`
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  card.accentClass
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {stats ? card.value.toLocaleString() : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {card.label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
