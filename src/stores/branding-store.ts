// =============================================================================
// Branding Store
// Client-side branding state powered by Zustand v5.
// Persists to localStorage so the active branding survives page reloads.
// =============================================================================

import { create } from "zustand";
import {
  BRANDING_APPMANUFAKTOR,
  BRANDING_PRESETS,
  type BrandingConfig,
  type BrandingPresetId,
} from "@/config/branding";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "lr-ai-hub-branding";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandingState {
  /** The currently active branding configuration. */
  branding: BrandingConfig;
  /** The id of the currently applied preset (null if custom). */
  activePresetId: BrandingPresetId | null;
  /** Whether the store has been hydrated from localStorage. */
  isHydrated: boolean;

  /** Load branding from localStorage (call once on mount). */
  hydrate: () => void;
  /** Apply a preset by id, replacing all branding values. */
  applyPreset: (id: BrandingPresetId) => void;
  /** Merge partial updates into the current branding. */
  updateBranding: (partial: Partial<BrandingConfig>) => void;
  /** Persist the current branding to localStorage. */
  saveBranding: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): {
  branding: BrandingConfig;
  presetId: BrandingPresetId | null;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      branding?: BrandingConfig;
      presetId?: BrandingPresetId | null;
    };

    if (parsed.branding) {
      return {
        branding: { ...BRANDING_APPMANUFAKTOR, ...parsed.branding },
        presetId: parsed.presetId ?? null,
      };
    }
  } catch {
    // Corrupted data – fall through to default
  }

  return null;
}

function saveToStorage(
  branding: BrandingConfig,
  presetId: BrandingPresetId | null,
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ branding, presetId }),
    );
  } catch {
    // Storage full or unavailable – silently fail
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: { ...BRANDING_APPMANUFAKTOR },
  activePresetId: "appmanufaktor",
  isHydrated: false,

  hydrate: () => {
    if (get().isHydrated) return;

    const stored = loadFromStorage();
    if (stored) {
      set({
        branding: stored.branding,
        activePresetId: stored.presetId,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  applyPreset: (id) => {
    const preset = BRANDING_PRESETS[id];
    if (!preset) return;

    set({ branding: { ...preset }, activePresetId: id });
    saveToStorage({ ...preset }, id);
  },

  updateBranding: (partial) => {
    const next = { ...get().branding, ...partial };
    set({ branding: next, activePresetId: null });
  },

  saveBranding: () => {
    const { branding, activePresetId } = get();
    saveToStorage(branding, activePresetId);
  },
}));
