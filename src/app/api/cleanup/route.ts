import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteObject, listObjects } from "@/lib/minio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "singleton" },
      });
    }

    const now = new Date();
    const sourcesCutoff = new Date(now.getTime() - settings.sourceRetentionDays * 86400000);
    const imagesCutoff = new Date(now.getTime() - settings.imageRetentionDays * 86400000);

    const results = {
      sourcesDeleted: 0,
      imagesDeleted: 0,
      cardsUpdated: 0,
      jobsPurged: 0,
      dryRun,
    };

    // 1. Purge source PDFs older than sourceRetentionDays
    const sourceKeys = await listObjects("sources/");
    const jobsWithSources = await prisma.processingJob.findMany({
      where: { createdAt: { lt: sourcesCutoff }, status: "complete" },
      select: { id: true },
    });
    const oldJobIds = new Set(jobsWithSources.map((j) => j.id));

    for (const key of sourceKeys) {
      const jobId = key.split("/")[1];
      if (jobId && oldJobIds.has(jobId)) {
        if (!dryRun) await deleteObject(key);
        results.sourcesDeleted++;
      }
    }

    // 2. Purge card images older than imageRetentionDays
    const oldCards = await prisma.responseCard.findMany({
      where: { createdAt: { lt: imagesCutoff } },
      select: { id: true, frontImagePath: true, backImagePath: true },
    });

    for (const card of oldCards) {
      if (card.frontImagePath) {
        if (!dryRun) await deleteObject(card.frontImagePath);
        results.imagesDeleted++;
      }
      if (card.backImagePath) {
        if (!dryRun) await deleteObject(card.backImagePath);
        results.imagesDeleted++;
      }
      if (!dryRun) {
        await prisma.responseCard.update({
          where: { id: card.id },
          data: { frontImagePath: null, backImagePath: null },
        });
      }
      results.cardsUpdated++;
    }

    // 3. Purge completed processing jobs older than sourceRetentionDays
    if (!dryRun) {
      const deleted = await prisma.processingJob.deleteMany({
        where: { createdAt: { lt: sourcesCutoff }, status: { in: ["complete", "error"] } },
      });
      results.jobsPurged = deleted.count;
    } else {
      results.jobsPurged = await prisma.processingJob.count({
        where: { createdAt: { lt: sourcesCutoff }, status: { in: ["complete", "error"] } },
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[cleanup POST]", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "singleton" },
      });
    }

    const now = new Date();
    const sourcesCutoff = new Date(now.getTime() - settings.sourceRetentionDays * 86400000);
    const imagesCutoff = new Date(now.getTime() - settings.imageRetentionDays * 86400000);

    const sourcesEligible = await prisma.processingJob.count({
      where: { createdAt: { lt: sourcesCutoff }, status: "complete" },
    });
    const imagesEligible = await prisma.responseCard.count({
      where: {
        createdAt: { lt: imagesCutoff },
        OR: [
          { frontImagePath: { not: null } },
          { backImagePath: { not: null } },
        ],
      },
    });

    return NextResponse.json({
      sourceRetentionDays: settings.sourceRetentionDays,
      imageRetentionDays: settings.imageRetentionDays,
      sourcesEligible,
      imagesEligible,
    });
  } catch (error) {
    console.error("[cleanup GET]", error);
    return NextResponse.json(
      { error: "Failed to check cleanup status" },
      { status: 500 }
    );
  }
}
