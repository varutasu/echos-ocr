"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

const THUMB_SIZE = 40;

type ImagePreviewProps = {
  imageUrl: string | null;
  alt?: string;
  className?: string;
};

export function ImagePreview({
  imageUrl,
  alt = "Card image",
  className,
}: ImagePreviewProps) {
  const [open, setOpen] = React.useState(false);

  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50",
          className
        )}
        aria-label="No image"
      >
        <ImageIcon className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "relative flex size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted/50 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className
            )}
            aria-label="View image"
          />
        }
      >
        <Image
          src={imageUrl}
          alt={alt}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          className="object-cover"
          unoptimized
        />
      </DialogTrigger>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] w-auto p-0 overflow-hidden bg-transparent border-0 shadow-none"
        showCloseButton={true}
      >
        <div className="relative flex items-center justify-center p-4">
          <Image
            src={imageUrl}
            alt={alt}
            width={800}
            height={600}
            className="max-h-[85vh] w-auto object-contain rounded-lg"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
