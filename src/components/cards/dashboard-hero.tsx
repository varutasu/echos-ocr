"use client";

import Link from "next/link";
import { Upload, ScanLine } from "lucide-react";

export function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-banner p-6 sm:p-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_20%,oklch(1_0_0/12%),transparent)]" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <ScanLine className="size-5 opacity-80" />
          <span className="text-sm font-medium text-white/80">Echo OCR</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
          Document Processing Center
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/75 sm:text-base">
          Upload your response cards and let AI-powered OCR extract data with high accuracy.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/20 transition-colors hover:bg-white/30"
          >
            <Upload className="size-4" />
            Upload Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
