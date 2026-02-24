// =============================================================================
// Best Practice Detail Page
// Full content view with sidebar, AI summary, voting, and comments
// =============================================================================

"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  CommentSection,
  categoryConfig,
  type BestPracticeCategory,
  type CommentData,
} from "@/components/features/best-practices";

// -----------------------------------------------------------------------------
// Demo Data for the Detail Page
// -----------------------------------------------------------------------------

interface DetailBestPractice {
  id: string;
  title: string;
  category: BestPracticeCategory;
  author: {
    name: string;
    avatarUrl?: string | null;
    department: string;
    level: number;
  };
  createdAt: string;
  readTime: string;
  views: number;
  upvotes: number;
  downvotes: number;
  tags: string[];
  content: string;
  aiSummary: string;
  xpReward: number;
  isFeatured: boolean;
}

interface SimilarBP {
  id: string;
  title: string;
  category: BestPracticeCategory;
  upvotes: number;
}

const demoDetail: DetailBestPractice = {
  id: "1",
  title: "ChatGPT-Prompts fuer Social Media Content",
  category: "prompt-engineering",
  author: {
    name: "Markus Koenig",
    department: "Marketing",
    level: 5,
  },
  createdAt: "15. Februar 2026",
  readTime: "8 Min.",
  views: 312,
  upvotes: 24,
  downvotes: 2,
  tags: ["ChatGPT", "Social Media", "Content", "Prompts", "Marketing"],
  xpReward: 50,
  isFeatured: true,
  aiSummary:
    "Diese Best Practice beschreibt 5 bewaehrte Prompt-Strukturen fuer Social Media Content: die AIDA-Methode, Storytelling-Prompts, Engagement-Booster, Brand-Voice-Anpassung und Content-Recycling. Jede Methode wird mit konkreten ChatGPT-Prompts und Beispielergebnissen dokumentiert. Kernaussage: Strukturierte Prompts erzeugen konsistent hochwertigeren Content als freie Eingaben.",
  content: `## Warum gute Prompts den Unterschied machen

In der taeglichen Arbeit mit ChatGPT fuer Social Media Content ist die Qualitaet der Prompts entscheidend fuer die Qualitaet der Ergebnisse. Diese Best Practice fasst die Erkenntnisse aus 6 Monaten intensiver Nutzung im Marketing-Team zusammen.

## 1. Die AIDA-Methode als Prompt-Struktur

Die bewaehrte AIDA-Formel (Attention, Interest, Desire, Action) laesst sich hervorragend als Prompt-Struktur nutzen:

\`\`\`
Erstelle einen Instagram-Post fuer [Produkt].
- Attention: Starte mit einer ueberraschenden Statistik oder Frage
- Interest: Beschreibe das Problem, das das Produkt loest
- Desire: Zeige den emotionalen Nutzen
- Action: Schliesse mit einem klaren Call-to-Action
Tonalitaet: Freundlich, motivierend, authentische Markenstimme
Laenge: Max. 150 Woerter
\`\`\`

**Ergebnis**: Posts mit dieser Struktur erzielten im Schnitt 34% mehr Engagement als unstrukturierte Prompts.

## 2. Storytelling-Prompts

Geschichten erzeugen Emotionen und bleiben im Gedaechtnis. Nutze diesen Prompt-Baukasten:

\`\`\`
Erzaehle die Geschichte von [Persona], die [Problem] hatte.
Beschreibe den Wendepunkt durch [Produkt/Loesung].
Verwende eine persoenliche, authentische Sprache.
Integriere 2-3 Emojis natuerlich in den Text.
Format: LinkedIn-Post, max. 200 Woerter
\`\`\`

## 3. Engagement-Booster Prompts

Fuer maximale Interaktion empfehlen wir folgende Prompt-Elemente:

- **Fragen am Ende**: "Was ist dein liebstes KI-Tool fuer Content?"
- **Meinungsabfragen**: "Stimmt ihr zu? Ja oder Nein?"
- **Erfahrungsaustausch**: "Teilt eure besten Tipps in den Kommentaren"

## 4. Brand Voice Anpassung

Damit ChatGPT die Markenstimme trifft, nutzen wir einen vordefinierten System-Kontext:

\`\`\`
Du schreibst als Content Creator fuer die Community-Plattform.
Markenstimme: Positiv, motivierend, gesundheitsbewusst
Werte: Qualitaet, Gemeinschaft, persoenliches Wachstum
Vermeide: Uebertreibungen, medizinische Versprechen, Negativitaet
Zielgruppe: Health-bewusste Menschen, 25-45 Jahre
\`\`\`

## 5. Content-Recycling

Bestehende Inhalte lassen sich mit KI effizient fuer verschiedene Plattformen umformatieren:

| Quellformat | Zielformat | Prompt-Ansatz |
|------------|-----------|--------------|
| Blog-Artikel | Twitter-Thread | "Fasse in 5 Tweets zusammen" |
| Webinar | LinkedIn-Post | "Extrahiere die 3 Kern-Learnings" |
| Kundenfeedback | Instagram Story | "Erstelle ein Testimonial-Visual-Script" |

## Fazit

Investiert Zeit in die Entwicklung eurer Prompt-Bibliothek. Die initialen 2-3 Stunden sparen euch langfristig dutzende Stunden an Content-Erstellung und steigern gleichzeitig die Qualitaet.

> **Pro-Tipp**: Speichert eure besten Prompts in einem geteilten Dokument, damit das gesamte Team davon profitiert.`,
};

