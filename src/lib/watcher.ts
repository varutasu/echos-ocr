import chokidar, { type FSWatcher } from "chokidar";
import fs from "fs/promises";
import path from "path";
import { prisma } from "./db";
import { processFile } from "./ocr";

let watcher: FSWatcher | null = null;

const processedFiles = new Set<string>();

export async function startWatching(watchDir: string): Promise<void> {
  if (watcher) {
    await stopWatching();
  }

  try {
    await fs.access(watchDir);
  } catch {
    throw new Error(`Watch directory does not exist: ${watchDir}`);
  }

  watcher = chokidar.watch(watchDir, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  });

  watcher.on("add", async (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) return;
    if (processedFiles.has(filePath)) return;
    processedFiles.add(filePath);

    const fileName = path.basename(filePath);
    const isPdf = ext === ".pdf";

    try {
      const buffer = await fs.readFile(filePath);
      const job = await prisma.processingJob.create({
        data: {
          fileName,
          filePath,
          status: "queued",
        },
      });

      processFile(job.id, fileName, buffer, isPdf).catch((err) => {
        console.error(`[watcher] Processing failed for ${fileName}:`, err);
      });

      console.log(`[watcher] Queued: ${fileName}`);
    } catch (err) {
      console.error(`[watcher] Failed to read file ${filePath}:`, err);
    }
  });

  watcher.on("error", (error: unknown) => {
    console.error("[watcher] Error:", error);
  });

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: { watching: true, watchDir },
    create: { id: "singleton", watching: true, watchDir },
  });

  console.log(`[watcher] Started watching: ${watchDir}`);
}

export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: { watching: false },
    create: { id: "singleton", watching: false },
  });

  console.log("[watcher] Stopped");
}

export function isWatching(): boolean {
  return watcher !== null;
}
