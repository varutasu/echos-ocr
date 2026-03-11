"use client";

import Link from "next/link";
import { Upload, FileDown, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Upload Documents",
    description: "PDF, JPG, PNG formats",
    href: "/upload",
    icon: Upload,
    accent: "text-primary bg-primary/10",
  },
  {
    label: "Export Results",
    description: "TXT, DOCX, CSV formats",
    href: "/#",
    icon: FileDown,
    accent: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Recent Files",
    description: "View processing history",
    href: "/",
    icon: Clock,
    accent: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  },
  {
    label: "Settings",
    description: "Customize your experience",
    href: "/settings",
    icon: Settings,
    accent: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="glass-card group flex items-center gap-3 rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg sm:p-5"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110", action.accent)}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{action.label}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
