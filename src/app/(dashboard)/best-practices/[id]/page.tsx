// =============================================================================
// Best Practice Detail Page
// Full content view with sidebar, AI summary, voting, and comments
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Star,
  Eye,
  Clock,
  Sparkles,
  Bot,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CommentSection,
  categoryConfig,
  type BestPracticeCategory,
  type CommentData,
} from "@/components/features/best-practices";
import { useAuth } from "@/hooks/use-auth";

// -----------------------------------------------------------------------------
// Category Slug Mapping: DB -> UI
// -----------------------------------------------------------------------------

const DB_TO_UI_CATEGORY: Record<string, BestPracticeCategory> = {
  prompt_engineering: "prompt-engineering",
  ai_tools: "ki-tools",
  automation: "automatisierung",
  data_analysis: "datenanalyse",
  ai_ethics: "ki-ethik",
};

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

interface ApiAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface ApiBestPracticeDetail {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  upvotes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  author_id: string;
  author: ApiAuthor;
}

// -----------------------------------------------------------------------------
// Star Rating Sub-component
// -----------------------------------------------------------------------------

function StarRating() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="rounded-sm p-0.5 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500"
          aria-label={`${star} Stern${star > 1 ? "e" : ""}`}
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors duration-150",
              (hoverRating || rating) >= star
                ? "fill-brand-accent-500 text-brand-accent-500"
                : "text-surface-300"
            )}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-caption font-medium text-surface-500">
          {rating}/5
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function BestPracticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const [data, setData] = useState<ApiBestPracticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    fetch(`/api/best-practices/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login?redirectTo=/best-practices";
          return;
        }

        const json = await res.json();
        if (json.error) {
          setError(json.error.message ?? "Fehler beim Laden");
          return;
        }
        setData(json.data);
      })
      .catch(() => {
        setError("Best Practice konnte nicht geladen werden.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm("Best Practice wirklich loeschen?")) return;

    try {
      const res = await fetch(`/api/best-practices/${data.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/best-practices");
      } else {
        const json = await res.json();
        alert(json.error?.message ?? "Loeschen fehlgeschlagen.");
      }
    } catch {
      alert("Loeschen fehlgeschlagen.");
    }
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary-500" />
      </div>
    );
  }

  // --- Not Found ---
  if (notFound) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading text-headline-sm font-bold text-surface-900">
          Best Practice nicht gefunden
        </h2>
        <p className="mt-2 text-body text-surface-500">
          Der Eintrag existiert nicht oder ist nicht oeffentlich.
        </p>
        <Link href="/best-practices" className="mt-6 inline-block">
          <Button iconLeft={<ArrowLeft />}>Zur Uebersicht</Button>
        </Link>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading text-headline-sm font-bold text-surface-900">
          Fehler beim Laden
        </h2>
        <p className="mt-2 text-body text-surface-500">{error}</p>
        <Button
          className="mt-6"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetch(`/api/best-practices/${id}`)
              .then(async (res) => {
                const json = await res.json();
                setData(json.data);
              })
              .catch(() => setError("Best Practice konnte nicht geladen werden."))
              .finally(() => setIsLoading(false));
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const uiCategory: BestPracticeCategory =
    DB_TO_UI_CATEGORY[data.category] ?? "prompt-engineering";
  const catConfig = categoryConfig[uiCategory];

  const isOwner = user?.id === data.author_id;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canEdit = isOwner || isAdmin;

  const currentUpvotes = data.upvotes_count + (isUpvoted ? 1 : 0) - (isDownvoted ? 1 : 0);

  const createdAt = new Date(data.created_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Demo comments — comment system nicht Teil dieser Wave
  const comments: CommentData[] = [];

  return (
    <div className="animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb */}
      {/* ------------------------------------------------------------------ */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-body-sm text-surface-500">
          <li>
            <Link
              href="/best-practices"
              className="flex items-center gap-1 transition-colors hover:text-brand-primary-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Best Practices
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
          </li>
          <li>
            <span className="text-surface-400">{catConfig.label}</span>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-surface-300" />
          </li>
          <li>
            <span className="font-medium text-surface-700 truncate max-w-[200px] inline-block align-bottom">
              {data.title}
            </span>
          </li>
        </ol>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Main Layout: Content + Sidebar */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Main Content */}
        <div className="min-w-0 flex-1">
          {/* Header Card */}
          <Card noPadding>
            <div className="p-6 sm:p-8">
              {/* Category Badge + Owner Actions */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant={catConfig.variant} size="md" dot>
                    {catConfig.label}
                  </Badge>
                  {data.status === "draft" && (
                    <Badge variant="gray" size="sm">
                      Entwurf
                    </Badge>
                  )}
                </div>

                {/* Edit / Delete — nur fuer Owner/Admin */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Link href={`/best-practices/${data.id}/edit`}>
                      <Button variant="ghost" size="sm" iconLeft={<Pencil />}>
                        Bearbeiten
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Trash2 />}
                      onClick={handleDelete}
                      className="text-error hover:bg-error-light hover:text-error-dark"
                    >
                      Loeschen
                    </Button>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-headline-sm font-bold text-surface-900 sm:text-headline">
                {data.title}
              </h1>

              {/* Author Info */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={data.author?.full_name ?? ""}
                    src={data.author?.avatar_url}
                    size="md"
                  />
                  <div>
                    <p className="text-body font-semibold text-surface-800">
                      {data.author?.full_name ?? "Unbekannt"}
                    </p>
                    <p className="text-body-sm text-surface-500">
                      Level {data.author?.level ?? 1}
                    </p>
                  </div>
                </div>

                {/* Meta: Date, Views */}
                <div className="flex items-center gap-4 text-body-sm text-surface-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {data.views_count} Views
                  </span>
                </div>
              </div>
            </div>

            {/* Content Area with Prose Styling */}
            <div className="border-t border-surface-200 p-6 sm:p-8">
              <div className="prose prose-surface max-w-none prose-headings:font-heading prose-headings:text-surface-900 prose-h2:text-title-lg prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-title prose-h3:font-semibold prose-p:text-body-lg prose-p:text-surface-700 prose-p:leading-relaxed prose-strong:text-surface-800 prose-code:rounded prose-code:bg-surface-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-body-sm prose-code:text-brand-primary-700 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:bg-surface-900 prose-pre:p-4 prose-table:border-collapse prose-th:bg-surface-50 prose-th:p-3 prose-th:text-left prose-th:text-body-sm prose-th:font-semibold prose-td:border-t prose-td:border-surface-200 prose-td:p-3 prose-td:text-body-sm prose-blockquote:border-l-brand-primary-500 prose-blockquote:bg-brand-primary-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:not-italic prose-a:text-brand-primary-600 prose-a:no-underline hover:prose-a:underline prose-li:text-body-lg prose-li:text-surface-700">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content ?? "") }} />
              </div>
            </div>
          </Card>

          {/* XP Reward Banner */}
          <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-brand-primary-200 bg-brand-primary-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-body font-semibold text-brand-primary-800">
                +50 XP fuer das Lesen dieser Best Practice
              </p>
              <p className="text-body-sm text-brand-primary-600">
                Lese weitere Best Practices, um dein Level zu steigern.
              </p>
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection comments={comments} />
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="w-full shrink-0 lg:w-[360px]">
          <div className="sticky top-6 space-y-5">
            {/* Summary Card (excerpt als Zusammenfassung) */}
            {data.excerpt && (
              <Card accent="green" noPadding>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary-50">
                      <Bot className="h-4 w-4 text-brand-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-surface-900">
                        Zusammenfassung
                      </h3>
                    </div>
                  </div>
                  <p className="text-body-sm leading-relaxed text-surface-600">
                    {data.excerpt}
                  </p>
                </div>
              </Card>
            )}

            {/* Voting Card */}
            <Card noPadding>
              <div className="p-5">
                <h3 className="text-body font-semibold text-surface-900 mb-4">
                  Bewertung
                </h3>

                {/* Upvote / Downvote */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsUpvoted(!isUpvoted);
                      if (isDownvoted) setIsDownvoted(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-200",
                      isUpvoted
                        ? "border-brand-primary-500 bg-brand-primary-50 text-brand-primary-700"
                        : "border-surface-300 text-surface-500 hover:border-brand-primary-300 hover:bg-brand-primary-50 hover:text-brand-primary-600"
                    )}
                    aria-label="Upvote"
                  >
                    <ThumbsUp
                      className={cn("h-4 w-4", isUpvoted && "fill-current")}
                    />
                    <span className="text-body-sm font-semibold">
                      {currentUpvotes}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDownvoted(!isDownvoted);
                      if (isUpvoted) setIsUpvoted(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-200",
                      isDownvoted
                        ? "border-error bg-error-light text-error-dark"
                        : "border-surface-300 text-surface-500 hover:border-red-300 hover:bg-error-light hover:text-error"
                    )}
                    aria-label="Downvote"
                  >
                    <ThumbsDown
                      className={cn("h-4 w-4", isDownvoted && "fill-current")}
                    />
                  </button>
                </div>

                {/* Star Rating */}
                <div className="mt-4 pt-4 border-t border-surface-200">
                  <p className="text-body-sm font-medium text-surface-600 mb-2">
                    Wie hilfreich war dieser Beitrag?
                  </p>
                  <StarRating />
                </div>
              </div>
            </Card>

            {/* Tags Card */}
            {data.tags && data.tags.length > 0 && (
              <Card noPadding>
                <div className="p-5">
                  <h3 className="text-body font-semibold text-surface-900 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-lg bg-surface-100 px-3 py-1.5 text-body-sm font-medium text-surface-600 transition-colors hover:bg-surface-200 cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
