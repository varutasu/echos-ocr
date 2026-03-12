"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ImagePreview } from "./image-preview";

function SortableHeader({
  column,
  children,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
  };
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 font-medium hover:bg-transparent"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1 size-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1 size-4" />
      ) : (
        <ArrowUpDown className="ml-1 size-4 opacity-50" />
      )}
    </Button>
  );
}

export type ResponseCard = {
  id: string;
  createdAt: string;
  name: string | null;
  email: string | null;
  cellPhone: string | null;
  city: string | null;
  state: string | null;
  gender: string | null;
  visitType: string | null;
  attendanceDuration: string | null;
  serviceAttended: string | null;
  ocrStatus: string;
  reviewStatus: string;
  ocrConfidence: number | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
};

const ocrStatusVariant: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  complete: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const reviewStatusVariant: Record<string, string> = {
  unreviewed:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  reviewed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  exported: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function getOcrBadgeClass(status: string): string {
  return ocrStatusVariant[status.toLowerCase()] ?? ocrStatusVariant.pending;
}

function getReviewBadgeClass(status: string): string {
  return (
    reviewStatusVariant[status.toLowerCase()] ?? reviewStatusVariant.unreviewed
  );
}

function getConfidenceClass(confidence: number | null): string {
  if (confidence == null) return "text-muted-foreground";
  if (confidence < 50) return "text-red-600 dark:text-red-400 font-medium";
  if (confidence <= 75) return "text-amber-600 dark:text-amber-400 font-medium";
  return "text-green-600 dark:text-green-400 font-medium";
}

export type ColumnActions = {
  onViewDetails?: (card: ResponseCard) => void;
  onMarkReviewed?: (card: ResponseCard) => void;
  onReprocess?: (card: ResponseCard) => void;
  onDelete?: (card: ResponseCard) => void;
};

export function createColumns(actions?: ColumnActions): ColumnDef<ResponseCard>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "frontImageUrl",
      id: "thumbnail",
      header: "",
      cell: ({ row }) => (
        <ImagePreview
          imageUrl={row.original.frontImageUrl ?? row.original.backImageUrl}
          alt={row.original.name ?? "Card"}
        />
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("name") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>Email</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("email") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "cellPhone",
      header: ({ column }) => (
        <SortableHeader column={column}>Phone</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("cellPhone") ?? "—"}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const city = row.original.city;
        const state = row.original.state;
        const loc = [city, state].filter(Boolean).join(", ");
        return (
          <span className="text-muted-foreground">{loc || "—"}</span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "visitType",
      header: ({ column }) => (
        <SortableHeader column={column}>Visit Type</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("visitType") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "attendanceDuration",
      header: ({ column }) => (
        <SortableHeader column={column}>Attendance</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("attendanceDuration") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "serviceAttended",
      header: ({ column }) => (
        <SortableHeader column={column}>Service</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("serviceAttended") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "ocrStatus",
      header: ({ column }) => (
        <SortableHeader column={column}>OCR Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = String(row.getValue("ocrStatus") ?? "pending");
        return (
          <Badge
            variant="secondary"
            className={cn("capitalize", getOcrBadgeClass(status))}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "reviewStatus",
      header: ({ column }) => (
        <SortableHeader column={column}>Review</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = String(row.getValue("reviewStatus") ?? "unreviewed");
        return (
          <Badge
            variant="secondary"
            className={cn("capitalize", getReviewBadgeClass(status))}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "ocrConfidence",
      header: ({ column }) => (
        <SortableHeader column={column}>Confidence</SortableHeader>
      ),
      cell: ({ row }) => {
        const val = row.getValue("ocrConfidence") as number | null;
        const pct = val != null ? Math.round(val) : null;
        return (
          <span className={cn(getConfidenceClass(val ?? 0))}>
            {pct != null ? `${pct}%` : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="Open menu"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions?.onViewDetails && (
              <DropdownMenuItem
                onClick={() => actions.onViewDetails?.(row.original)}
              >
                <Eye className="mr-2 size-4" />
                View details
              </DropdownMenuItem>
            )}
            {actions?.onMarkReviewed && (
              <DropdownMenuItem
                onClick={() => actions.onMarkReviewed?.(row.original)}
              >
                <CheckCircle className="mr-2 size-4" />
                Mark reviewed
              </DropdownMenuItem>
            )}
            {actions?.onReprocess &&
              row.original.ocrStatus !== "processing" && (
                <DropdownMenuItem
                  onClick={() => actions.onReprocess?.(row.original)}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Reprocess
                </DropdownMenuItem>
              )}
            {actions?.onDelete && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => actions.onDelete?.(row.original)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export const columns = createColumns();
