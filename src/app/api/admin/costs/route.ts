// =============================================================================
// Cost Dashboard API
// GET /api/admin/costs - Aggregated cost overview with period filter
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { costQuerySchema } from "@/lib/validators/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostSummaryByProvider {
  provider_id: string;
  provider_key: string;
  display_name: string;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost: number;
  request_count: number;
}

interface CostSummaryByFeature {
  feature: string;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost: number;
  request_count: number;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const rl = await rateLimit(req, "admin", auth.userId);
    if (!rl.success) {
      return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const rawParams = {
      period: searchParams.get("period") ?? "month",
      provider_id: searchParams.get("provider_id") ?? undefined,
      feature: searchParams.get("feature") ?? undefined,
    };

    const parsed = costQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { period, provider_id, feature } = parsed.data;
    const supabase = createAdminClient();

    // Calculate the start date based on the period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const startIso = startDate.toISOString();

    // --- Build base query ---
    let baseQuery = supabase
      .from("ai_cost_log")
      .select("provider_id, feature, tokens_input, tokens_output, estimated_cost")
      .gte("created_at", startIso);

    if (provider_id) {
      baseQuery = baseQuery.eq("provider_id", provider_id);
    }
    if (feature) {
      baseQuery = baseQuery.eq("feature", feature);
    }

    const { data: costRows, error: costError } = await baseQuery;

    if (costError) {
      return apiInternalError(costError.message);
    }

    // --- Fetch provider names for aggregation ---
    const { data: providers } = await supabase
      .from("ai_providers")
      .select("id, provider_key, display_name");

    const providerMap = new Map(
      (providers ?? []).map((p) => [p.id, { key: p.provider_key, name: p.display_name }]),
    );

    // --- Aggregate by provider ---
    const byProvider = new Map<string, CostSummaryByProvider>();

    for (const row of costRows ?? []) {
      const existing = byProvider.get(row.provider_id);
      const pInfo = providerMap.get(row.provider_id);

      if (existing) {
        existing.total_tokens_input += row.tokens_input;
        existing.total_tokens_output += row.tokens_output;
        existing.total_cost += Number(row.estimated_cost);
        existing.request_count += 1;
      } else {
        byProvider.set(row.provider_id, {
          provider_id: row.provider_id,
          provider_key: pInfo?.key ?? "unknown",
          display_name: pInfo?.name ?? "Unknown Provider",
          total_tokens_input: row.tokens_input,
          total_tokens_output: row.tokens_output,
          total_cost: Number(row.estimated_cost),
          request_count: 1,
        });
      }
    }

    // --- Aggregate by feature ---
    const byFeature = new Map<string, CostSummaryByFeature>();

    for (const row of costRows ?? []) {
      const existing = byFeature.get(row.feature);

      if (existing) {
        existing.total_tokens_input += row.tokens_input;
        existing.total_tokens_output += row.tokens_output;
        existing.total_cost += Number(row.estimated_cost);
        existing.request_count += 1;
      } else {
        byFeature.set(row.feature, {
          feature: row.feature,
          total_tokens_input: row.tokens_input,
          total_tokens_output: row.tokens_output,
          total_cost: Number(row.estimated_cost),
          request_count: 1,
        });
      }
    }

    // --- Compute totals ---
    let totalCost = 0;
    let totalTokensInput = 0;
    let totalTokensOutput = 0;
    let totalRequests = 0;

    for (const summary of byProvider.values()) {
      totalCost += summary.total_cost;
      totalTokensInput += summary.total_tokens_input;
      totalTokensOutput += summary.total_tokens_output;
      totalRequests += summary.request_count;
    }

    return apiSuccess({
      period,
      start_date: startIso,
      end_date: now.toISOString(),
      totals: {
        cost: Math.round(totalCost * 1_000_000) / 1_000_000,
        tokens_input: totalTokensInput,
        tokens_output: totalTokensOutput,
        requests: totalRequests,
      },
      by_provider: Array.from(byProvider.values()).map((s) => ({
        ...s,
        total_cost: Math.round(s.total_cost * 1_000_000) / 1_000_000,
      })),
      by_feature: Array.from(byFeature.values()).map((s) => ({
        ...s,
        total_cost: Math.round(s.total_cost * 1_000_000) / 1_000_000,
      })),
    });
  } catch {
    return apiInternalError();
  }
}
