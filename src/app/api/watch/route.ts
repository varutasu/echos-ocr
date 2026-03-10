import { NextRequest, NextResponse } from "next/server";
import { startWatching, stopWatching, isWatching } from "@/lib/watcher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string | undefined;
    const watchDir = body.watchDir as string | undefined;

    if (!action || !["start", "stop"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      );
    }

    if (action === "start") {
      if (!watchDir) {
        return NextResponse.json(
          { error: "watchDir is required to start watching" },
          { status: 400 }
        );
      }
      await startWatching(watchDir);
    } else {
      await stopWatching();
    }

    return NextResponse.json({
      watching: isWatching(),
      watchDir: watchDir || "",
    });
  } catch (error) {
    console.error("[watch POST]", error);
    const message = error instanceof Error ? error.message : "Failed to update watch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
