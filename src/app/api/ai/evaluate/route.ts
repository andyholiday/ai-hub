// =============================================================================
// Use-Case Evaluation API Route
// POST /api/ai/evaluate
// Accepts a use-case idea (title + description), evaluates it via AI,
// stores the evaluation in the database, and awards XP to the user.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
  apiBadRequest,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateUseCaseSchema } from "@/lib/validators/evaluation";
import { evaluateUseCase } from "@/lib/ai/use-case-evaluator";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    // --- Rate limiting ---
    const rl = await rateLimit(req, "ai", auth.userId);
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    // --- Parse and validate request body ---
    const body: unknown = await req.json();
    const parsed = evaluateUseCaseSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { postId, title, description } = parsed.data;
    const supabase = createAdminClient();

    // --- Verify that the post exists and is of type 'idea' ---
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id, type, author_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return apiBadRequest("Beitrag nicht gefunden");
    }

    if (post.type !== "idea") {
      return apiBadRequest("Nur Beitraege vom Typ 'Idee' koennen bewertet werden");
    }

    // --- Check if an evaluation already exists for this post ---
    const { data: existingEval } = await supabase
      .from("usecase_evaluations")
      .select("id")
      .eq("idea_id", postId)
      .eq("evaluator_type", "ai")
      .limit(1)
      .maybeSingle();

    if (existingEval) {
      return apiBadRequest("Dieser Beitrag wurde bereits bewertet");
    }

    // --- Evaluate the use-case via AI ---
    const result = await evaluateUseCase({ title, description });
    const { evaluation } = result;

    // --- Store evaluation in database ---
    const { data: savedEvaluation, error: insertError } = await supabase
      .from("usecase_evaluations")
      .insert({
        idea_id: postId,
        evaluator_type: "ai" as const,
        overall_score: evaluation.overallScore,
        feasibility_score: evaluation.scores.feasibility,
        company_value_score: evaluation.scores.impact,
        employee_value_score: evaluation.scores.effort,
        scalability_score: evaluation.scores.aiReadiness,
        innovation_score: evaluation.scores.innovation,
        strengths: JSON.stringify(evaluation.strengths),
        risks: JSON.stringify(evaluation.risks),
        recommendation: evaluation.recommendation,
        next_steps: JSON.stringify(evaluation.nextSteps),
        ai_provider_used: result.provider,
      })
      .select("id, overall_score, created_at")
      .single();

    if (insertError) {
      return apiInternalError(insertError.message);
    }

    // --- Update the community post with the overall evaluation score ---
    await supabase
      .from("community_posts")
      .update({ ai_evaluation_score: evaluation.overallScore })
      .eq("id", postId);

    // --- Award XP for evaluation submission (fire-and-forget) ---
    awardXP(supabase, auth.userId, "idea_evaluated", 30).then(() =>
      checkAndAwardBadges(supabase, auth.userId),
    );

    // --- Return the full evaluation to the client ---
    return apiSuccess(
      {
        id: savedEvaluation.id,
        postId,
        evaluation,
        provider: result.provider,
        model: result.model,
        isFallback: result.isFallback,
        createdAt: savedEvaluation.created_at,
      },
      201,
    );
  } catch {
    return apiInternalError();
  }
}
