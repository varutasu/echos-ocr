"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Download, Columns3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const REVIEW_OPTIONS = [
  { value: "", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
  { value: "exported", label: "Exported" },
] as const;

const OCR_OPTIONS = [
  { value: "", label: "All" },
  { value: "complete", label: "Complete" },
  { value: "error", label: "Error" },
  { value: "pending", label: "Pending" },
] as const;

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

export type FiltersProps = {
  search?: string;
  reviewStatus?: string;
  ocrStatus?: string;
  visitType?: string;
  attendanceDuration?: string;
  serviceAttended?: string;
  visitTypeOptions?: string[];
  attendanceDurationOptions?: string[];
  serviceAttendedOptions?: string[];
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  onExportCsv?: () => void;
};

export function Filters({
  search: initialSearch = "",
  reviewStatus: initialReviewStatus = "",
  ocrStatus: initialOcrStatus = "",
  visitType: initialVisitType = "",
  attendanceDuration: initialAttendanceDuration = "",
  serviceAttended: initialServiceAttended = "",
  visitTypeOptions = [],
  attendanceDurationOptions = [],
  serviceAttendedOptions = [],
  columnVisibility = {},
  onColumnVisibilityChange,
  onExportCsv,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? initialSearch;
  const reviewStatus = searchParams.get("reviewStatus") ?? initialReviewStatus;
  const ocrStatus = searchParams.get("ocrStatus") ?? initialOcrStatus;
  const visitType = searchParams.get("visitType") ?? initialVisitType;
  const attendanceDuration =
    searchParams.get("attendanceDuration") ?? initialAttendanceDuration;
  const serviceAttended =
    searchParams.get("serviceAttended") ?? initialServiceAttended;

  const updateParams = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    updateParams({ search: v || undefined });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const isColumnVisible = (id: string) => columnVisibility[id] !== false;

  const toggleColumn = (id: string, visible: boolean) => {
    onColumnVisibilityChange?.({
      ...columnVisibility,
      [id]: visible,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email, phone, city..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Review:
            </span>
            {REVIEW_OPTIONS.map((opt) => (
              <Badge
                key={opt.value || "all"}
                variant={reviewStatus === opt.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  reviewStatus === opt.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateParams({ reviewStatus: opt.value || undefined })}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              OCR:
            </span>
            {OCR_OPTIONS.map((opt) => (
              <Badge
                key={opt.value || "all"}
                variant={ocrStatus === opt.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  ocrStatus === opt.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateParams({ ocrStatus: opt.value || undefined })}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={visitType || "__all__"}
          onValueChange={(v: string | null) =>
            updateParams({
              visitType: !v || v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Visit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All visit types</SelectItem>
            {visitTypeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={attendanceDuration || "__all__"}
          onValueChange={(v: string | null) =>
            updateParams({
              attendanceDuration: !v || v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Attendance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All attendance</SelectItem>
            {attendanceDurationOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={serviceAttended || "__all__"}
          onValueChange={(v: string | null) =>
            updateParams({
              serviceAttended: !v || v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All services</SelectItem>
            {serviceAttendedOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" />
              }
            >
              <Columns3 className="mr-2 size-4" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {TOGGLEABLE_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={isColumnVisible(col.id)}
                  onCheckedChange={(checked) =>
                    toggleColumn(col.id, checked !== false)
                  }
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
