// =============================================================================
// SSO Configuration
// SAML 2.0 Single Sign-On configuration for the LR AI Hub
// =============================================================================

// ---------------------------------------------------------------------------
// Feature Flag
// ---------------------------------------------------------------------------

/**
 * SSO is disabled by default. Set NEXT_PUBLIC_SSO_ENABLED=true in .env.local
 * to enable the SSO login button on the login page.
 */
export const SSO_ENABLED: boolean =
  process.env.NEXT_PUBLIC_SSO_ENABLED === "true";

/**
 * Returns whether SSO is currently enabled.
 * Reads from the NEXT_PUBLIC_SSO_ENABLED environment variable.
 */
export function isSSOEnabled(): boolean {
  return SSO_ENABLED;
}

// ---------------------------------------------------------------------------
// SSO Domain Configuration
// ---------------------------------------------------------------------------

/**
 * Represents a configured SSO domain mapping.
 * Each entry maps an email domain to a specific SSO provider configuration.
 */
export interface SSODomainConfig {
  /** The email domain that triggers SSO login (e.g. "beispiel-firma.de") */
  domain: string;

  /** Human-readable label shown in the UI (e.g. "Beispiel Firma AG") */
  label: string;

  /** Whether this SSO domain mapping is currently active */
  enabled: boolean;
}

/**
 * Configuration for the SSO feature.
 */
export interface SSOConfig {
  /** Whether SSO is globally enabled */
  enabled: boolean;

  /**
   * Configured SSO domains. When empty, the user can enter any domain
   * and Supabase will check if an SSO provider exists for that domain.
   * When populated, only listed domains are shown/allowed.
   */
  domains: SSODomainConfig[];

  /** Placeholder text for the SSO domain input field */
  domainInputPlaceholder: string;

  /** Label for the SSO login button */
  buttonLabel: string;
}

/**
 * Default SSO configuration.
 * Override by modifying this config or extending via environment variables.
 */
export const ssoConfig: SSOConfig = {
  enabled: SSO_ENABLED,
  domains: [],
  domainInputPlaceholder: "firma.de",
  buttonLabel: "Mit SSO anmelden",
};
