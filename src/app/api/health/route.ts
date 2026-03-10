import { NextResponse } from "next/server";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/minio";

export async function GET() {
  const results: Record<string, unknown> = {
    minio: { status: "unknown" },
    minioConfig: {
      endpoint: process.env.MINIO_ENDPOINT || "192.168.68.105",
      port: process.env.MINIO_PORT || "9000",
      bucket: BUCKET,
    },
  };

  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    results.minio = { status: "ok", bucket: BUCKET };
  } catch (error: unknown) {
    const err = error as Error & { $response?: { body?: unknown }; $metadata?: unknown; Code?: string };
    results.minio = {
      status: "error",
      message: err.message,
      code: err.Code,
      metadata: err.$metadata,
    };

    // Try a raw fetch to see what the endpoint actually returns
    try {
      const endpoint = `http://${process.env.MINIO_ENDPOINT || "192.168.68.105"}:${process.env.MINIO_PORT || "9000"}`;
      const rawRes = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      const rawBody = await rawRes.text();
      results.rawEndpointResponse = {
        status: rawRes.status,
        contentType: rawRes.headers.get("content-type"),
        bodyPreview: rawBody.slice(0, 500),
      };
    } catch (fetchErr: unknown) {
      results.rawEndpointResponse = {
        error: (fetchErr as Error).message,
      };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
