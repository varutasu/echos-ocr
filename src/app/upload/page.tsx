"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProcessingJob = {
  id: string;
  fileName: string;
  status: string;
  totalPages: number;
  processed: number;
  error: string | null;
  createdAt: string;
};

export default function UploadPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [jobs, setJobs] = React.useState<ProcessingJob[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [retryingJobId, setRetryingJobId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchJobs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=20");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
      }
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      toast.success(`Uploaded ${files.length} file(s). Processing ${data.jobIds.length} job(s).`);
      setFiles([]);
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
      case "processing":
        return <Loader2 className="size-4 animate-spin text-primary" />;
      case "complete":
        return <CheckCircle className="size-4 text-emerald-500" />;
      case "error":
        return <AlertCircle className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/reprocess`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to retry job");
      }
      toast.success("Job reprocessing started");
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry job");
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Upload"
        description="Upload scanned response cards for OCR processing"
        icon={Upload}
      />

      <Card variant="glass">
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all",
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/[2%]"
            )}
          >
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="size-7 text-primary" />
            </div>
            <h3 className="mb-1 text-base font-semibold sm:text-lg">
              Drop files here or click to browse
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Supports PDF, JPEG, PNG, and WebP files
            </p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="mr-2 size-4" />
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-medium">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                  >
                    Clear all
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5"
                  >
                    {file.type === "application/pdf" ? (
                      <FileText className="size-4 shrink-0 text-red-500" />
                    ) : (
                      <ImageIcon className="size-4 shrink-0 text-blue-500" />
                    )}
                    <span className="flex-1 min-w-0 truncate text-sm">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeFile(i)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="size-4 text-primary" />
            Processing Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No processing jobs yet. Upload files to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(job.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {job.fileName}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize text-xs",
                            job.status === "complete" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                            job.status === "error" && "bg-red-500/10 text-red-700 dark:text-red-300",
                            job.status === "processing" && "bg-primary/10 text-primary",
                          )}
                        >
                          {job.status}
                        </Badge>
                      </div>
                      {job.totalPages > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.round((job.processed / job.totalPages) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {job.processed}/{job.totalPages}
                          </span>
                        </div>
                      )}
                      {job.error && (
                        <p className="mt-1 text-xs text-red-500">{job.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {job.status === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg px-2.5 text-xs"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingJobId === job.id}
                      >
                        {retryingJobId === job.id ? (
                          <><Loader2 className="mr-1 size-3 animate-spin" /> Retrying...</>
                        ) : (
                          <><RefreshCw className="mr-1 size-3" /> Retry</>
                        )}
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
