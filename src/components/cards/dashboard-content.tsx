"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { StatCards, type StatFilter } from "./stat-cards";
import { Filters } from "./filters";
import { DataTable } from "./data-table";
import { SelectionToolbar } from "./selection-toolbar";
import { UploadModal, type UploadingFile } from "./upload-modal";
import { createColumns, type ResponseCard } from "./columns";

const VISIT_TYPE_OPTIONS = [
  "First/Second Time Guest",
  "Update My Information",
];

const ATTENDANCE_OPTIONS = [
  "Less than 6 months",
  "6 Months - 1 Year",
  "1-3 Years",
  "4-6 Years",
  "7+ Years",
];

const SERVICE_OPTIONS = ["A", "B", "C", "D"];

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  const [data, setData] = React.useState<ResponseCard[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadingRows, setUploadingRows] = React.useState<UploadingFile[]>([]);
  const [activeStatFilter, setActiveStatFilter] = React.useState<StatFilter>(null);
  const [globalDragOver, setGlobalDragOver] = React.useState(false);

  const fetchCards = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("page")) params.set("page", "1");
      if (!params.has("limit")) params.set("limit", "20");

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      const json = await res.json();

      const cards = json.cards.map((card: Record<string, unknown>) => ({
        ...card,
        createdAt: card.createdAt as string,
        frontImageUrl: card.frontImagePath
          ? `/api/images/${card.frontImagePath}`
          : null,
        backImageUrl: card.backImagePath
          ? `/api/images/${card.backImagePath}`
          : null,
      }));

      setData(cards);
      setTotal(json.total);
    } catch {
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const updateUrl = React.useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleStatFilterChange = React.useCallback(
    (filter: StatFilter) => {
      setActiveStatFilter(filter);
      const params = new URLSearchParams(searchParams.toString());

      params.delete("ocrStatus");
      params.delete("reviewStatus");

      if (filter === "complete") {
        params.set("ocrStatus", "complete");
      } else if (filter === "error") {
        params.set("ocrStatus", "error");
      } else if (filter === "unreviewed") {
        params.set("reviewStatus", "unreviewed");
      }

      params.set("page", "1");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleBulkAction = async (
    ids: string[],
    action: "reviewed" | "exported" | "delete"
  ) => {
    try {
      if (action === "delete") {
        await Promise.all(
          ids.map((id) => fetch(`/api/cards/${id}`, { method: "DELETE" }))
        );
        toast.success(`Deleted ${ids.length} card(s)`);
      } else {
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/cards/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reviewStatus: action }),
            })
          )
        );
        toast.success(`Marked ${ids.length} card(s) as ${action}`);
      }
      fetchCards();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const handleExportCsv = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Name", "Email", "Phone", "City", "State", "Gender",
      "Visit Type", "Attendance", "Service", "OCR Status", "Review Status",
      "Confidence",
    ];
    const rows = data.map((c) => [
      c.name || "", c.email || "", c.cellPhone || "", c.city || "",
      c.state || "", c.gender || "", c.visitType || "",
      c.attendanceDuration || "", c.serviceAttended || "", c.ocrStatus,
      c.reviewStatus, c.ocrConfidence?.toString() || "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-cards-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const columns = React.useMemo(
    () =>
      createColumns({
        onViewDetails: (card) => router.push(`/cards/${card.id}`),
        onMarkReviewed: async (card) => {
          await fetch(`/api/cards/${card.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewStatus: "reviewed" }),
          });
          toast.success("Marked as reviewed");
          fetchCards();
        },
        onDelete: async (card) => {
          await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
          toast.success("Card deleted");
          fetchCards();
        },
      }),
    [router, fetchCards]
  );

  const handleUploadStart = (files: UploadingFile[]) => {
    setUploadingRows((prev) => [...prev, ...files]);
  };

  const handleUploadProgress = (fileId: string, progress: number) => {
    setUploadingRows((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
    );
  };

  const handleUploadComplete = (fileId: string) => {
    setUploadingRows((prev) => prev.filter((f) => f.id !== fileId));
    fetchCards();
  };

  const handleUploadError = (fileId: string, error: string) => {
    setUploadingRows((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "error" as const, error } : f
      )
    );
  };

  React.useEffect(() => {
    const handleOpenUpload = () => setUploadModalOpen(true);
    window.addEventListener("open-upload-modal", handleOpenUpload);
    return () => window.removeEventListener("open-upload-modal", handleOpenUpload);
  }, []);

  React.useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        setGlobalDragOver(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setGlobalDragOver(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setGlobalDragOver(false);
      if (e.dataTransfer?.files.length) {
        setUploadModalOpen(true);
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const openUpload = React.useCallback(() => {
    setUploadModalOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Global drag overlay */}
      {globalDragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-background/80 px-12 py-8 text-center shadow-xl">
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, JPEG, PNG, WebP
            </p>
          </div>
        </div>
      )}

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Response Cards
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and review scanned response cards
        </p>
      </div>

      {/* Stat cards as filters */}
      <StatCards
        activeFilter={activeStatFilter}
        onFilterChange={handleStatFilterChange}
      />

      {/* Filter toolbar */}
      <Filters
        visitTypeOptions={VISIT_TYPE_OPTIONS}
        attendanceDurationOptions={ATTENDANCE_OPTIONS}
        serviceAttendedOptions={SERVICE_OPTIONS}
        onExportCsv={handleExportCsv}
        onUploadClick={openUpload}
      />

      {/* Data table */}
      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        <DataTable
          data={data}
          columns={columns}
          totalCount={total}
          page={page}
          limit={limit}
          sortBy={sortBy}
          sortOrder={sortOrder}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onPageChange={(p) => updateUrl({ page: p })}
          onLimitChange={(l) => updateUrl({ limit: l, page: 1 })}
          onSortChange={(sb, so) => updateUrl({ sortBy: sb, sortOrder: so })}
          uploadingRows={uploadingRows.filter((f) => f.status === "uploading")}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Floating selection toolbar */}
      <SelectionToolbar
        selectedIds={selectedIds}
        onMarkReviewed={(ids) => handleBulkAction(ids, "reviewed")}
        onMarkExported={(ids) => handleBulkAction(ids, "exported")}
        onDelete={(ids) => handleBulkAction(ids, "delete")}
        onClear={() => setSelectedIds([])}
      />

      {/* Upload modal */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  );
}
