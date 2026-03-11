"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResponseCard } from "./columns";
import type { UploadingFile } from "./upload-modal";

const TOGGLEABLE_COLUMNS = [
  { id: "thumbnail", label: "Thumbnail" },
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "cellPhone", label: "Phone" },
  { id: "location", label: "Location" },
  { id: "visitType", label: "Visit Type" },
  { id: "attendanceDuration", label: "Attendance" },
  { id: "serviceAttended", label: "Service" },
  { id: "ocrStatus", label: "OCR Status" },
  { id: "reviewStatus", label: "Review" },
  { id: "ocrConfidence", label: "Confidence" },
] as const;

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  uploadingRows?: UploadingFile[];
  onSelectionChange?: (selectedIds: string[]) => void;
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
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSortChange,
  uploadingRows = [],
  onSelectionChange,
}: DataTableProps<TData>) {
  const router = useRouter();

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

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = React.useRef<HTMLDivElement>(null);

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
  const selectedIds = React.useMemo(
    () => selectedRows.map((r) => r.original.id),
    [selectedRows]
  );

  React.useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const totalPages = Math.ceil(totalCount / limit);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  const handleRowClick = (e: React.MouseEvent, rowId: string) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest('[data-slot="checkbox"]') ||
      target.closest('[data-slot="dropdown-menu"]')
    ) {
      return;
    }
    router.push(`/cards/${rowId}`);
  };

  const handleHeaderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        contextMenuRef.current.contains(e.target as Node)
      ) {
        return;
      }
      setContextMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [contextMenu]);

  const isColumnVisible = (id: string) => visibility[id] !== false;
  const toggleColumn = (id: string, visible: boolean) => {
    setVisibility({ ...visibility, [id]: visible });
  };

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="glass-card overflow-hidden rounded-2xl hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader onContextMenu={handleHeaderContextMenu}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
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
              {uploadingRows.map((uf) => (
                <TableRow key={uf.id} className="opacity-70">
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3">
                    <span className="font-medium text-muted-foreground">
                      {uf.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3" colSpan={6} />
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${uf.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {uf.progress}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3" />
                </TableRow>
              ))}

              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={(e) => handleRowClick(e, row.original.id)}
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
                uploadingRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {uploadingRows.map((uf) => (
          <div
            key={uf.id}
            className="glass-card rounded-2xl p-4 opacity-70"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-primary" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{uf.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {uf.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "glass-card cursor-pointer rounded-2xl p-4 transition-all hover:shadow-lg active:scale-[0.99]",
                row.getIsSelected() && "ring-2 ring-primary/30"
              )}
              onClick={(e) => handleRowClick(e, row.original.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {row.original.name ?? "Unnamed"}
                  </p>
                  {row.original.email && (
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {row.original.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize text-[10px] px-1.5 py-0.5",
                      row.original.ocrStatus === "complete"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : row.original.ocrStatus === "error"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.original.ocrStatus}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {row.original.cellPhone && (
                  <span>{row.original.cellPhone}</span>
                )}
                {row.original.visitType && (
                  <span>{row.original.visitType}</span>
                )}
                {row.original.ocrConfidence != null && (
                  <span
                    className={cn(
                      "font-medium",
                      row.original.ocrConfidence >= 75
                        ? "text-green-600 dark:text-green-400"
                        : row.original.ocrConfidence >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {Math.round(row.original.ocrConfidence)}%
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          uploadingRows.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results.
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {totalCount === 0
              ? "0 results"
              : `${start}–${end} of ${totalCount}`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange?.(Number(e.target.value))}
              className="h-8 rounded-xl border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onPageChange?.(page - 1)}
            disabled={!canPrev}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline ml-1">Prev</span>
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
                  className="size-8 rounded-xl p-0"
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
            className="rounded-xl"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!canNext}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Right-click column visibility context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-50 min-w-[180px] rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Toggle Columns
          </div>
          <div className="my-1 h-px bg-border" />
          {TOGGLEABLE_COLUMNS.map((col) => (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Checkbox
                checked={isColumnVisible(col.id)}
                onCheckedChange={(checked) =>
                  toggleColumn(col.id, checked !== false)
                }
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
