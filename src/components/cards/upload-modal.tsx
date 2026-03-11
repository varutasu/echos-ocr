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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type UploadingFile = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
};

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadStart?: (files: UploadingFile[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (fileId: string, error: string) => void;
}

export function UploadModal({
  open,
  onOpenChange,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}: UploadModalProps) {
  const [stagedFiles, setStagedFiles] = React.useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/")
    );
    if (dropped.length) {
      setStagedFiles((prev) => [...prev, ...dropped]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setStagedFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeStaged = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (stagedFiles.length === 0) return;

    const newUploading: UploadingFile[] = stagedFiles.map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploading]);
    onUploadStart?.(newUploading);

    const filesToUpload = [...stagedFiles];
    setStagedFiles([]);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const uploadEntry = newUploading[i];

      try {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("files", file);

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) =>
                prev.map((uf) =>
                  uf.id === uploadEntry.id ? { ...uf, progress: pct } : uf
                )
              );
              onUploadProgress?.(uploadEntry.id, pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadingFiles((prev) =>
                prev.map((uf) =>
                  uf.id === uploadEntry.id
                    ? { ...uf, progress: 100, status: "complete" }
                    : uf
                )
              );
              onUploadComplete?.(uploadEntry.id);
              resolve();
            } else {
              const errMsg = "Upload failed";
              setUploadingFiles((prev) =>
                prev.map((uf) =>
                  uf.id === uploadEntry.id
                    ? { ...uf, status: "error", error: errMsg }
                    : uf
                )
              );
              onUploadError?.(uploadEntry.id, errMsg);
              reject(new Error(errMsg));
            }
          });

          xhr.addEventListener("error", () => {
            const errMsg = "Network error";
            setUploadingFiles((prev) =>
              prev.map((uf) =>
                uf.id === uploadEntry.id
                  ? { ...uf, status: "error", error: errMsg }
                  : uf
              )
            );
            onUploadError?.(uploadEntry.id, errMsg);
            reject(new Error(errMsg));
          });

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });
      } catch {
        // error already handled in XHR callbacks
      }
    }

    const completeCount = filesToUpload.length;
    toast.success(`Uploaded ${completeCount} file(s). Processing started.`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStagedFiles([]);
      setUploadingFiles((prev) => prev.filter((f) => f.status === "uploading"));
    }, 200);
  };

  const allDone = uploadingFiles.length > 0 && uploadingFiles.every((f) => f.status !== "uploading");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Documents
          </DialogTitle>
          <DialogDescription>
            Drag and drop files or browse to upload. You can close this dialog and uploads will continue in the background.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all",
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-muted-foreground/20 hover:border-primary/30"
          )}
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="size-5 text-primary" />
          </div>
          <p className="mb-1 text-sm font-medium">Drop files here</p>
          <p className="mb-3 text-xs text-muted-foreground">PDF, JPEG, PNG, WebP</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen className="size-4" />
            Browse Files
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

        {(stagedFiles.length > 0 || uploadingFiles.length > 0) && (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {stagedFiles.map((file, i) => (
              <div
                key={`staged-${file.name}-${i}`}
                className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
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
                <Button variant="ghost" size="icon-xs" onClick={() => removeStaged(i)}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}

            {uploadingFiles.map((uf) => (
              <div
                key={uf.id}
                className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
              >
                {uf.status === "uploading" && (
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                )}
                {uf.status === "complete" && (
                  <CheckCircle className="size-4 shrink-0 text-emerald-500" />
                )}
                {uf.status === "error" && (
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                )}
                <span className="flex-1 min-w-0 truncate text-sm">{uf.name}</span>
                {uf.status === "uploading" && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${uf.progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {uf.progress}%
                    </span>
                  </div>
                )}
                {uf.status === "complete" && (
                  <span className="text-xs text-emerald-600">Done</span>
                )}
                {uf.status === "error" && (
                  <span className="text-xs text-red-500">{uf.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {allDone ? "Done" : "Cancel"}
          </DialogClose>
          {stagedFiles.length > 0 && (
            <Button onClick={uploadFiles} className="rounded-xl">
              <Upload className="size-4" />
              Upload {stagedFiles.length} File{stagedFiles.length !== 1 ? "s" : ""}
            </Button>
          )}
          {uploadingFiles.some((f) => f.status === "uploading") && (
            <Button variant="outline" onClick={handleClose} className="rounded-xl">
              Continue in Background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
