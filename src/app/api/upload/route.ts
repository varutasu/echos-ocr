import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processFile } from "@/lib/ocr";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = [
      ...(formData.getAll("files") as File[]),
      ...(formData.get("file") ? [formData.get("file") as File] : []),
    ].filter(Boolean);

    if (!files?.length) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const jobIds: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const contentType = file.type;
      if (!ALLOWED_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: `Invalid file type: ${contentType}. Allowed: PDF, JPEG, PNG, WebP` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name || `upload-${Date.now()}`;
      const isPdf = contentType === "application/pdf";

      const job = await prisma.processingJob.create({
        data: {
          fileName,
          filePath: `sources/${fileName}`,
          status: "queued",
        },
      });

      jobIds.push(job.id);

      processFile(job.id, fileName, buffer, isPdf).catch((err) => {
        console.error(`[upload] Background processing failed for job ${job.id}:`, err);
      });
    }

    return NextResponse.json({ jobIds });
  } catch (error) {
    console.error("[upload POST]", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
