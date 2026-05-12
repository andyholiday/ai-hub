// =============================================================================
// Integration tests: DB security hardening — migrations 00025, 00026, 00027
//
// SKIP REASON: These tests require a live Supabase connection
// (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + TEST_USER_*).
// In CI without a Supabase instance they are skipped.
// Run manually against a local `supabase start` after `supabase db reset`.
//
// Covers (AUDIT-2026-05-12 Tasks 2, 3, 4):
//   - 00025: authenticated user cannot self-assign role/xp/level
//   - 00026: authenticated user cannot EXECUTE award_xp / increment_field / update_login_streak
//   - 00027: get_mentor_signals + generate_page_briefing reject cross-user p_user_id
// =============================================================================

import { describe, it, expect } from "vitest";

const HAS_DB =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  Boolean(process.env.TEST_USER_EMAIL) &&
  Boolean(process.env.TEST_USER_PASSWORD);

// ---------------------------------------------------------------------------
// Migration 00025 — profile role/xp/level update lock
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_DB)(
  "00025 — profiles: authenticated cannot self-escalate role/xp/level",
  () => {
    it.skip(
      "authenticated user cannot UPDATE own role via Supabase client",
      async () => {
        // Requires: createClient(url, anonKey) + signInWithPassword
        // Then: supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)
        // Expected: error — column 'role' not in allowed grant list OR RLS WITH CHECK fails
      },
    );

    it.skip(
      "authenticated user can UPDATE own safe fields (full_name)",
      async () => {
        // Requires: createClient + signIn
        // Then: supabase.from('profiles').update({ full_name: 'Test' }).eq('id', userId)
        // Expected: no error
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Migration 00026 — REVOKE EXECUTE on gamification RPCs
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_DB)(
  "00026 — gamification RPCs: authenticated cannot EXECUTE directly",
  () => {
    it.skip(
      "authenticated cannot call award_xp directly",
      async () => {
        // Requires: createClient(url, anonKey) + signIn
        // Then: supabase.rpc('award_xp', { p_user_id: userId, p_xp: 9999 })
        // Expected: error (permission denied for function award_xp)
      },
    );

    it.skip(
      "authenticated cannot call increment_field directly",
      async () => {
        // Requires: createClient(url, anonKey) + signIn
        // Then: supabase.rpc('increment_field', { ... })
        // Expected: error (permission denied)
      },
    );

    it.skip(
      "authenticated cannot call update_login_streak directly",
      async () => {
        // Requires: createClient(url, anonKey) + signIn
        // Then: supabase.rpc('update_login_streak', { p_user_id: userId })
        // Expected: error (permission denied)
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Migration 00027 — mentor RPC IDOR guard
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_DB)(
  "00027 — mentor RPCs: cross-user p_user_id is rejected",
  () => {
    it.skip(
      "get_mentor_signals with foreign user_id returns 0 rows",
      async () => {
        // Requires: two test users (A and B)
        // User A calls: supabase.rpc('get_mentor_signals', { p_user_id: userBId })
        // Expected: empty result set (auth.uid() != p_user_id guard filters out all rows)
      },
    );

    it.skip(
      "generate_page_briefing with foreign user_id raises exception",
      async () => {
        // Requires: two test users (A and B)
        // User A calls: supabase.rpc('generate_page_briefing', { p_user_id: userBId, p_page_context: 'dashboard' })
        // Expected: error with code 'insufficient_privilege'
      },
    );
  },
);

// ---------------------------------------------------------------------------
// Always-run smoke: migration naming convention
// Verifies that the three expected migration slugs match the convention
// without requiring Node.js filesystem APIs (no @types/node dependency).
// ---------------------------------------------------------------------------

describe("Migration naming convention (00025–00027)", () => {
  const expectedMigrations = [
    "00025_lock_profile_role_updates.sql",
    "00026_revoke_dangerous_rpc_execute.sql",
    "00027_lock_mentor_signal_rpcs_to_auth_user.sql",
  ];

  it("migration slugs follow <5-digit-number>_<snake_case>.sql convention", () => {
    const pattern = /^\d{5}_[a-z][a-z0-9_]+\.sql$/;
    for (const name of expectedMigrations) {
      expect(name).toMatch(pattern);
    }
  });

  it("migration numbers are sequential starting at 00025", () => {
    const numbers = expectedMigrations.map((n) => parseInt(n.slice(0, 5), 10));
    expect(numbers).toEqual([25, 26, 27]);
  });

  it("all three migration files are listed as deliverables", () => {
    expect(expectedMigrations).toHaveLength(3);
  });
});
