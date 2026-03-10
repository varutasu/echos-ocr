import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/minio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const key = pathSegments.join("/");

    if (!key) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const url = await getPresignedUrl(key);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[images GET]", error);
    return NextResponse.json(
      { error: "Failed to get image" },
      { status: 500 }
    );
  }
}
