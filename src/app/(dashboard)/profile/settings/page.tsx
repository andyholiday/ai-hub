// =============================================================================
// Profile Settings Page
// Edit form for user profile fields: full_name, bio, department, position
// =============================================================================

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ProfileData {
  id: string;
  full_name: string | null;
  bio: string | null;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
}

interface FormState {
  full_name: string;
  bio: string;
  department: string;
  position: string;
}

interface FieldErrors {
  full_name?: string;
  bio?: string;
  department?: string;
  position?: string;
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-surface-200" />
      <Card className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-surface-200" />
            <div className="h-10 w-full rounded-lg bg-surface-200" />
          </div>
        ))}
        <div className="h-10 w-32 rounded-lg bg-surface-200" />
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState<FormState>({
    full_name: "",
    bio: "",
    department: "",
    position: "",
  });

  // --- Fetch current profile on mount ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/profile");
      const json = await res.json();

      if (json.error || !json.data) {
        setError(json.error?.message ?? "Profil konnte nicht geladen werden.");
        return;
      }

      const p: ProfileData = json.data.profile;
      setForm({
        full_name: p.full_name ?? "",
        bio: p.bio ?? "",
        department: p.department ?? "",
        position: p.position ?? "",
      });
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Handle field changes ---
  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Clear success message on further edits
    if (success) setSuccess(false);
  }

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Build payload: only send non-empty fields
      const payload: Record<string, string> = {};
      if (form.full_name.trim()) payload.full_name = form.full_name.trim();
      if (form.bio.trim()) payload.bio = form.bio.trim();
      if (form.department.trim()) payload.department = form.department.trim();
      if (form.position.trim()) payload.position = form.position.trim();

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.error) {
        // Handle validation errors from Zod
        if (json.error.details) {
          const errors: FieldErrors = {};
          for (const [key, messages] of Object.entries(json.error.details)) {
            if (key in form) {
              errors[key as keyof FieldErrors] = (messages as string[])[0];
            }
          }
          setFieldErrors(errors);
        }
        setError(json.error.message);
        return;
      }

      setSuccess(true);
      // eslint-disable-next-line no-console
      console.log("[ProfileSettings] Profil erfolgreich aktualisiert:", json.data);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  // --- Loading ---
  if (loading) {
    return <SettingsSkeleton />;
  }

  // --- Error on initial load ---
  if (error && !form.full_name && !form.bio && !form.department && !form.position) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center py-12">
          <p className="text-body text-surface-500">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={fetchProfile}
          >
            Erneut versuchen
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="sm" iconLeft={<ArrowLeftIcon />}>
            Zurueck
          </Button>
        </Link>
        <h1 className="font-heading text-headline font-bold text-surface-900">
          Profil-Einstellungen
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <Input
            label="Vollstaendiger Name"
            placeholder="Dein Name"
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            error={fieldErrors.full_name}
            maxLength={100}
            fullWidth
          />

          {/* Position */}
          <Input
            label="Position"
            placeholder="z.B. Sales Manager"
            value={form.position}
            onChange={(e) => handleChange("position", e.target.value)}
            error={fieldErrors.position}
            maxLength={100}
            fullWidth
          />

          {/* Department */}
          <Input
            label="Abteilung"
            placeholder="z.B. Vertrieb"
            value={form.department}
            onChange={(e) => handleChange("department", e.target.value)}
            error={fieldErrors.department}
            maxLength={100}
            fullWidth
          />

          {/* Bio (textarea-like using Input) */}
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-surface-700">
              Bio
            </label>
            <textarea
              className={`
                w-full rounded-xl border bg-white px-3.5 py-2.5
                text-body text-surface-900 placeholder:text-surface-400
                transition-colors duration-150
                focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20
                ${fieldErrors.bio ? "border-error" : "border-surface-300"}
              `}
              placeholder="Erzaehle etwas ueber dich..."
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className="flex items-center justify-between">
              {fieldErrors.bio ? (
                <p className="text-caption text-error">{fieldErrors.bio}</p>
              ) : (
                <span />
              )}
              <p className="text-caption text-surface-400">
                {form.bio.length}/500
              </p>
            </div>
          </div>

          {/* Success / Error Messages */}
          {success && (
            <div className="rounded-xl bg-lr-green-50 border border-lr-green-200 px-4 py-3 text-body-sm text-lr-green-700">
              Profil erfolgreich aktualisiert!
            </div>
          )}
          {error && !success && (
            <div className="rounded-xl bg-error-light border border-red-200 px-4 py-3 text-body-sm text-error">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              iconLeft={<SaveIcon />}
              disabled={saving}
            >
              {saving ? "Wird gespeichert..." : "Aenderungen speichern"}
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="md" type="button">
                Abbrechen
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
