/**
 * Shared Gemini API Client for Supabase Edge Functions
 * 
 * Features:
 * - Reads model from GEMINI_MODEL secret (pinned)
 * - Reads key from GEMINI_API_KEY secret
 * - Exponential backoff retry queue for 429/503 rate limits
 * - Zod schema validation with automatic single retry on malformed JSON
 * - Markdown fence stripping
 * - Payload size caps
 */

import { z, type ZodSchema } from "https://esm.sh/zod@3.22.4";

export const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB file cap

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded
  };
}

export interface CallGeminiOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  mediaPart?: {
    mimeType: string;
    base64Data: string;
  };
  schema: ZodSchema<T>;
  temperature?: number;
  maxRetries?: number;
}

export class GeminiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiValidationError";
  }
}

/**
 * Pinned model identifier read from environment secret.
 * Falls back to gemini-1.5-flash if not explicitly set.
 */
export function getPinnedGeminiModel(): string {
  const model = Deno.env.get("GEMINI_MODEL");
  if (model && model.trim().length > 0) {
    return model.trim();
  }
  return "gemini-1.5-flash";
}

/**
 * Strips potential markdown code blocks (```json ... ```) from model output.
 */
export function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Execute raw HTTP request to Google Gemini API with rate-limit retry & backoff
 */
async function executeGeminiRequestWithBackoff(
  apiKey: string,
  modelName: string,
  requestBody: Record<string, unknown>,
  maxBackoffRetries = 2
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxBackoffRetries) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429 || response.status === 503) {
        if (attempt < maxBackoffRetries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw new GeminiRateLimitError("Gemini API rate limit or quota exceeded. Please wait a moment and try again.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (HTTP ${response.status}): ${errorText}`);
      }

      const responseJson = await response.json();
      const candidateText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error("Empty candidate response from Gemini API");
      }

      return candidateText;
    } catch (err: unknown) {
      if (err instanceof GeminiRateLimitError) throw err;
      if (attempt < maxBackoffRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }

  throw new Error("Gemini request failed after maximum retries");
}

/**
 * Main helper: Calls Gemini, parses JSON, validates schema with Zod, and retries once on bad output.
 */
export async function callGeminiStructured<T>(
  options: CallGeminiOptions<T>
): Promise<T> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Server configuration error: GEMINI_API_KEY secret is not configured in Supabase");
  }

  const modelName = getPinnedGeminiModel();
  const { systemPrompt, userPrompt, mediaPart, schema, temperature = 0.2 } = options;

  const parts: GeminiContentPart[] = [];

  if (mediaPart) {
    parts.push({
      inlineData: {
        mimeType: mediaPart.mimeType,
        data: mediaPart.base64Data,
      },
    });
  }

  parts.push({ text: userPrompt });

  const requestBody = {
    contents: [{ role: "user", parts }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
  };

  // Attempt 1
  let rawText = await executeGeminiRequestWithBackoff(apiKey, modelName, requestBody);
  let cleaned = extractJsonFromText(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    const validated = schema.parse(parsed);
    return validated;
  } catch (_firstError: unknown) {
    // Retry once with a corrective prompt and lower temperature
    const correctivePrompt = `${userPrompt}\n\nIMPORTANT: Your previous output did not match the required JSON schema. Please correct and output ONLY valid JSON adhering strictly to the schema.`;
    const retryParts: GeminiContentPart[] = [];
    if (mediaPart) {
      retryParts.push({
        inlineData: {
          mimeType: mediaPart.mimeType,
          data: mediaPart.base64Data,
        },
      });
    }
    retryParts.push({ text: correctivePrompt });

    const retryBody = {
      ...requestBody,
      contents: [{ role: "user", parts: retryParts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    rawText = await executeGeminiRequestWithBackoff(apiKey, modelName, retryBody);
    cleaned = extractJsonFromText(rawText);

    try {
      const parsedRetry = JSON.parse(cleaned);
      return schema.parse(parsedRetry);
    } catch (secondError: unknown) {
      throw new GeminiValidationError(
        `Failed to parse valid structured JSON from Gemini after retry: ${secondError instanceof Error ? secondError.message : "Invalid schema"}`
      );
    }
  }
}
