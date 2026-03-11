import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
  anthropic: "claude-sonnet-4-20250514",
  ollama: "llava:7b",
};

function getTestModel(
  provider: string,
  modelId: string,
  ollamaUrl: string
): LanguageModel {
  const resolvedModel = modelId || DEFAULT_MODELS[provider] || DEFAULT_MODELS.ollama;

  switch (provider) {
    case "openai":
      return openai(resolvedModel);
    case "google":
      return google(resolvedModel);
    case "anthropic":
      return anthropic(resolvedModel);
    case "ollama": {
      const baseURL = (ollamaUrl || process.env.OLLAMA_BASE_URL || "http://192.168.68.108:11434") + "/v1";
      const ollama = createOpenAICompatible({ name: "ollama", baseURL });
      return ollama.chatModel(resolvedModel);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const provider = body.provider || "ollama";
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
