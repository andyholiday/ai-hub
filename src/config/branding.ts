// =============================================================================
// Branding Configuration
// Central branding config with presets for white-label support.
// Default preset: AppManufaktor.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandingConfig {
  appName: string;
  appSubtitle: string;
  companyName: string;
  logoText: string;
  logoGradient: string;
  primaryColor: string;
  description: string;
  loginSubtext: string;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Default preset: AppManufaktor */
export const BRANDING_APPMANUFAKTOR: BrandingConfig = {
  appName: "AI Hub",
  appSubtitle: "Community Platform",
  companyName: "AppManufaktor",
  logoText: "AM",
  logoGradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
  primaryColor: "blue",
  description: "Die KI-Community-Plattform von AppManufaktor",
  loginSubtext: "Melde dich bei deinem AI Hub Konto an.",
};

/** All available presets keyed by id */
export const BRANDING_PRESETS = {
  appmanufaktor: BRANDING_APPMANUFAKTOR,
} as const;

export type BrandingPresetId = keyof typeof BRANDING_PRESETS;

// ---------------------------------------------------------------------------
// Active Branding (runtime mutable)
// ---------------------------------------------------------------------------

let activeBranding: BrandingConfig = { ...BRANDING_APPMANUFAKTOR };

/** Return the currently active branding config. */
export function getBranding(): BrandingConfig {
  return activeBranding;
}

/** Merge partial values into the active branding config. */
export function setBranding(config: Partial<BrandingConfig>) {
  activeBranding = { ...activeBranding, ...config };
}
