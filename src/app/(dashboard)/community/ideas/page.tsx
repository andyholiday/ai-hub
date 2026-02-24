"use client";

// =============================================================================
// Idea Board Page
// Dedicated page showing community posts of type "idea" in a board/grid layout.
// Accessible via /community/ideas
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IdeaBoard } from "@/components/features/community/idea-board";
import { Lightbulb, Plus, ArrowLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { IdeaPost } from "@/components/features/community/idea-card";

// ---------------------------------------------------------------------------
// Create Idea Form (inline)
// ---------------------------------------------------------------------------

function CreateIdeaForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (post: IdeaPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type: "idea", tags }),
      });

      const json = await res.json();

      if (json.error) {
        setFormError(json.error.message);
        return;
      }

      onCreated(json.data);
    } catch {
      setFormError("Idee konnte nicht erstellt werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card accent="gold">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand-accent-500" />
          <h2 className="font-heading text-title-sm font-semibold text-surface-900">
            Neue Idee einreichen
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titel der Idee"
          placeholder="Was ist deine Idee?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label
            htmlFor="idea-content"
            className="mb-1.5 block text-body-sm font-medium text-surface-700"
          >
            Beschreibung
          </label>
          <textarea
            id="idea-content"
            className="w-full rounded-[10px] border border-surface-300 bg-white px-3.5 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:border-brand-primary-500 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20"
            rows={5}
            placeholder="Beschreibe deine Idee im Detail. Was ist das Problem? Welche Loesung schlaeaegst du vor?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <Input
          label="Tags"
          placeholder="KI, Automatisierung, Tools (kommagetrennt)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          hint="Maximal 10 Tags, kommagetrennt"
        />

        {formError && (
          <p className="text-caption font-medium text-error">{formError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Idee einreichen
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IdeasPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIdeaCreated = (_newIdea: IdeaPost) => {
    setShowCreateForm(false);
    // Trigger re-fetch by changing the key on IdeaBoard
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Back to Community */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-body-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zur Community
      </Link>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent-50">
            <Lightbulb className="h-6 w-6 text-brand-accent-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Ideen-Board
            </h1>
            <p className="mt-0.5 text-body-sm text-surface-500">
              Entdecke und bewerte Ideen aus der Community
            </p>
          </div>
        </div>
        <Button
          iconLeft={<Plus />}
          onClick={() => setShowCreateForm(true)}
        >
          Neue Idee einreichen
        </Button>
      </div>

      {/* Create Idea Form */}
      {showCreateForm && (
        <CreateIdeaForm
          onClose={() => setShowCreateForm(false)}
          onCreated={handleIdeaCreated}
        />
      )}

      {/* Idea Board */}
      <IdeaBoard key={refreshKey} onRequestCreate={() => setShowCreateForm(true)} />
    </div>
  );
}
