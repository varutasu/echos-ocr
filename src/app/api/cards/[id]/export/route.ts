import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = await prisma.responseCard.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const updated = await prisma.responseCard.update({
      where: { id },
      data: { reviewStatus: "exported" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[cards/[id]/export POST]", error);
    return NextResponse.json(
      { error: "Failed to mark card as exported" },
      { status: 500 }
    );
  }
}
