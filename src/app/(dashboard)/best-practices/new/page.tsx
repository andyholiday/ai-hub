// =============================================================================
// New Best Practice Page
// Form to create a new Best Practice with live preview
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Save,
  Send,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  categoryConfig,
  type BestPracticeCategory,
} from "@/components/features/best-practices";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FormData {
  title: string;
  category: BestPracticeCategory | "";
  content: string;
  tags: string[];
}

// -----------------------------------------------------------------------------
// Category Options for Select
// -----------------------------------------------------------------------------

const categoryOptions: { value: BestPracticeCategory; label: string }[] = [
  { value: "prompt-engineering", label: "Prompt Engineering" },
  { value: "ki-tools", label: "KI-Tools" },
  { value: "automatisierung", label: "Automatisierung" },
  { value: "datenanalyse", label: "Datenanalyse" },
  { value: "ki-ethik", label: "KI-Ethik" },
];

// -----------------------------------------------------------------------------
// Tag Input Sub-component
// -----------------------------------------------------------------------------

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body-sm font-medium text-surface-700">Tags</label>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-[10px] border border-surface-300 bg-white px-3 py-2.5",
          "transition-all duration-200",
          "focus-within:border-lr-green-500 focus-within:ring-2 focus-within:ring-lr-green-500/20"
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-lr-green-50 px-2.5 py-1 text-body-sm font-medium text-lr-green-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-sm p-0.5 text-lr-green-500 transition-colors hover:bg-lr-green-100 hover:text-lr-green-700"
              aria-label={`Tag "${tag}" entfernen`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Tags hinzufuegen (Enter zum Bestaetigen)" : "Weiterer Tag..."}
          className="min-w-[120px] flex-1 border-none bg-transparent text-body-sm text-surface-900 outline-none placeholder:text-surface-400"
        />
      </div>
      <p className="text-caption text-surface-400">
        Druecke Enter, um einen Tag hinzuzufuegen
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function NewBestPracticePage() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    content: "",
    tags: [],
  });
  const [showPreview, setShowPreview] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    formData.title.trim() !== "" &&
    formData.category !== "" &&
    formData.content.trim() !== "";

  return (
    <div className="animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-6">
        <Link
          href="/best-practices"
          className="inline-flex items-center gap-1.5 text-body-sm text-surface-500 transition-colors hover:text-lr-green-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurueck zu Best Practices
        </Link>

        <h1 className="mt-3 font-heading text-headline-sm font-bold text-surface-900 sm:text-headline">
          Neue Best Practice erstellen
        </h1>
        <p className="mt-1 text-body text-surface-500">
          Teile dein Wissen und hilf der Community, KI besser einzusetzen.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Layout: Form + Preview */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Form */}
        <div className="min-w-0 flex-1">
          <Card noPadding>
            <div className="space-y-6 p-6 sm:p-8">
              {/* Title */}
              <Input
                label="Titel"
                placeholder="z.B. Die besten ChatGPT-Prompts fuer Marketing"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                size="lg"
              />

              {/* Category Select */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="category-select"
                  className="text-body-sm font-medium text-surface-700"
                >
                  Kategorie
                </label>
                <select
                  id="category-select"
                  value={formData.category}
                  onChange={(e) =>
                    updateField("category", e.target.value as BestPracticeCategory | "")
                  }
                  className={cn(
                    "h-10 w-full rounded-[10px] border border-surface-300 bg-white px-3.5",
                    "text-body text-surface-900",
                    "transition-all duration-200 ease-out",
                    "focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20",
                    !formData.category && "text-surface-400"
                  )}
                >
                  <option value="" disabled>
                    Kategorie waehlen...
                  </option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Textarea */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="content-textarea"
                  className="text-body-sm font-medium text-surface-700"
                >
                  Inhalt
                </label>
                <textarea
                  id="content-textarea"
                  value={formData.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Beschreibe deine Best Practice im Detail. Du kannst Markdown verwenden fuer Formatierungen (## Ueberschriften, **Fett**, `Code`, etc.)."
                  rows={16}
                  className={cn(
                    "w-full resize-y rounded-[10px] border border-surface-300 bg-white px-3.5 py-3",
                    "font-mono text-body text-surface-900 placeholder:text-surface-400",
                    "transition-all duration-200 ease-out",
                    "focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
                  )}
                />
                <p className="text-caption text-surface-400">
                  Markdown-Formatierung wird unterstuetzt
                </p>
              </div>

              {/* Tags */}
              <TagInput
                tags={formData.tags}
                onChange={(tags) => updateField("tags", tags)}
              />

              {/* XP Info */}
              <div className="flex items-center gap-3 rounded-xl border border-lr-green-200 bg-lr-green-50 p-4">
                <Sparkles className="h-5 w-5 shrink-0 text-lr-green-600" />
                <p className="text-body-sm text-lr-green-700">
                  Du erhaeltst <strong>+50 XP</strong> fuer das Veroeffentlichen einer Best Practice.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3 border-t border-surface-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <Button
                variant="ghost"
                iconLeft={<Save />}
              >
                Als Entwurf speichern
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  iconLeft={<Eye />}
                  onClick={() => setShowPreview(!showPreview)}
                  className="lg:hidden"
                >
                  Vorschau
                </Button>
                <Button
                  iconLeft={<Send />}
                  size="lg"
                  disabled={!isValid}
                >
                  Veroeffentlichen
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <aside
          className={cn(
            "w-full shrink-0 lg:w-[400px]",
            // On mobile, show/hide based on toggle
            !showPreview && "hidden lg:block"
          )}
        >
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-body font-semibold text-surface-700">
                Live-Vorschau
              </h2>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<X />}
                onClick={() => setShowPreview(false)}
                className="lg:hidden"
              >
                Schliessen
              </Button>
            </div>

            {/* Preview Card */}
            <div
              className={cn(
                "rounded-[14px] border border-surface-200 bg-white shadow-card",
                "transition-all duration-300"
              )}
            >
              <div className="p-5">
                {/* Category Badge */}
                {formData.category && (
                  <div className="mb-3">
                    <Badge
                      variant={categoryConfig[formData.category].variant}
                      size="sm"
                      dot
                    >
                      {categoryConfig[formData.category].label}
                    </Badge>
                  </div>
                )}

                {/* Title */}
                <h3 className="font-heading text-[16px] font-semibold leading-snug text-surface-900">
                  {formData.title || "Dein Titel erscheint hier..."}
                </h3>

                {/* Excerpt (first 150 chars of content) */}
                <p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-surface-500">
                  {formData.content
                    ? formData.content.slice(0, 150) +
                      (formData.content.length > 150 ? "..." : "")
                    : "Dein Inhalt wird hier als Vorschau angezeigt..."}
                </p>

                {/* Author (demo) */}
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name="Sarah Hoffmann" size="sm" />
                  <div>
                    <p className="text-body-sm font-medium text-surface-800">
                      Sarah Hoffmann
                    </p>
                    <p className="text-caption text-surface-400">
                      Digital Marketing &middot; Gerade eben
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {formData.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-md bg-surface-100 px-2 py-0.5 text-overline font-medium text-surface-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Footer */}
              <div className="flex items-center gap-4 border-t border-surface-200 px-5 py-3 text-surface-400">
                <span className="text-caption">0 Upvotes</span>
                <span className="text-caption">0 Kommentare</span>
                <span className="ml-auto text-caption font-semibold text-lr-green-600">
                  +50 XP
                </span>
              </div>
            </div>

            {/* Preview Tips */}
            <div className="mt-4 rounded-xl bg-surface-50 p-4">
              <h4 className="text-body-sm font-semibold text-surface-700 mb-2">
                Tipps fuer eine gute Best Practice
              </h4>
              <ul className="space-y-1.5 text-caption text-surface-500">
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-lr-green-500" />
                  Beschreibe den konkreten Anwendungsfall
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-lr-green-500" />
                  Fuege Beispiel-Prompts oder Code-Snippets ein
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-lr-green-500" />
                  Teile messbare Ergebnisse oder Erfahrungen
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-lr-green-500" />
                  Verwende aussagekraeftige Tags fuer die Auffindbarkeit
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
