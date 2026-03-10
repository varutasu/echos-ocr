"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ResponseCard } from "./columns";

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onBulkMarkReviewed?: (ids: string[]) => void;
  onBulkMarkExported?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
};

const PAGE_SIZES = [10, 20, 50, 100];

export function DataTable<TData extends ResponseCard>({
  data,
  columns,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onBulkMarkReviewed,
  onBulkMarkExported,
  onBulkDelete,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSortChange,
}: DataTableProps<TData>) {
  const sorting: SortingState =
    controlledSortBy && controlledSortOrder
      ? [{ id: controlledSortBy, desc: controlledSortOrder === "desc" }]
      : [];
  const setSorting = React.useCallback(
    (updater: React.SetStateAction<SortingState>) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (first && onSortChange) {
        onSortChange(first.id, first.desc ? "desc" : "asc");
      }
    },
    [sorting, onSortChange]
  );

  const [rowSelection, setRowSelection] = React.useState({});
  const [internalVisibility, setInternalVisibility] =
    React.useState<VisibilityState>({});

  const visibility =
    controlledVisibility !== undefined ? controlledVisibility : internalVisibility;
  const setVisibility =
    onColumnVisibilityChange ?? setInternalVisibility;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(visibility) : updater;
      setVisibility(next);
    },
    state: {
      sorting,
      rowSelection,
      columnVisibility: visibility,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    manualPagination: true,
    manualSorting: !!onSortChange,
    pageCount: Math.ceil(totalCount / limit) || 1,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const totalPages = Math.ceil(totalCount / limit);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {onBulkMarkReviewed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkMarkReviewed(selectedIds)}
              >
                <CheckCircle className="mr-1.5 size-4" />
                Mark Reviewed
              </Button>
            )}
            {onBulkMarkExported && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkMarkExported(selectedIds)}
              >
                <Download className="mr-1.5 size-4" />
                Mark Exported
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onBulkDelete(selectedIds)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Delete
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.toggleAllPageRowsSelected(false)}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {totalCount === 0
              ? "0 results"
              : `${start}–${end} of ${totalCount}`}
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange?.(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={!canPrev}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "ghost"}
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!canNext}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
