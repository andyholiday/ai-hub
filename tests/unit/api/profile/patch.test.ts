// =============================================================================
// Tests: PATCH /api/profile
// Covers: onboarding XP (C-05), department bonus (M-03), idempotency
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — factories use vi.fn() inline to avoid hoisting issues
// ---------------------------------------------------------------------------

vi.mock("@/lib/api/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/validators/profile", () => ({
  updateProfileSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("@/lib/gamification/xp", () => ({
  awardCommunityXP: vi.fn(),
  awardXP: vi.fn(),
  XP_ACTIONS: {
    DEPARTMENT_SET: { action: "department_set", amount: 25 },
  },
}));

vi.mock("@/lib/gamification/badges", () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports after mocks (vi.mocked gives typed access to the fns above)
// ---------------------------------------------------------------------------

import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileSchema } from "@/lib/validators/profile";
import { awardCommunityXP, awardXP } from "@/lib/gamification/xp";
import { PATCH } from "@/app/api/profile/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function buildSupabaseMock(opts: {
  previousRow: { onboarding_completed: boolean; department: string | null } | null;
  updateResult?: Record<string, unknown>;
}) {
  const {
    previousRow,
    updateResult = { id: "user-1", onboarding_completed: true, department: null },
  } = opts;

  let profileCallCount = 0;
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      profileCallCount++;
      if (profileCallCount === 1) {
        // First call: maybeSingle() for previous state
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: previousRow, error: null }),
            }),
          }),
        };
      }
      // Second call: update chain
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updateResult, error: null }),
            }),
          }),
        }),
      };
    }
    return {};
  });

  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

  return { from, rpc } as unknown as ReturnType<typeof createAdminClient>;
}

const USER_ID = "user-patch-test-1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ userId: USER_ID, role: "user" } as never);
  vi.mocked(awardCommunityXP).mockResolvedValue(null);
  vi.mocked(awardXP).mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// Tests: Onboarding XP (C-05)
// ---------------------------------------------------------------------------

describe("PATCH /api/profile — onboarding XP (C-05)", () => {
  it("awards 50 XP when onboarding_completed transitions false → true", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { onboarding_completed: true },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: false, department: null },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    const xpResult = { newXP: 50, newLevel: 1, leveledUp: false };
    vi.mocked(awardCommunityXP).mockResolvedValue(xpResult);

    const res = await PATCH(makeRequest({ onboarding_completed: true }));
    const json = await res.json();

    expect(vi.mocked(awardCommunityXP)).toHaveBeenCalledWith(
      supabase,
      USER_ID,
      "COMPLETE_ONBOARDING",
    );
    expect(json.data.xp_awarded).toEqual(xpResult);
  });

  it("awards XP when previous profile row is null (new user — C-05 null guard)", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { onboarding_completed: true },
    } as never);

    const supabase = buildSupabaseMock({ previousRow: null });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    vi.mocked(awardCommunityXP).mockResolvedValue({ newXP: 50, newLevel: 1, leveledUp: false });

    await PATCH(makeRequest({ onboarding_completed: true }));

    expect(vi.mocked(awardCommunityXP)).toHaveBeenCalled();
  });

  it("does NOT award XP when onboarding_completed was already true", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { onboarding_completed: true },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: true, department: null },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    await PATCH(makeRequest({ onboarding_completed: true }));

    expect(vi.mocked(awardCommunityXP)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: Department bonus (M-03)
// ---------------------------------------------------------------------------

describe("PATCH /api/profile — department bonus (M-03)", () => {
  it("awards 25 XP when department is set for the first time", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { department: "Marketing" },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: true, department: null },
      updateResult: { id: USER_ID, department: "Marketing" },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    const xpResult = { newXP: 25, newLevel: 1, leveledUp: false };
    vi.mocked(awardXP).mockResolvedValue(xpResult);

    const res = await PATCH(makeRequest({ department: "Marketing" }));
    const json = await res.json();

    expect(vi.mocked(awardXP)).toHaveBeenCalledWith(
      supabase,
      USER_ID,
      "department_set",
      25,
      "department_set",
    );
    expect(json.data.xp_department).toEqual(xpResult);
  });

  it("does NOT award department XP when department was already set", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { department: "Vertrieb" },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: true, department: "Marketing" },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    await PATCH(makeRequest({ department: "Vertrieb" }));

    expect(vi.mocked(awardXP)).not.toHaveBeenCalled();
  });

  it("awards both onboarding (50) and department (25) XP in a single PATCH", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { onboarding_completed: true, department: "IT" },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: false, department: null },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    const onboardingXp = { newXP: 50, newLevel: 1, leveledUp: false };
    const departmentXp = { newXP: 75, newLevel: 1, leveledUp: false };
    vi.mocked(awardCommunityXP).mockResolvedValue(onboardingXp);
    vi.mocked(awardXP).mockResolvedValue(departmentXp);

    const res = await PATCH(makeRequest({ onboarding_completed: true, department: "IT" }));
    const json = await res.json();

    expect(vi.mocked(awardCommunityXP)).toHaveBeenCalled();
    expect(vi.mocked(awardXP)).toHaveBeenCalled();
    expect(json.data.xp_awarded).toEqual(onboardingXp);
    expect(json.data.xp_department).toEqual(departmentXp);
  });

  it("second PATCH with same department returns xp_department=null (DB idempotency)", async () => {
    vi.mocked(updateProfileSchema.safeParse).mockReturnValue({
      success: true,
      data: { department: "IT" },
    } as never);

    const supabase = buildSupabaseMock({
      previousRow: { onboarding_completed: true, department: "IT" },
    });
    vi.mocked(createAdminClient).mockReturnValue(supabase);

    const res = await PATCH(makeRequest({ department: "IT" }));
    const json = await res.json();

    expect(vi.mocked(awardXP)).not.toHaveBeenCalled();
    expect(json.data.xp_department).toBeNull();
  });
});
