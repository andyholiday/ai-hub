"use client";

// =============================================================================
// Admin Branding Tab
// Allows admins to switch between branding presets or customise individual
// branding fields. Includes a live sidebar-logo preview.
// =============================================================================

import { useState, useEffect } from "react";
import { Palette, Check, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBrandingStore } from "@/stores/branding-store";
import {
  BRANDING_PRESETS,
  type BrandingPresetId,
} from "@/config/branding";

// ---------------------------------------------------------------------------
// Preset Metadata (for the selection cards)
// ---------------------------------------------------------------------------

const PRESET_CARDS: {
  id: BrandingPresetId;
  label: string;
  logoText: string;
  gradientClass: string;
}[] = [
  {
    id: "appmanufaktor",
    label: "AppManufaktor",
    logoText: "AM",
    gradientClass: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    id: "lr",
    label: "LR Health & Beauty",
    logoText: "LR",
    gradientClass: "bg-brand-gradient",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminBrandingTab() {
  const {
    branding,
    activePresetId,
    isHydrated,
    hydrate,
    applyPreset,
    updateBranding,
    saveBranding,
  } = useBrandingStore();

  // Local form state (mirrors store, submitted on save)
  const [form, setForm] = useState(branding);
  const [saved, setSaved] = useState(false);

  // Hydrate store from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Sync local form when store branding changes (e.g. preset switch)
  useEffect(() => {
    setForm(branding);
  }, [branding]);

  // --- Handlers ---

  const handlePreset = (id: BrandingPresetId) => {
    applyPreset(id);
    setSaved(false);
  };

  const handleFieldChange = (
    field: keyof typeof form,
    value: string,
  ) => {
    const next = { ...form, [field]: value };
    setForm(next);
    updateBranding(next);
    setSaved(false);
  };

  const handleSave = () => {
    saveBranding();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    applyPreset("appmanufaktor");
    setSaved(false);
  };

  if (!isHydrated) {
    return null; // avoid flash before localStorage is read
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* ----------------------------------------------------------------- */}
      {/* Section 1: Preset-Auswahl                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-[14px] border border-surface-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-[3px] rounded-sm bg-brand-primary-500" />
          <Palette className="h-4 w-4 text-surface-500" />
          <h3 className="font-display text-base font-semibold text-surface-900">
            Branding-Preset
          </h3>
        </div>

        <p className="mb-4 text-[13px] text-surface-500">
          Waehle ein vorgefertigtes Branding-Profil oder passe die Werte
          unten manuell an.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRESET_CARDS.map((preset) => {
            const isActive = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset.id)}
                className={cn(
                  "relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150",
                  isActive
                    ? "border-brand-primary-500 bg-brand-primary-50/50 shadow-sm"
                    : "border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm",
                )}
              >
                {/* Logo preview square */}
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]",
                    preset.gradientClass,
                  )}
                >
                  <span className="font-display text-[14px] font-bold leading-none text-white">
                    {preset.logoText}
                  </span>
                </div>

                {/* Label */}
                <div className="flex-1">
                  <span className="text-[13px] font-semibold text-surface-900">
                    {preset.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-surface-400">
                    {BRANDING_PRESETS[preset.id].description}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2: Benutzerdefinierte Einstellungen                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-[14px] border border-surface-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-[3px] rounded-sm bg-brand-primary-500" />
          <h3 className="font-display text-base font-semibold text-surface-900">
            Benutzerdefinierte Einstellungen
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* App-Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              App-Name
            </label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => handleFieldChange("appName", e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="z.B. AI Hub"
            />
          </div>

          {/* App-Untertitel */}
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              App-Untertitel
            </label>
            <input
              type="text"
              value={form.appSubtitle}
              onChange={(e) =>
                handleFieldChange("appSubtitle", e.target.value)
              }
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="z.B. Community Platform"
            />
          </div>

          {/* Firmenname */}
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Firmenname
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                handleFieldChange("companyName", e.target.value)
              }
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="z.B. AppManufaktor"
            />
          </div>

          {/* Logo-Text */}
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Logo-Text
            </label>
            <input
              type="text"
              maxLength={3}
              value={form.logoText}
              onChange={(e) =>
                handleFieldChange("logoText", e.target.value)
              }
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="z.B. AM (max. 3 Zeichen)"
            />
          </div>

          {/* Login-Text */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Login-Text
            </label>
            <input
              type="text"
              value={form.loginSubtext}
              onChange={(e) =>
                handleFieldChange("loginSubtext", e.target.value)
              }
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="Text auf der Login-Seite"
            />
          </div>

          {/* Beschreibung */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Beschreibung
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                handleFieldChange("description", e.target.value)
              }
              className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-brand-primary-500 focus:ring-1 focus:ring-brand-primary-500"
              placeholder="App-Beschreibung"
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 3: Live-Preview                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="rounded-[14px] border border-surface-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-[3px] rounded-sm bg-brand-primary-500" />
          <h3 className="font-display text-base font-semibold text-surface-900">
            Live-Preview (Sidebar-Logo)
          </h3>
        </div>

        <div className="inline-flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 px-5 py-4">
          {/* Logo square */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
              form.logoGradient,
            )}
          >
            <span className="font-display text-[15px] font-bold leading-none text-white">
              {form.logoText || "?"}
            </span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-surface-300" />

          {/* Platform name */}
          <div className="flex flex-col">
            <span className="font-display text-[13px] font-bold leading-tight text-surface-900">
              {form.appName || "App Name"}
            </span>
            <span className="text-[11px] leading-tight text-surface-500">
              {form.appSubtitle || "Subtitle"}
            </span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Actions                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium text-white transition-colors",
            saved
              ? "bg-brand-primary-500"
              : "bg-brand-primary-600 hover:bg-brand-primary-700",
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Gespeichert
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Branding speichern
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 font-medium text-surface-600 transition-colors hover:bg-surface-50"
        >
          <RotateCcw className="h-4 w-4" />
          Auf Standard zuruecksetzen
        </button>
      </div>
    </div>
  );
}
