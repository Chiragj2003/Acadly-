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
  SUBMISSION_GRADER_SYSTEM_PROMPT_V1,
  buildSubmissionGraderPromptV1,
} from "../_shared/prompts/submission_grader_v1.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod Schema for AI evaluation suggestion
const GraderSuggestionSchema = z.object({
  suggestedScore: z.number().min(0),
  maxScore: z.number().positive(),
  feedback: z.string().min(5),
  strengths: z.array(z.string()).default([]),
  areasForImprovement: z.array(z.string()).default([]),
});

export type GraderSuggestionOutput = z.infer<typeof GraderSuggestionSchema>;

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Authorize caller: Verify caller is teacher or admin
    const { data: profile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTeacherOrAdmin = profile?.role === "teacher" || profile?.role === "admin";
    if (!isTeacherOrAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only faculty or administrators can evaluate submissions" }),
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
    const { submissionId, referenceAnswer, rubric, submissionImageBase64 } = payload;

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Bad Request: submissionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Enforce per-teacher daily quota via atomic database RPC
    const { data: quotaResult, error: quotaError } = await userClient.rpc(
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

    // 5. Fetch submission and assignment details
    // (Using service client for secure server-side fetching)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sub, error: subError } = await adminClient
      .from("submissions")
      .select(`
        id,
        assignment_id,
        submission_text,
        file_url,
        file_urls,
        assignment:assignments (
          id,
          title,
          description,
          instructions,
          total_marks
        )
      `)
      .eq("id", submissionId)
      .single();

    if (subError || !sub) {
      return new Response(
        JSON.stringify({ error: `Submission not found: ${subError?.message || "Invalid ID"}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assignment = (sub as any).assignment;
    const maxScore = assignment?.total_marks || 25;
    const questionText = assignment?.description || assignment?.instructions || assignment?.title || "Written homework problem";

    // PRIVACY ENFORCEMENT:
    // We send ONLY the assignment instructions, rubric, and raw submission content.
    // Zero student names, emails, roll numbers, or IDs are included.
    const studentSubmissionText = sub.submission_text || "Attached handwritten derivation solution";

    const userPrompt = buildSubmissionGraderPromptV1({
      assignmentTitle: assignment?.title || "Homework",
      questionText,
      referenceAnswer,
      rubric,
      maxScore,
      studentSubmissionText,
    });

    const mediaPart = submissionImageBase64
      ? {
          mimeType: "image/jpeg",
          base64Data: submissionImageBase64,
        }
      : undefined;

    // 6. Invoke Gemini with prompt injection defense
    const evaluation = await callGeminiStructured({
      systemPrompt: SUBMISSION_GRADER_SYSTEM_PROMPT_V1,
      userPrompt,
      mediaPart,
      schema: GraderSuggestionSchema,
      temperature: 0.2,
    });

    // Clamp suggested score between 0 and maxScore
    const clampedScore = Math.max(0, Math.min(evaluation.suggestedScore, maxScore));

    // 7. Store suggestion in submissions table with ai_status = 'pending_review'
    // Notice: status is NOT changed to 'graded' yet. Final grading requires teacher approval.
    const { error: recordError } = await userClient.rpc("record_ai_submission_suggestion", {
      p_submission_id: submissionId,
      p_ai_score: clampedScore,
      p_ai_feedback: evaluation.feedback,
    });

    if (recordError) {
      // Fallback: update directly via adminClient if RPC is restricted
      await adminClient
        .from("submissions")
        .update({
          ai_score: clampedScore,
          ai_feedback: evaluation.feedback,
          ai_status: "pending_review",
          ai_graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        aiScore: clampedScore,
        maxScore,
        aiFeedback: evaluation.feedback,
        strengths: evaluation.strengths,
        areasForImprovement: evaluation.areasForImprovement,
        aiStatus: "pending_review",
        modelUsed: getPinnedGeminiModel(),
        quotaRemaining: quotaResult?.remaining ?? null,
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