const demoSimilar: SimilarBP[] = [
  {
    id: "6",
    title: "Midjourney-Prompts fuer Produktbilder",
    category: "ki-tools",
    upvotes: 28,
  },
  {
    id: "3",
    title: "Datenanalyse mit Claude fuer Vertriebsberichte",
    category: "datenanalyse",
    upvotes: 18,
  },
  {
    id: "5",
    title: "Top 10 KI-Tools fuer Marketer 2026",
    category: "ki-tools",
    upvotes: 35,
  },
];

const demoComments: CommentData[] = [
  {
    id: "c1",
    author: { name: "Sarah Hoffmann" },
    text: "Super hilfreiche Zusammenstellung! Die AIDA-Methode funktioniert bei uns im Team wirklich hervorragend. Wir haben damit die Engagement-Rate auf Instagram um fast 40% gesteigert.",
    createdAt: "vor 2 Tagen",
    upvotes: 7,
    replies: [
      {
        id: "c1-r1",
        author: { name: "Markus Koenig" },
        text: "Danke Sarah! Freut mich sehr. Die 40% sind beeindruckend -- koenntet ihr die Daten mal im naechsten Team-Meeting vorstellen?",
        createdAt: "vor 1 Tag",
        upvotes: 3,
      },
    ],
  },
  {
    id: "c2",
    author: { name: "Thomas Wagner" },
    text: "Fuer den Vertrieb nutzen wir aehnliche Strukturen. Besonders der Brand Voice Teil ist Gold wert. Koennte man das vielleicht als Template in einem gemeinsamen Tool hinterlegen?",
    createdAt: "vor 3 Tagen",
    upvotes: 5,
    replies: [],
  },
  {
    id: "c3",
    author: { name: "Lisa Peters" },
    text: "Hat jemand Erfahrung mit den Engagement-Booster Prompts fuer LinkedIn im B2B-Bereich? Bei uns im Kundenservice sind die Anforderungen etwas anders.",
    createdAt: "vor 5 Tagen",
    upvotes: 2,
    replies: [
      {
        id: "c3-r1",
        author: { name: "Julia Richter" },
        text: "Wir haben im B2B-Bereich gute Erfahrungen mit Thought-Leadership Prompts gemacht. Soll ich dazu eine separate Best Practice schreiben?",
        createdAt: "vor 4 Tagen",
        upvotes: 4,
      },
      {
        id: "c3-r2",
        author: { name: "Lisa Peters" },
        text: "Ja bitte, das waere super! Gerne auch mit konkreten Beispielen aus dem Kundenservice-Umfeld.",
        createdAt: "vor 4 Tagen",
        upvotes: 1,
      },
    ],
  },
];

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
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const data = demoDetail;
  const catConfig = categoryConfig[data.category];

  const handleUpvote = () => {
    setIsUpvoted(!isUpvoted);
    if (isDownvoted) setIsDownvoted(false);
  };

  const handleDownvote = () => {
    setIsDownvoted(!isDownvoted);
    if (isUpvoted) setIsUpvoted(false);
  };

  const currentUpvotes = data.upvotes + (isUpvoted ? 1 : 0) - (isDownvoted ? 1 : 0);

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
              {/* Category + Featured Badge */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={catConfig.variant} size="md" dot>
                  {catConfig.label}
                </Badge>
                {data.isFeatured && (
                  <Badge variant="gold" size="sm">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-headline-sm font-bold text-surface-900 sm:text-headline">
                {data.title}
              </h1>

              {/* Author Info */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={data.author.name} size="md" />
                  <div>
                    <p className="text-body font-semibold text-surface-800">
                      {data.author.name}
                    </p>
                    <p className="text-body-sm text-surface-500">
                      {data.author.department} &middot; Level {data.author.level}
                    </p>
                  </div>
                </div>

                {/* Meta: Date, Read Time, Views */}
                <div className="flex items-center gap-4 text-body-sm text-surface-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {data.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {data.readTime} Lesezeit
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {data.views} Views
                  </span>
                </div>
              </div>
            </div>

            {/* Content Area with Prose Styling */}
            <div className="border-t border-surface-200 p-6 sm:p-8">
              <div className="prose prose-surface max-w-none prose-headings:font-heading prose-headings:text-surface-900 prose-h2:text-title-lg prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-title prose-h3:font-semibold prose-p:text-body-lg prose-p:text-surface-700 prose-p:leading-relaxed prose-strong:text-surface-800 prose-code:rounded prose-code:bg-surface-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-body-sm prose-code:text-brand-primary-700 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:bg-surface-900 prose-pre:p-4 prose-table:border-collapse prose-th:bg-surface-50 prose-th:p-3 prose-th:text-left prose-th:text-body-sm prose-th:font-semibold prose-td:border-t prose-td:border-surface-200 prose-td:p-3 prose-td:text-body-sm prose-blockquote:border-l-brand-primary-500 prose-blockquote:bg-brand-primary-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:not-italic prose-a:text-brand-primary-600 prose-a:no-underline hover:prose-a:underline prose-li:text-body-lg prose-li:text-surface-700">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(data.content)) }} />
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
                +{data.xpReward} XP fuer das Lesen dieser Best Practice
              </p>
              <p className="text-body-sm text-brand-primary-600">
                Lese weitere Best Practices, um dein Level zu steigern.
              </p>
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection comments={demoComments} />
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="w-full shrink-0 lg:w-[360px]">
          <div className="sticky top-6 space-y-5">
            {/* AI Summary Card */}
            <Card accent="green" noPadding>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary-50">
                    <Bot className="h-4 w-4 text-brand-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-body font-semibold text-surface-900">
                      AI Zusammenfassung
                    </h3>
                    <p className="text-caption text-surface-400">
                      Generiert von AI Mentor
                    </p>
                  </div>
                </div>
                <p className="text-body-sm leading-relaxed text-surface-600">
                  {data.aiSummary}
                </p>
              </div>
            </Card>

            {/* Voting Card */}
            <Card noPadding>
              <div className="p-5">
                <h3 className="text-body font-semibold text-surface-900 mb-4">
                  Bewertung
                </h3>

                {/* Upvote / Downvote */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUpvote}
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
                    onClick={handleDownvote}
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

            {/* Similar Best Practices */}
            <Card noPadding>
              <div className="p-5">
                <h3 className="text-body font-semibold text-surface-900 mb-4">
                  Aehnliche Best Practices
                </h3>
                <div className="space-y-3">
                  {demoSimilar.map((item) => {
                    const simCatConfig = categoryConfig[item.category];
                    return (
                      <Link
                        key={item.id}
                        href={`/best-practices/${item.id}`}
                        className="group/similar block rounded-xl border border-surface-200 p-3 transition-all duration-200 hover:border-surface-300 hover:shadow-card"
                      >
                        <Badge variant={simCatConfig.variant} size="sm">
                          {simCatConfig.label}
                        </Badge>
                        <p className="mt-2 text-body-sm font-medium text-surface-800 group-hover/similar:text-brand-primary-600 transition-colors">
                          {item.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-caption text-surface-400">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{item.upvotes} Upvotes</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Simple Markdown to HTML converter (basic, for demo purposes)
// In production this would use remark/rehype or a proper Markdown library
// -----------------------------------------------------------------------------

function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre><code>${escapeHtml(code.trim())}</code></pre>`
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  // Tables
  html = html.replace(
    /\n(\|.+\|\n)+/g,
    (tableBlock) => {
      const rows = tableBlock.trim().split("\n").filter((r) => !r.match(/^\|[\s-|]+\|$/));
      if (rows.length === 0) return tableBlock;

      const headerCells = rows[0]!.split("|").filter(Boolean).map((c) => c.trim());
      const bodyRows = rows.slice(1);

      let tableHtml = "<table><thead><tr>";
      headerCells.forEach((cell) => {
        tableHtml += `<th>${cell}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";
      bodyRows.forEach((row) => {
        const cells = row.split("|").filter(Boolean).map((c) => c.trim());
        tableHtml += "<tr>";
        cells.forEach((cell) => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</tbody></table>";
      return "\n" + tableHtml + "\n";
    }
  );

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(
    /(<li>.*<\/li>\n?)+/g,
    (match) => `<ul>${match}</ul>`
  );

  // Paragraphs - wrap lines that aren't already wrapped in tags
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<blockquote")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
