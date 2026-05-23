// =============================================================================
// Tests: handleRoleChangeResponse (ADR-016)
// =============================================================================

import { describe, it, expect, vi } from "vitest";
import { handleRoleChangeResponse } from "@/lib/api/handle-role-change-response";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeSupabase(refreshResult: { error: null | { message: string } }) {
  return {
    auth: {
      refreshSession: vi.fn().mockResolvedValue(refreshResult),
    },
  } as unknown as SupabaseClient;
}

function makeResponse(headers: Record<string, string> = {}): Response {
  return new Response(null, { headers });
}

describe("handleRoleChangeResponse", () => {
  it("does not call refreshSession when X-Role-Changed header is absent", async () => {
    const supabase = makeSupabase({ error: null });
    const response = makeResponse();

    await handleRoleChangeResponse(response, supabase);

    expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
  });

  it("calls refreshSession and onRefreshed when X-Role-Changed is true", async () => {
    const supabase = makeSupabase({ error: null });
    const response = makeResponse({ "X-Role-Changed": "true" });
    const onRefreshed = vi.fn();

    await handleRoleChangeResponse(response, supabase, onRefreshed);

    expect(supabase.auth.refreshSession).toHaveBeenCalledOnce();
    expect(onRefreshed).toHaveBeenCalledOnce();
  });

  it("does not call onRefreshed when refreshSession returns an error", async () => {
    const supabase = makeSupabase({ error: { message: "token expired" } });
    const response = makeResponse({ "X-Role-Changed": "true" });
    const onRefreshed = vi.fn();

    await handleRoleChangeResponse(response, supabase, onRefreshed);

    expect(supabase.auth.refreshSession).toHaveBeenCalledOnce();
    expect(onRefreshed).not.toHaveBeenCalled();
  });
});
