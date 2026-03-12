import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reprocessCard } from "@/lib/ocr";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = await prisma.responseCard.findUnique({ where: { id } });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (card.ocrStatus === "processing") {
      return NextResponse.json(
        { error: "Card is already being processed" },
        { status: 400 }
      );
    }

    reprocessCard(id).catch((err) => {
      console.error(`[reprocess] Card ${id} reprocessing failed:`, err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cards/[id]/reprocess POST]", error);
    return NextResponse.json(
      { error: "Failed to start reprocessing" },
      { status: 500 }
    );
  }
}
