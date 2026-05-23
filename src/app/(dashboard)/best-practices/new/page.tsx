// =============================================================================
// New Best Practice Page
// Form to create a new Best Practice with live preview
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
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
import { createBestPracticeSchema } from "@/lib/validators/best-practice";
import { useAuth } from "@/hooks/use-auth";

// -----------------------------------------------------------------------------
// Category Options for Select
// Maps UI display values to DB category slugs used by the API
// -----------------------------------------------------------------------------

const categoryOptions: {
  uiValue: BestPracticeCategory;
  dbValue: string;
  label: string;
}[] = [
  { uiValue: "prompt-engineering", dbValue: "prompt_engineering", label: "Prompt Engineering" },
  { uiValue: "ki-tools", dbValue: "ai_tools", label: "KI-Tools" },
  { uiValue: "automatisierung", dbValue: "automation", label: "Automatisierung" },
  { uiValue: "datenanalyse", dbValue: "data_analysis", label: "Datenanalyse" },
  { uiValue: "ki-ethik", dbValue: "ai_ethics", label: "KI-Ethik" },
];

const DB_TO_UI_CATEGORY: Record<string, BestPracticeCategory> = {
  prompt_engineering: "prompt-engineering",
  ai_tools: "ki-tools",
  automation: "automatisierung",
  data_analysis: "datenanalyse",
  ai_ethics: "ki-ethik",
};

// -----------------------------------------------------------------------------
// Form State Type
// -----------------------------------------------------------------------------

interface FormState {
  title: string;
  dbCategory: string;
  summary: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
}

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
          "focus-within:border-brand-primary-500 focus-within:ring-2 focus-within:ring-brand-primary-500/20"
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-brand-primary-50 px-2.5 py-1 text-body-sm font-medium text-brand-primary-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-sm p-0.5 text-brand-primary-500 transition-colors hover:bg-brand-primary-100 hover:text-brand-primary-700"
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
          placeholder={
            tags.length === 0
              ? "Tags hinzufuegen (Enter zum Bestaetigen)"
              : "Weiterer Tag..."
          }
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
// Field Error Helper
// -----------------------------------------------------------------------------

