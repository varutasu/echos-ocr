"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FiltersProps = {
  search?: string;
  visitType?: string;
  attendanceDuration?: string;
  serviceAttended?: string;
  visitTypeOptions?: string[];
  attendanceDurationOptions?: string[];
  serviceAttendedOptions?: string[];
  onExportCsv?: () => void;
  onUploadClick?: () => void;
};

export function Filters({
  search: initialSearch = "",
  visitType: initialVisitType = "",
  attendanceDuration: initialAttendanceDuration = "",
  serviceAttended: initialServiceAttended = "",
  visitTypeOptions = [],
  attendanceDurationOptions = [],
  serviceAttendedOptions = [],
  onExportCsv,
  onUploadClick,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? initialSearch;
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Select
            value={visitType || null}
            onValueChange={(v: string | null) =>
              updateParams({ visitType: !v || v === "__all__" ? undefined : v })
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Visit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All visits</SelectItem>
              {visitTypeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={attendanceDuration || null}
            onValueChange={(v: string | null) =>
              updateParams({
                attendanceDuration: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
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
            value={serviceAttended || null}
            onValueChange={(v: string | null) =>
              updateParams({
                serviceAttended: !v || v === "__all__" ? undefined : v,
              })
            }
          >
            <SelectTrigger className="w-[140px] rounded-xl">
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
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onExportCsv && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onExportCsv}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline ml-1.5">Export</span>
          </Button>
        )}
        {onUploadClick && (
          <Button size="sm" className="rounded-xl" onClick={onUploadClick}>
            <Upload className="size-4" />
            <span className="hidden sm:inline ml-1.5">Upload</span>
          </Button>
        )}
      </div>
    </div>
  );
}
