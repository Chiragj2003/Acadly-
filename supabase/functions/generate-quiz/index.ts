import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { z } from "https://esm.sh/zod@3.22.4";
import {
  callGeminiStructured,
  getPinnedGeminiModel,
  MAX_PAYLOAD_BYTES,
  GeminiRateLimitError,
} from "../_shared/geminiClient.ts";
import {
  QUIZ_GENERATOR_SYSTEM_PROMPT_V1,
  buildQuizGeneratorPromptV1,
} from "../_shared/prompts/quiz_generator_v1.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod Schema for generated quiz draft
const QuizDraftSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string().min(3),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(5),
      marks: z.number().positive().default(4),
    })
  ).min(1),
});

export type QuizDraftOutput = z.infer<typeof QuizDraftSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Authenticate caller
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Authorize caller: Verify caller is teacher or admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTeacherOrAdmin = profile?.role === "teacher" || profile?.role === "admin";
    if (!isTeacherOrAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Teacher or admin privileges required to generate quizzes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check payload size
    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({ error: "Payload Too Large: Maximum allowed file/request size is 10 MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);
    const { notesText, topic, count = 5, pdfBase64 } = payload;

    if (!notesText && !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Either notesText or pdfBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Enforce per-teacher daily quota via atomic database RPC
    const { data: quotaResult, error: quotaError } = await supabaseClient.rpc(
      "check_and_increment_ai_quota",
      { p_teacher_id: user.id }
    );

    if (quotaError) {
      const isExceeded = quotaError.message?.toLowerCase().includes("quota exceeded");
      return new Response(
        JSON.stringify({
          error: isExceeded
            ? quotaError.message
            : `Failed to check quota: ${quotaError.message}`,
        }),
        {
          status: isExceeded ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Build prompt & invoke Gemini
    const userPrompt = buildQuizGeneratorPromptV1({
      topic,
      count: Math.min(Math.max(1, count), 15),
      notesText: notesText || "Extracted content from attached curriculum PDF",
    });

    const mediaPart = pdfBase64
      ? {
          mimeType: "application/pdf",
          base64Data: pdfBase64,
        }
      : undefined;

    const validatedQuiz = await callGeminiStructured({
      systemPrompt: QUIZ_GENERATOR_SYSTEM_PROMPT_V1,
      userPrompt,
      mediaPart,
      schema: QuizDraftSchema,
      temperature: 0.2,
    });

    // 6. Return questions as a DRAFT. (Never auto-publish; teacher reviews and publishes manually)
    return new Response(
      JSON.stringify({
        success: true,
        isDraft: true,
        modelUsed: getPinnedGeminiModel(),
        quotaRemaining: quotaResult?.remaining ?? null,
        questions: validatedQuiz.questions.map((q, idx) => ({
          id: `draft-q-${Date.now()}-${idx}`,
          type: "mcq",
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctIndex,
          explanation: q.explanation,
          marks: q.marks,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof GeminiRateLimitError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
