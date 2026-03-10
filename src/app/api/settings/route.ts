import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      const created = await prisma.appSettings.create({
        data: { id: "singleton" },
      });
      return NextResponse.json(created);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[settings GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.ollamaUrl != null) data.ollamaUrl = String(body.ollamaUrl);
    if (body.model != null) data.model = String(body.model);
    if (body.watchDir != null) data.watchDir = String(body.watchDir);
    if (body.watching != null) data.watching = Boolean(body.watching);
    if (body.sourceRetentionDays != null) data.sourceRetentionDays = Math.max(1, parseInt(String(body.sourceRetentionDays)) || 30);
    if (body.imageRetentionDays != null) data.imageRetentionDays = Math.max(1, parseInt(String(body.imageRetentionDays)) || 180);

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ollamaUrl: (data.ollamaUrl as string) ?? "http://192.168.68.108:11434",
        model: (data.model as string) ?? "llava:7b",
        watchDir: (data.watchDir as string) ?? "",
        watching: (data.watching as boolean) ?? false,
      },
      update: data as Parameters<typeof prisma.appSettings.update>[0]["data"],
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[settings PUT]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
