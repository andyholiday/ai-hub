"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useBrandingStore } from "@/stores/branding-store";
import { isSSOEnabled, ssoConfig } from "@/config/sso";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [ssoDomain, setSsoDomain] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const { branding, hydrate } = useBrandingStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  async function handleSSOLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSsoLoading(true);

    const supabase = createClient();

    const { error: ssoError } = await supabase.auth.signInWithSSO({
      domain: ssoDomain,
    });

    if (ssoError) {
      setError(ssoError.message);
      setSsoLoading(false);
    }
    // On success, the browser is redirected to the IdP automatically
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check if user is approved
    if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", authData.user.id)
        .single();

      if (profile && !(profile as { is_approved: boolean }).is_approved) {
        await supabase.auth.signOut();
        setError("Dein Account wurde noch nicht von einem Administrator freigegeben.");
        setLoading(false);
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Anmelden
        </h1>
        <p className="mt-2 text-sm text-surface-500">
          {branding.loginSubtext}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
              placeholder="Dein Passwort"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-brand-primary-600 hover:text-brand-primary-700"
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-700 disabled:opacity-50"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        {isSSOEnabled() && (
          <>
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-surface-400">oder</span>
              </div>
            </div>

            <form className="mt-6" onSubmit={handleSSOLogin}>
              <label
                htmlFor="sso-domain"
                className="block text-sm font-medium text-surface-700"
              >
                SSO Domain
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="sso-domain"
                  type="text"
                  required
                  value={ssoDomain}
                  onChange={(e) => setSsoDomain(e.target.value)}
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
                  placeholder={ssoConfig.domainInputPlaceholder}
                />
                <button
                  type="submit"
                  disabled={ssoLoading}
                  className="shrink-0 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50"
                >
                  {ssoLoading ? "Wird weitergeleitet..." : ssoConfig.buttonLabel}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-surface-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-brand-primary-600 hover:text-brand-primary-700">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
