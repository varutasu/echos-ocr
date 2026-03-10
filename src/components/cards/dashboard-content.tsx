"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "./data-table";
import { Filters } from "./filters";
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

  const updateUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.set(key, String(value));
    }
    router.push(`/?${params.toString()}`);
  };

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
      "Name", "Email", "Phone", "City", "State", "Gender", "DOB",
      "Visit Type", "Attendance", "Service", "OCR Status", "Review Status",
      "Confidence",
    ];
    const rows = data.map((c) => [
      c.name || "", c.email || "", c.cellPhone || "", c.city || "",
      c.state || "", c.gender || "", "", c.visitType || "",
      c.attendanceDuration || "", c.serviceAttended || "", c.ocrStatus,
      c.reviewStatus, c.ocrConfidence?.toString() || "",
    ]);

    const csv = [headers, ...rows].map((r) =>
      r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")
    ).join("\n");

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

  return (
    <div className="space-y-6">
      <Filters
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        visitTypeOptions={VISIT_TYPE_OPTIONS}
        attendanceDurationOptions={ATTENDANCE_OPTIONS}
        serviceAttendedOptions={SERVICE_OPTIONS}
        onExportCsv={handleExportCsv}
      />
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
          onBulkMarkReviewed={(ids) => handleBulkAction(ids, "reviewed")}
          onBulkMarkExported={(ids) => handleBulkAction(ids, "exported")}
          onBulkDelete={(ids) => handleBulkAction(ids, "delete")}
        />
      </div>
    </div>
  );
}
