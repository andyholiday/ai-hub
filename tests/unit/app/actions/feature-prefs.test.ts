// =============================================================================
// Server Action: toggleFeaturePref — Unit Tests
// Tests fuer: src/app/actions/feature-prefs.ts
// Coverage-Ziel: >= 85 % auf src/app/actions/feature-prefs.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks — must use vi.hoisted so variables are available when
// vi.mock factory runs (vi.mock calls are hoisted to the top of the file).
// ---------------------------------------------------------------------------

const { mockGetUser, mockSetUserFeaturePref, mockRevalidatePath } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSetUserFeaturePref: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/features/user-prefs', () => ({
  setUserFeaturePref: mockSetUserFeaturePref,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { toggleFeaturePref } from '@/app/actions/feature-prefs';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function mockAuth(userId: string) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function mockAuthFail() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'unauthenticated' } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('toggleFeaturePref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { success: true } for valid input', async () => {
    mockAuth('user-42');
    mockSetUserFeaturePref.mockResolvedValue(undefined);

    const result = await toggleFeaturePref('leaderboard', true);

    expect(result).toEqual({ success: true });
  });

  it('calls setUserFeaturePref with correct arguments', async () => {
    mockAuth('user-42');
    mockSetUserFeaturePref.mockResolvedValue(undefined);

    await toggleFeaturePref('privacy-mode', false);

    expect(mockSetUserFeaturePref).toHaveBeenCalledWith(
      'user-42',
      'privacy-mode',
      false,
    );
  });

  it('calls revalidatePath after successful mutation', async () => {
    mockAuth('user-42');
    mockSetUserFeaturePref.mockResolvedValue(undefined);

    await toggleFeaturePref('ai-mentor', true);

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('returns { success: false } when user is not authenticated', async () => {
    mockAuthFail();

    const result = await toggleFeaturePref('leaderboard', true);

    expect(result).toEqual({ success: false, error: 'Not authenticated' });
    expect(mockSetUserFeaturePref).not.toHaveBeenCalled();
  });

  it('returns { success: false } when setUserFeaturePref throws (unknown feature)', async () => {
    mockAuth('user-42');
    mockSetUserFeaturePref.mockRejectedValue(
      new Error('[feature-registry] Unknown feature ID: "bogus-id"'),
    );

    // @ts-expect-error — intentional invalid ID
    const result = await toggleFeaturePref('bogus-id', true);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unknown feature ID');
    }
  });

  it('returns { success: false } when setUserFeaturePref throws (non-toggleable)', async () => {
    mockAuth('user-42');
    mockSetUserFeaturePref.mockRejectedValue(
      new Error('[user-prefs] Feature "forum" is not user-toggleable'),
    );

    const result = await toggleFeaturePref('forum', false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not user-toggleable');
    }
  });

  it('does not call revalidatePath on failure', async () => {
    mockAuthFail();

    await toggleFeaturePref('leaderboard', true);

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
