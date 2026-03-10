import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [total, byOcrStatus, byReviewStatus] = await Promise.all([
      prisma.responseCard.count(),
      prisma.responseCard.groupBy({
        by: ["ocrStatus"],
        _count: { id: true },
      }),
      prisma.responseCard.groupBy({
        by: ["reviewStatus"],
        _count: { id: true },
      }),
    ]);

    const ocrStatusCounts = Object.fromEntries(
      byOcrStatus.map((r) => [r.ocrStatus, r._count.id])
    );
    const reviewStatusCounts = Object.fromEntries(
      byReviewStatus.map((r) => [r.reviewStatus, r._count.id])
    );

    return NextResponse.json({
      total,
      byOcrStatus: ocrStatusCounts,
      byReviewStatus: reviewStatusCounts,
    });
  } catch (error) {
    console.error("[stats GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
