// =============================================================================
// useAuth Hook
// Provides authenticated user data to client components.
// Automatically triggers profile fetch on first mount if not yet loaded.
// =============================================================================

"use client";

import { useEffect } from "react";
import {
  useAuthStore,
  getInitials,
  getFirstName,
  type UserProfile,
} from "@/stores/auth-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  /** The full user profile, or null if not yet loaded / unauthenticated. */
  user: UserProfile | null;
  /** True once the initial fetch has resolved (success or failure). */
  isLoaded: boolean;
  /** True while the profile is being fetched. */
  isLoading: boolean;
  /** User's full name, e.g. "Kathi Test". Falls back to "User" if unknown. */
  displayName: string;
  /** User's first name, e.g. "Kathi". Falls back to "User". */
  firstName: string;
  /** User's initials, e.g. "KT". Falls back to "?". */
  initials: string;
  /** Re-fetch the profile from the API. */
  refetch: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const user = useAuthStore((s) => s.user);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  // Auto-fetch on first mount if the store hasn't been populated yet
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchProfile();
    }
  }, [isLoaded, isLoading, fetchProfile]);

  return {
    user,
    isLoaded,
    isLoading,
    displayName: user?.full_name ?? "User",
    firstName: getFirstName(user?.full_name) ?? "User",
    initials: getInitials(user?.full_name),
    refetch: fetchProfile,
  };
}
