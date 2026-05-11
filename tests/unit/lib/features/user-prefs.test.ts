// =============================================================================
// User Feature Preferences — Unit Tests
// Tests fuer: src/lib/features/user-prefs.ts
// Coverage-Ziel: >= 85 % auf src/lib/features/user-prefs.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase admin client
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Chain helpers — reset per test
function setupFromChain(result: { data: unknown; error: unknown }) {
  mockEq.mockResolvedValue(result);
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
}

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { getUserFeaturePrefs, setUserFeaturePref } from '@/lib/features/user-prefs';

// ---------------------------------------------------------------------------
// getUserFeaturePrefs
// ---------------------------------------------------------------------------

describe('getUserFeaturePrefs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns registry defaults when DB has no rows', async () => {
    setupFromChain({ data: [], error: null });

    const prefs = await getUserFeaturePrefs('user-1');

    // leaderboard has defaultEnabled: true
    expect(prefs['leaderboard']).toBe(true);
    // privacy-mode has defaultEnabled: false
    expect(prefs['privacy-mode']).toBe(false);
  });

  it('merges DB row over registry default', async () => {
    setupFromChain({
      data: [{ feature_id: 'leaderboard', is_enabled: false }],
      error: null,
    });

    const prefs = await getUserFeaturePrefs('user-1');

    // DB row overrides registry default (true -> false)
    expect(prefs['leaderboard']).toBe(false);
  });

  it('ignores unknown feature_ids from DB', async () => {
    setupFromChain({
      data: [{ feature_id: 'non-existent-feature', is_enabled: true }],
      error: null,
    });

    const prefs = await getUserFeaturePrefs('user-1');
    // Should not throw and non-existent key should not appear
    expect(Object.prototype.hasOwnProperty.call(prefs, 'non-existent-feature')).toBe(false);
  });

  it('throws when Supabase returns an error', async () => {
    setupFromChain({ data: null, error: { message: 'DB connection failed' } });

    await expect(getUserFeaturePrefs('user-1')).rejects.toThrow(
      'DB connection failed',
    );
  });

  it('calls select with eq filter on user_id', async () => {
    setupFromChain({ data: [], error: null });

    await getUserFeaturePrefs('user-abc');

    expect(mockSelect).toHaveBeenCalledWith('feature_id, is_enabled');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-abc');
  });
});

// ---------------------------------------------------------------------------
// setUserFeaturePref
// ---------------------------------------------------------------------------

describe('setUserFeaturePref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws for unknown feature ID', async () => {
    await expect(
      setUserFeaturePref(
        'user-1',
        // @ts-expect-error — intentional invalid ID
        'totally-unknown-id',
        true,
      ),
    ).rejects.toThrow('totally-unknown-id');
  });

  it('throws when feature is not user-toggleable', async () => {
    // 'forum' has userToggleable: false
    await expect(
      setUserFeaturePref('user-1', 'forum', true),
    ).rejects.toThrow('not user-toggleable');
  });

  it('calls upsert with correct payload for valid feature', async () => {
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    // 'leaderboard' has userToggleable: true
    await setUserFeaturePref('user-1', 'leaderboard', false);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        feature_id: 'leaderboard',
        is_enabled: false,
      }),
      { onConflict: 'user_id,feature_id' },
    );
  });

  it('throws when upsert returns an error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'unique violation' } });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await expect(
      setUserFeaturePref('user-1', 'leaderboard', true),
    ).rejects.toThrow('unique violation');
  });

  it('resolves without throwing on success', async () => {
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await expect(
      setUserFeaturePref('user-1', 'ai-mentor', false),
    ).resolves.toBeUndefined();
  });
});
