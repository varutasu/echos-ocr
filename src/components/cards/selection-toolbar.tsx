"use client";

import {
  CheckCircle,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  selectedIds: string[];
  onMarkReviewed?: (ids: string[]) => void;
  onMarkExported?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
  onClear: () => void;
}

export function SelectionToolbar({
  selectedIds,
  onMarkReviewed,
  onMarkExported,
  onDelete,
  onClear,
}: SelectionToolbarProps) {
  const count = selectedIds.length;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out",
        count > 0
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <div className="glass-card flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl sm:gap-3 sm:px-5">
        <span className="shrink-0 text-sm font-medium">
          {count} selected
        </span>
        <div className="h-4 w-px bg-border/50" />
        <div className="flex items-center gap-1.5">
          {onMarkReviewed && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onMarkReviewed(selectedIds)}
            >
              <CheckCircle className="size-4" />
              <span className="hidden sm:inline ml-1">Reviewed</span>
            </Button>
          )}
          {onMarkExported && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onMarkExported(selectedIds)}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline ml-1">Export</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(selectedIds)}
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline ml-1">Delete</span>
            </Button>
          )}
        </div>
        <div className="h-4 w-px bg-border/50" />
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={onClear}
        >
          <X className="size-4" />
          <span className="hidden sm:inline ml-1">Clear</span>
        </Button>
      </div>
    </div>
  );
}
