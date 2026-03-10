import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search")?.trim() || undefined;
    const ocrStatus = searchParams.get("ocrStatus") || undefined;
    const reviewStatus = searchParams.get("reviewStatus") || undefined;
    const attendanceDuration = searchParams.get("attendanceDuration") || undefined;
    const visitType = searchParams.get("visitType") || undefined;
    const serviceAttended = searchParams.get("serviceAttended") || undefined;
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const validSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "ocrStatus",
      "reviewStatus",
      "attendanceDuration",
      "visitType",
      "serviceAttended",
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {};

    if (ocrStatus) where.ocrStatus = ocrStatus;
    if (reviewStatus) where.reviewStatus = reviewStatus;
    if (attendanceDuration) where.attendanceDuration = attendanceDuration;
    if (visitType) where.visitType = visitType;
    if (serviceAttended) where.serviceAttended = serviceAttended;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cellPhone: { contains: search, mode: "insensitive" } },
        { homePhone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { zip: { contains: search, mode: "insensitive" } },
      ];
    }

    const [cards, total] = await Promise.all([
      prisma.responseCard.findMany({
        where,
        orderBy: { [orderByField]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.responseCard.count({ where }),
    ]);

    return NextResponse.json({ cards, total, page, limit });
  } catch (error) {
    console.error("[cards GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      "sourceFile",
      "frontImagePath",
      "backImagePath",
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

    const card = await prisma.responseCard.create({
      data: data as Parameters<typeof prisma.responseCard.create>[0]["data"],
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("[cards POST]", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
