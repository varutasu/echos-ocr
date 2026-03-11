import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reprocessJob } from "@/lib/ocr";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.processingJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "error") {
      return NextResponse.json(
        { error: `Cannot reprocess job with status "${job.status}"` },
        { status: 400 }
      );
    }

    reprocessJob(id).catch((err) => {
      console.error(`[reprocess] Job ${id} reprocessing failed:`, err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[jobs/[id]/reprocess POST]", error);
    return NextResponse.json(
      { error: "Failed to start reprocessing" },
      { status: 500 }
    );
  }
}
