import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedUrl, deleteObject } from "@/lib/minio";

export async function GET(
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

    const [frontImageUrl, backImageUrl] = await Promise.all([
      card.frontImagePath ? getPresignedUrl(card.frontImagePath) : null,
      card.backImagePath ? getPresignedUrl(card.backImagePath) : null,
    ]);

    return NextResponse.json({
      ...card,
      frontImageUrl,
      backImageUrl,
    });
  } catch (error) {
    console.error("[cards/[id] GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    const stringFields = [
      "name",
      "gender",
      "dateOfBirth",
      "maritalStatus",
      "maritalStatusOther",
      "visitType",
      "cellPhone",
      "homePhone",
      "email",
      "address",
      "aptNumber",
      "city",
      "state",
      "zip",
      "prayerRequests",
      "messageTopicsOther",
      "attendanceDuration",
      "campusPreferenceOther",
      "howHeardOther",
      "serviceAttended",
      "ocrStatus",
      "reviewStatus",
      "ocrError",
    ];
    for (const field of stringFields) {
      if (body[field] != null) data[field] = String(body[field]);
    }

    if (body.prayerForTeam != null) data.prayerForTeam = Boolean(body.prayerForTeam);
    if (body.prayerConfidential != null) data.prayerConfidential = Boolean(body.prayerConfidential);
    if (body.ocrConfidence != null) data.ocrConfidence = Number(body.ocrConfidence);
    if (body.messageTopics != null) data.messageTopics = body.messageTopics;
    if (body.nextStep != null) data.nextStep = body.nextStep;
    if (body.campusPreference != null) data.campusPreference = body.campusPreference;
    if (body.howHeard != null) data.howHeard = body.howHeard;
    if (body.rawOcrResponse != null) data.rawOcrResponse = body.rawOcrResponse;

    const updated = await prisma.responseCard.update({
      where: { id },
      data: data as Parameters<typeof prisma.responseCard.update>[0]["data"],
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[cards/[id] PUT]", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const deletePromises: Promise<void>[] = [];
    if (card.frontImagePath) deletePromises.push(deleteObject(card.frontImagePath));
    if (card.backImagePath) deletePromises.push(deleteObject(card.backImagePath));
    await Promise.allSettled(deletePromises);

    await prisma.responseCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cards/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
