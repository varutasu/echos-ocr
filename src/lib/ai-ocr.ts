import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { prisma } from "./db";
import type { LanguageModel } from "ai";

const DEFAULT_GATEWAY_MODEL = "openai/gpt-4o-mini";
const DEFAULT_OLLAMA_MODEL = "llava:7b";

async function getSettings() {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "singleton" },
    });
  }
  return settings;
}

function getModelInstance(
  provider: string,
  modelId: string,
  ollamaUrl: string
): LanguageModel {
  if (provider === "ollama") {
    const resolvedModel = modelId || DEFAULT_OLLAMA_MODEL;
    const baseURL = (ollamaUrl || process.env.OLLAMA_BASE_URL || "http://192.168.68.108:11434") + "/v1";
    const ollama = createOpenAICompatible({ name: "ollama", baseURL });
    return ollama.chatModel(resolvedModel);
  }

  const resolvedModel = modelId || DEFAULT_GATEWAY_MODEL;
  return gateway(resolvedModel);
}

const responseCardSchema = z.object({
  name: z.string().nullable().describe("Full name as written on the card"),
  gender: z.string().nullable().describe("Male or Female"),
  dateOfBirth: z.string().nullable().describe("Date of birth as written"),
  maritalStatus: z.string().nullable().describe("Married, Single, or Other"),
  maritalStatusOther: z.string().nullable().describe("Value if Other is checked"),
  visitType: z.string().nullable().describe("First/Second Time Guest or Update My Information"),
  cellPhone: z.string().nullable().describe("Cell phone number"),
  homePhone: z.string().nullable().describe("Home phone number"),
  email: z.string().nullable().describe("Email address"),
  address: z.string().nullable().describe("Street address"),
  aptNumber: z.string().nullable().describe("Apartment number"),
  city: z.string().nullable().describe("City"),
  state: z.string().nullable().describe("State"),
  zip: z.string().nullable().describe("ZIP code"),
  prayerRequests: z.string().nullable().describe("Written prayer requests"),
  prayerForTeam: z.boolean().describe("Whether prayer team checkbox is checked"),
  prayerConfidential: z.boolean().describe("Whether confidential checkbox is checked"),
  confidence: z.number().min(0).max(100).describe("Your confidence in the OCR accuracy, 0-100"),
});

const surveySchema = z.object({
  messageTopics: z.array(z.string()).describe(
    "Checked topics from: Stress, Marriage, Revival, Addiction, Parenting, Miracles, Forgiveness, Finances, My Identity, Conflict Resolution, The Holy Spirit, Understanding The Bible, Spiritual Warfare, Sharing My Faith, Anxiety, Heaven, Spiritual Gifts"
  ),
  messageTopicsOther: z.string().nullable().describe("Value if Other is filled in"),
  nextStep: z.array(z.string()).describe("Checked items from: Baptism, Next Steps"),
  attendanceDuration: z.string().nullable().describe(
    "Less than 6 months, 6 Months - 1 Year, 1-3 Years, 4-6 Years, or 7+ Years"
  ),
  campusPreference: z.array(z.string()).describe(
    "Checked locations from: Beulah, Pace/Milton, Gulf Breeze, Warrington"
  ),
  campusPreferenceOther: z.string().nullable().describe("Value if Other is filled in"),
  howHeard: z.array(z.string()).describe(
    "Checked items from: This is my church home, Regular Attender, Drove by, Social Media, Google, Personal Invite"
  ),
  howHeardOther: z.string().nullable().describe("Value if Other is filled in"),
  serviceAttended: z.string().nullable().describe("Service letter: A, B, C, or D"),
  confidence: z.number().min(0).max(100).describe("Your confidence in the OCR accuracy, 0-100"),
});

const RESPONSE_SYSTEM_PROMPT = `You are analyzing a scanned church response card. This is the PERSONAL INFORMATION side.

Extract ALL of the following fields from the image. For checkboxes, determine if they are checked or unchecked.
For handwritten text, read it as accurately as possible.

Be precise: return null for fields you cannot read. Set prayerForTeam and prayerConfidential to false if the checkboxes are not clearly marked.`;

const SURVEY_SYSTEM_PROMPT = `You are analyzing a scanned church Easter survey form. This is the SURVEY side.

Extract ALL of the following fields. For checkboxes, determine if they are checked (filled/marked) or unchecked (empty).
Return empty arrays for checkbox groups where nothing is checked.

Be precise: return null for fields you cannot read.`;

export interface OcrResult {
  data: Record<string, unknown>;
  confidence: number;
  raw: string;
  side: "response" | "survey";
}

async function extractStructured<T extends Record<string, unknown>>(
  model: LanguageModel,
  schema: z.ZodType<T>,
  systemPrompt: string,
  imageBase64: string
): Promise<T> {
  const { output, text } = await generateText({
    model,
    output: Output.object({ schema }),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract all data from this scanned card image." },
          { type: "image", image: Buffer.from(imageBase64, "base64") },
        ],
      },
    ],
  });

  if (!output) {
    throw new Error(`AI model did not return structured output. Raw text: ${(text || "").slice(0, 500)}`);
  }

  return output;
}

export async function ocrImage(
  imageBase64: string,
  side: "response" | "survey"
): Promise<OcrResult> {
  const settings = await getSettings();
  const provider = settings.aiProvider || "gateway";
  const modelId = settings.aiModel || "";
  const model = getModelInstance(provider, modelId, settings.ollamaUrl);

  let output: Record<string, unknown>;

  if (side === "response") {
    output = await extractStructured(model, responseCardSchema, RESPONSE_SYSTEM_PROMPT, imageBase64);
  } else {
    output = await extractStructured(model, surveySchema, SURVEY_SYSTEM_PROMPT, imageBase64);
  }

  const confidence = typeof output.confidence === "number" ? output.confidence : 50;
  const data = { ...output };
  delete data.confidence;

  return { data, confidence, raw: JSON.stringify(output), side };
}
