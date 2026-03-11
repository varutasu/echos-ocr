import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

function getTestModel(provider: string, modelId: string, ollamaUrl: string): LanguageModel {
  if (provider === "ollama") {
    const baseURL = (ollamaUrl || process.env.OLLAMA_BASE_URL || "http://192.168.68.108:11434") + "/v1";
    const ollama = createOpenAICompatible({ name: "ollama", baseURL });
    return ollama.chatModel(modelId || "llava:7b");
  }

  return gateway(modelId || "openai/gpt-4o-mini");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const provider = body.provider || "gateway";
    const modelId = body.model || "";
    const ollamaUrl = body.ollamaUrl || "";

    const model = getTestModel(provider, modelId, ollamaUrl);

    const { text } = await generateText({
      model,
      prompt: "Reply with exactly: OK",
      maxOutputTokens: 10,
    });

    return NextResponse.json({ ok: true, response: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ai-test]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
