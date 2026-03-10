import { prisma } from "./db";

async function getSettings() {
  let settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "singleton" },
    });
  }
  return settings;
}

function getOllamaUrl() {
  return process.env.OLLAMA_BASE_URL || "http://192.168.68.108:11434";
}

async function getModel() {
  const settings = await getSettings();
  return process.env.OLLAMA_MODEL || settings.model;
}

const RESPONSE_CARD_PROMPT = `You are analyzing a scanned church response card. This is the PERSONAL INFORMATION side.

Extract ALL of the following fields from the image. For checkboxes, determine if they are checked or unchecked.
For handwritten text, read it as accurately as possible.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "name": "string or null",
  "gender": "Male" or "Female" or null,
  "dateOfBirth": "string as written or null",
  "maritalStatus": "Married" or "Single" or "Other" or null,
  "maritalStatusOther": "string if Other is checked, else null",
  "visitType": "First/Second Time Guest" or "Update My Information" or null,
  "cellPhone": "string or null",
  "homePhone": "string or null",
  "email": "string or null",
  "address": "string or null",
  "aptNumber": "string or null",
  "city": "string or null",
  "state": "string or null",
  "zip": "string or null",
  "prayerRequests": "string or null",
  "prayerForTeam": true/false,
  "prayerConfidential": true/false,
  "confidence": 0-100
}`;

const SURVEY_PROMPT = `You are analyzing a scanned church Easter survey form. This is the SURVEY side.

Extract ALL of the following fields. For checkboxes, determine if they are checked (filled/marked) or unchecked (empty).

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "messageTopics": ["array of checked topics from: Stress, Marriage, Revival, Addiction, Parenting, Miracles, Forgiveness, Finances, My Identity, Conflict Resolution, The Holy Spirit, Understanding The Bible, Spiritual Warfare, Sharing My Faith, Anxiety, Heaven, Spiritual Gifts"],
  "messageTopicsOther": "string if Other is filled in, else null",
  "nextStep": ["array of checked items from: Baptism, Next Steps"],
  "attendanceDuration": "Less than 6 months" or "6 Months - 1 Year" or "1-3 Years" or "4-6 Years" or "7+ Years" or null,
  "campusPreference": ["array of checked locations from: Beulah, Pace/Milton, Gulf Breeze, Warrington"],
  "campusPreferenceOther": "string if Other is filled in, else null",
  "howHeard": ["array of checked items from: This is my church home, Regular Attender, Drove by, Social Media, Google, Personal Invite"],
  "howHeardOther": "string if Other is filled in, else null",
  "serviceAttended": "A" or "B" or "C" or "D" or null,
  "confidence": 0-100
}`;

export interface OcrResult {
  data: Record<string, unknown>;
  confidence: number;
  raw: string;
  side: "response" | "survey";
}

export async function ocrImage(
  imageBase64: string,
  side: "response" | "survey"
): Promise<OcrResult> {
  const ollamaUrl = getOllamaUrl();
  const model = await getModel();
  const prompt = side === "response" ? RESPONSE_CARD_PROMPT : SURVEY_PROMPT;

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.response || "";

  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse OCR response: ${rawText.slice(0, 500)}`);
  }

  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 50;
  delete parsed.confidence;

  return { data: parsed, confidence, raw: rawText, side };
}