interface FieldErrors {
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  tags?: string;
  status?: string;
  general?: string;
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function NewBestPracticePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    title: "",
    dbCategory: "",
    summary: "",
    content: "",
    tags: [],
    status: "draft",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field on change
    if (field in fieldErrors) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (statusOverride?: "draft" | "published") => {
    const submitStatus = statusOverride ?? form.status;

    // Client-side validation via shared Zod schema
    const parsed = createBestPracticeSchema.safeParse({
      title: form.title,
      summary: form.summary,
      content: form.content,
      category: form.dbCategory || "other",
      tags: form.tags,
      status: submitStatus,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as string | undefined;
        if (path === "title") errors.title = issue.message;
        else if (path === "summary") errors.summary = issue.message;
        else if (path === "content") errors.content = issue.message;
        else if (path === "category") errors.category = issue.message;
        else if (path === "tags") errors.tags = issue.message;
        else errors.general = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/best-practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();

      if (json.error) {
        // API-Validierungsfehler: Felder einzeln setzen wenn moeglich
        setFieldErrors({ general: json.error.message ?? "Fehler beim Erstellen." });
        return;
      }

      // Erfolg: zur neuen Detail-Seite navigieren
      router.push(`/best-practices/${json.data.id}`);
    } catch {
      setFieldErrors({ general: "Verbindungsfehler. Bitte erneut versuchen." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewUiCategory: BestPracticeCategory | null =
    form.dbCategory ? (DB_TO_UI_CATEGORY[form.dbCategory] ?? null) : null;

  const isFormValid =
    form.title.trim().length >= 5 &&
    form.dbCategory !== "" &&
    form.content.trim().length >= 50;

  return (
    <div className="animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-6">
        <Link
          href="/best-practices"
          className="inline-flex items-center gap-1.5 text-body-sm text-surface-500 transition-colors hover:text-brand-primary-600"
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
              {/* General Error Banner */}
              {fieldErrors.general && (
                <div className="rounded-xl border border-error bg-error-light px-4 py-3">
                  <p className="text-body-sm text-error-dark">{fieldErrors.general}</p>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Titel"
                  placeholder="z.B. Die besten ChatGPT-Prompts fuer Marketing"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  size="lg"
                />
                {fieldErrors.title && (
                  <p className="text-caption text-error">{fieldErrors.title}</p>
                )}
              </div>

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
                  value={form.dbCategory}
                  onChange={(e) => updateField("dbCategory", e.target.value)}
                  className={cn(
                    "h-10 w-full rounded-[10px] border border-surface-300 bg-white px-3.5",
                    "text-body text-surface-900",
                    "transition-all duration-200 ease-out",
                    "focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20",
                    !form.dbCategory && "text-surface-400"
                  )}
                >
                  <option value="" disabled>
                    Kategorie waehlen...
                  </option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.dbValue} value={opt.dbValue}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-caption text-error">{fieldErrors.category}</p>
                )}
              </div>

              {/* Summary Textarea */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="summary-textarea"
                  className="text-body-sm font-medium text-surface-700"
                >
                  Kurzzusammenfassung{" "}
                  <span className="text-surface-400">(optional)</span>
                </label>
                <textarea
                  id="summary-textarea"
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  placeholder="Kurze Beschreibung deiner Best Practice (max. 500 Zeichen)"
                  rows={3}
                  maxLength={500}
                  className={cn(
                    "w-full resize-y rounded-[10px] border border-surface-300 bg-white px-3.5 py-3",
                    "text-body text-surface-900 placeholder:text-surface-400",
                    "transition-all duration-200 ease-out",
                    "focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
                  )}
                />
                {fieldErrors.summary && (
                  <p className="text-caption text-error">{fieldErrors.summary}</p>
                )}
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
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Beschreibe deine Best Practice im Detail. Du kannst Markdown verwenden fuer Formatierungen (## Ueberschriften, **Fett**, `Code`, etc.)."
                  rows={16}
                  className={cn(
                    "w-full resize-y rounded-[10px] border border-surface-300 bg-white px-3.5 py-3",
                    "font-mono text-body text-surface-900 placeholder:text-surface-400",
                    "transition-all duration-200 ease-out",
                    "focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
                  )}
                />
                <p className="text-caption text-surface-400">
                  Markdown-Formatierung wird unterstuetzt (mind. 50 Zeichen)
                </p>
                {fieldErrors.content && (
                  <p className="text-caption text-error">{fieldErrors.content}</p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <TagInput
                  tags={form.tags}
                  onChange={(tags) => updateField("tags", tags)}
                />
                {fieldErrors.tags && (
                  <p className="text-caption text-error">{fieldErrors.tags}</p>
                )}
              </div>

              {/* XP Info */}
              <div className="flex items-center gap-3 rounded-xl border border-brand-primary-200 bg-brand-primary-50 p-4">
                <Sparkles className="h-5 w-5 shrink-0 text-brand-primary-600" />
                <p className="text-body-sm text-brand-primary-700">
                  Du erhaeltst <strong>+50 XP</strong> fuer das Veroeffentlichen einer Best Practice.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3 border-t border-surface-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <Button
                variant="ghost"
                disabled={isSubmitting || !form.title.trim()}
                onClick={() => handleSubmit("draft")}
                isLoading={isSubmitting && form.status === "draft"}
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
                  disabled={!isFormValid || isSubmitting}
                  isLoading={isSubmitting}
                  onClick={() => handleSubmit("published")}
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
                {previewUiCategory && (
                  <div className="mb-3">
                    <Badge
                      variant={categoryConfig[previewUiCategory].variant}
                      size="sm"
                      dot
                    >
                      {categoryConfig[previewUiCategory].label}
                    </Badge>
                  </div>
                )}

                {/* Title */}
                <h3 className="font-heading text-[16px] font-semibold leading-snug text-surface-900">
                  {form.title || "Dein Titel erscheint hier..."}
                </h3>

                {/* Excerpt */}
                <p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-surface-500">
                  {form.summary || form.content
                    ? (form.summary || form.content).slice(0, 150) +
                      ((form.summary || form.content).length > 150 ? "..." : "")
                    : "Dein Inhalt wird hier als Vorschau angezeigt..."}
                </p>

                {/* Author */}
                <div className="mt-4 flex items-center gap-3">
                  <Avatar
                    name={user?.full_name ?? "Du"}
                    src={user?.avatar_url ?? null}
                    size="sm"
                  />
                  <div>
                    <p className="text-body-sm font-medium text-surface-800">
                      {user?.full_name ?? "Du"}
                    </p>
                    <p className="text-caption text-surface-400">
                      {user?.department ?? ""} &middot; Gerade eben
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {form.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
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
                <span className="ml-auto text-caption font-semibold text-brand-primary-600">
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
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary-500" />
                  Beschreibe den konkreten Anwendungsfall
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary-500" />
                  Fuege Beispiel-Prompts oder Code-Snippets ein
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary-500" />
                  Teile messbare Ergebnisse oder Erfahrungen
                </li>
                <li className="flex items-start gap-2">
                  <Plus className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary-500" />
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
