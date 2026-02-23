// =============================================================================
// Auth Store
// Global user profile state powered by Zustand v5.
// Fetches from /api/profile and caches the authenticated user's identity
// so that Sidebar, Header, and other components can display real data.
// =============================================================================

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  level: number;
  role: string;
  department: string | null;
  position: string | null;
  xp: number;
  xp_total: number;
}

interface AuthState {
  /** The authenticated user's profile (null until fetched). */
  user: UserProfile | null;
  /** True once the initial fetch has completed (success or error). */
  isLoaded: boolean;
  /** True while a fetch is in-flight. */
  isLoading: boolean;
  /** Fetch the user profile from /api/profile. */
  fetchProfile: () => Promise<void>;
  /** Clear user data (e.g. on logout). */
  clearUser: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive initials from a full name.
 * "Kathi Test" -> "KT", "Max" -> "M", null -> "?"
 */
export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]![0]?.toUpperCase() ?? "?";
  return (
    (parts[0]![0] ?? "").toUpperCase() +
    (parts[parts.length - 1]![0] ?? "").toUpperCase()
  );
}

/**
 * Derive the first name from a full name.
 * "Kathi Test" -> "Kathi", null -> null
 */
export function getFirstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoaded: false,
  isLoading: false,

  fetchProfile: async () => {
    // Prevent duplicate fetches
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const res = await fetch("/api/profile");

      if (!res.ok) {
        // 401/403 = not authenticated, leave user as null
        if (res.status === 401 || res.status === 403) {
          set({ user: null, isLoaded: true, isLoading: false });
          return;
        }
        throw new Error(`Profile fetch failed: ${res.status}`);
      }

      const json = await res.json() as {
        data?: {
          profile?: Record<string, unknown>;
        } | null;
      };

      const profile = json.data?.profile;

      if (profile) {
        set({
          user: {
            id: (profile.id as string) ?? "",
            full_name: (profile.full_name as string) ?? "User",
            email: (profile.email as string | null) ?? null,
            avatar_url: (profile.avatar_url as string | null) ?? null,
            level: (profile.level as number) ?? 1,
            role: (profile.role as string) ?? "user",
            department: (profile.department as string | null) ?? null,
            position: (profile.position as string | null) ?? null,
            xp: (profile.xp as number) ?? 0,
            xp_total: (profile.xp_total as number) ?? 0,
          },
          isLoaded: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isLoaded: true, isLoading: false });
      }
    } catch (error) {
      console.error("[auth-store] Failed to fetch profile:", error);
      set({ user: null, isLoaded: true, isLoading: false });
    }
  },

  clearUser: () => {
    set({ user: null, isLoaded: false });
  },
}));
