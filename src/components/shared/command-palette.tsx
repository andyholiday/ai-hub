"use client";

// =============================================================================
// CommandPalette — Global Cmd/Ctrl+K Command Palette
// Two modes:
//   1. Quick navigation — static allowlisted routes
//   2a. Hybrid search — POST /api/search/hybrid (debounced 200ms) [default]
//   2b. Local search — in-browser 384-d cosine search [privacy-mode]
//
// When privacy-mode is ON, queries never leave the browser (Pattern P4.1).
// Security: only allowlisted internal paths are ever pushed via router.push.
// Degrades gracefully if hybrid-search endpoint returns 403/disabled.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Trophy,
  Zap,
  Lightbulb,
  Star,
  MessageSquare,
  User,
  Settings,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { getLocalSearchIndex } from "@/lib/search/local-search";
import type { LocalCorpusItem } from "@/lib/search/local-search";

// ---------------------------------------------------------------------------
// Local search corpus — best-practice titles/excerpts for privacy-mode index.
// Must be kept in sync with the demo data in best-practices/page.tsx.
// 384-d vectors only — never compared against the 1536-d pgvector server index.
// ---------------------------------------------------------------------------

const LOCAL_CORPUS: readonly LocalCorpusItem[] = [
  {
    id: "1",
    title: "ChatGPT-Prompts fuer Social Media Content",
    content: "Erfahre, wie du mit gezielten Prompt-Techniken fesselnde Social Media Posts erstellst. Von Instagram Captions bis LinkedIn Artikel -- diese Best Practice zeigt dir bewaehrte Prompt-Strukturen fuer maximales Engagement.",
  },
  {
    id: "2",
    title: "KI-Automatisierung im Kundenservice",
    content: "Wie KI-gestuetzte Automatisierung den Kundenservice revolutioniert. Lerne, wie Chatbots und automatische E-Mail-Klassifizierung die Antwortzeiten um 60% reduzieren und die Kundenzufriedenheit steigern.",
  },
  {
    id: "3",
    title: "Datenanalyse mit Claude fuer Vertriebsberichte",
    content: "Nutze die analytischen Faehigkeiten von Claude, um komplexe Vertriebsdaten in aussagekraeftige Berichte zu verwandeln. Schritt-fuer-Schritt Anleitung mit Beispiel-Prompts und Vorlagen fuer Quartalsberichte.",
  },
  {
    id: "4",
    title: "Ethische Richtlinien fuer den KI-Einsatz im Unternehmen",
    content: "Ein umfassender Leitfaden zu den ethischen Grundsaetzen beim Einsatz von KI in unserem Unternehmen. Von Datenschutz ueber Transparenz bis hin zu fairer Nutzung -- diese Best Practice definiert den Rahmen fuer verantwortungsvollen KI-Einsatz.",
  },
  {
    id: "5",
    title: "Top 10 KI-Tools fuer Marketer 2026",
    content: "Die besten KI-Tools fuer das Marketing-Team: Von Text-Generierung ueber Bildbearbeitung bis zur Analyse. Jedes Tool wird mit konkreten Anwendungsfaellen vorgestellt und bewertet.",
  },
  {
    id: "6",
    title: "Midjourney-Prompts fuer Produktbilder",
    content: "Erstelle professionelle Produktbilder mit Midjourney. Diese Best Practice enthaelt bewaehrte Prompt-Formeln, Stil-Referenzen und Nachbearbeitungstipps fuer Produkte im E-Commerce und Social Media.",
  },
] as const;

// ---------------------------------------------------------------------------
// Navigation allowlist — STRICT: only these paths may be pushed
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  keywords?: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, keywords: "home start" },
  { label: "Community", path: "/community", icon: <Users className="h-4 w-4" />, keywords: "forum posts" },
  { label: "Learn Hub", path: "/learn-hub", icon: <BookOpen className="h-4 w-4" />, keywords: "lernen kurse" },
  { label: "Challenges", path: "/challenges", icon: <Trophy className="h-4 w-4" />, keywords: "aufgaben wettbewerb" },
  { label: "Leaderboard", path: "/leaderboard", icon: <Zap className="h-4 w-4" />, keywords: "rangliste punkte xp" },
  { label: "Innovation Radar", path: "/innovation-radar", icon: <Lightbulb className="h-4 w-4" />, keywords: "trends technologie" },
  { label: "Best Practices", path: "/best-practices", icon: <Star className="h-4 w-4" />, keywords: "artikel wissen" },
  { label: "AI Mentor", path: "/ai-mentor", icon: <MessageSquare className="h-4 w-4" />, keywords: "chat assistent ki" },
  { label: "Profil", path: "/profile", icon: <User className="h-4 w-4" />, keywords: "konto benutzer" },
  { label: "Einstellungen", path: "/settings", icon: <Settings className="h-4 w-4" />, keywords: "optionen konfiguration" },
] as const;

/** The set of allowed internal path prefixes for search result navigation. */
const ALLOWED_PATH_PREFIXES: readonly string[] = [
  "/dashboard",
  "/community",
  "/learn-hub",
  "/challenges",
  "/leaderboard",
  "/innovation-radar",
  "/best-practices",
  "/ai-mentor",
  "/profile",
  "/settings",
];

/**
 * Returns true if `path` is a safe internal path we are willing to push.
 * Blocks external URLs, open-redirect attempts, and unknown prefixes.
 */
function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  // Must be a relative path starting with /
  if (!path.startsWith("/")) return false;
  // Must not contain a protocol (e.g. //evil.com or javascript:)
  if (/^\/\//.test(path)) return false;
  // Must match an allowlisted prefix
  return ALLOWED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// ---------------------------------------------------------------------------
// Search result type from /api/search/hybrid
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  // local-loading: privacy-mode, model still initializing
  | { status: "local-loading" }
  | { status: "results"; items: SearchResult[] }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "disabled" };

// ---------------------------------------------------------------------------
// CommandPalette Component
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const privacyMode = usePrivacyMode();

  // When privacy-mode is on, pre-build the local index so the model is ready.
  useEffect(() => {
    if (!privacyMode) return;
    const idx = getLocalSearchIndex();
    if (!idx) return;
    // Build is idempotent — safe to call without awaiting here; errors are
    // handled inside the index itself (status -> 'error').
    void idx.build([...LOCAL_CORPUS]);
  }, [privacyMode]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchState({ status: "idle" });
    }
  }, [open]);

  // Debounced search — switches between local (privacy-mode) and server paths
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length === 0) {
      setSearchState({ status: "idle" });
      return;
    }

    if (privacyMode) {
      // ---------- Privacy-mode: local 384-d index, no network request ----------
      const idx = getLocalSearchIndex();
      if (!idx) {
        // SSR guard — should never happen in a 'use client' component
        setSearchState({ status: "error", message: "Lokale Suche nicht verfuegbar." });
        return;
      }

      if (idx.indexStatus === "loading") {
        setSearchState({ status: "local-loading" });
      } else {
        setSearchState({ status: "loading" });
      }

      debounceRef.current = setTimeout(() => {
        idx
          .search(query.trim(), 8)
          .then((results) => {
            const items: SearchResult[] = results.map((r) => ({
              id: r.id,
              title: r.title,
              content: r.content,
              score: r.score,
            }));
            setSearchState(items.length > 0 ? { status: "results", items } : { status: "empty" });
          })
          .catch(() => {
            setSearchState({ status: "error", message: "Lokale Suche fehlgeschlagen." });
          });
      }, 200);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    // ---------- Default path: server hybrid search ----------
    setSearchState({ status: "loading" });

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetch("/api/search/hybrid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), topK: 8 }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (res.status === 403) {
            setSearchState({ status: "disabled" });
            return;
          }
          if (!res.ok) {
            setSearchState({ status: "error", message: "Suche fehlgeschlagen." });
            return;
          }
          const json = (await res.json()) as {
            data?: { results?: SearchResult[] };
            error?: { message?: string };
          };
          const items = json.data?.results ?? [];
          setSearchState(items.length > 0 ? { status: "results", items } : { status: "empty" });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          setSearchState({ status: "error", message: "Suche fehlgeschlagen." });
        });
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, privacyMode]);

  const navigate = useCallback(
    (path: string) => {
      if (!isSafeInternalPath(path)) return;
      onOpenChange(false);
      router.push(path);
    },
    [onOpenChange, router],
  );

  const showSearch =
    searchState.status === "loading" ||
    searchState.status === "local-loading" ||
    searchState.status === "results" ||
    searchState.status === "empty" ||
    searchState.status === "error" ||
    searchState.status === "disabled";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Globale Suche und Navigation"
      // Overlay
      overlayClassName={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      )}
      // Dialog panel
      className={cn(
        "fixed left-1/2 top-[20vh] z-50 w-full max-w-xl -translate-x-1/2",
        "overflow-hidden rounded-2xl shadow-2xl",
        "border border-surface-200 dark:border-surface-700",
        "bg-white dark:bg-surface-900",
      )}
    >
      {/* Search input row */}
      <div className="flex items-center gap-3 border-b border-surface-200 px-4 py-3 dark:border-surface-700">
        <Search className="h-4 w-4 shrink-0 text-surface-400" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Suchen oder navigieren..."
          className={cn(
            "flex-1 bg-transparent text-[14px] text-surface-900 placeholder:text-surface-400",
            "outline-none dark:text-surface-50",
          )}
        />
        {(searchState.status === "loading" || searchState.status === "local-loading") && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-surface-400"
            aria-label={searchState.status === "local-loading" ? "KI-Modell wird geladen..." : "Suche laeuft..."}
          />
        )}
        <kbd
          className={cn(
            "hidden rounded px-1.5 py-0.5 text-[11px] font-medium sm:block",
            "border border-surface-200 bg-surface-100 text-surface-500",
            "dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400",
          )}
        >
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[400px] overflow-y-auto p-2">
        {/* Empty command list message */}
        <Command.Empty className="py-6 text-center text-[13px] text-surface-500 dark:text-surface-400">
          Keine Treffer gefunden.
        </Command.Empty>

        {/* Navigation items — always shown */}
        {(!showSearch || searchState.status === "disabled") && (
          <Command.Group heading="Navigation" className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider [&>[cmdk-group-heading]]:text-surface-400">
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.path}
                value={`${item.label} ${item.keywords ?? ""}`}
                onSelect={() => navigate(item.path)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px]",
                  "text-surface-700 dark:text-surface-300",
                  "data-[selected=true]:bg-surface-100 data-[selected=true]:text-surface-900",
                  "dark:data-[selected=true]:bg-surface-800 dark:data-[selected=true]:text-surface-50",
                  "transition-colors duration-100",
                )}
              >
                <span className="text-surface-400 dark:text-surface-500">{item.icon}</span>
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* Search results */}
        {searchState.status === "results" && (
          <Command.Group heading="Suchergebnisse" className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-[11px] [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider [&>[cmdk-group-heading]]:text-surface-400">
            {searchState.items.map((result) => (
              <Command.Item
                key={result.id}
                value={result.title}
                onSelect={() => navigate(`/best-practices/${result.id}`)}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-xl px-3 py-2.5",
                  "text-surface-700 dark:text-surface-300",
                  "data-[selected=true]:bg-surface-100 data-[selected=true]:text-surface-900",
                  "dark:data-[selected=true]:bg-surface-800 dark:data-[selected=true]:text-surface-50",
                  "transition-colors duration-100",
                )}
              >
                <span className="text-[13.5px] font-medium">{result.title}</span>
                <span className="line-clamp-1 text-[12px] text-surface-500 dark:text-surface-400">
                  {result.content.slice(0, 100)}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {/* Local model loading state */}
        {searchState.status === "local-loading" && (
          <div className="py-6 text-center text-[13px] text-surface-500 dark:text-surface-400">
            KI-Modell wird geladen (einmalig)...
          </div>
        )}

        {/* Empty results state */}
        {searchState.status === "empty" && (
          <div className="py-8 text-center text-[13px] text-surface-500 dark:text-surface-400">
            Keine Ergebnisse fuer &ldquo;{query}&rdquo;.
          </div>
        )}

        {/* Error state */}
        {searchState.status === "error" && (
          <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-error">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {searchState.message}
          </div>
        )}

        {/* Disabled / degraded state — show nav only */}
        {searchState.status === "disabled" && (
          <div className="px-3 py-2 text-[12px] text-surface-400 dark:text-surface-500">
            Volltextsuche nicht verfuegbar — bitte die Navigation verwenden.
          </div>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

// ---------------------------------------------------------------------------
// CommandPaletteTrigger — keyboard shortcut + open/close state
// ---------------------------------------------------------------------------

/**
 * Mounts the keyboard listener and manages open state.
 * Render once at the dashboard layout level.
 */
export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // External open events (e.g. Header button)
  useCommandPaletteExternalOpen(setOpen);

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}

// ---------------------------------------------------------------------------
// useCommandPalette — hook to open the palette from any component
// ---------------------------------------------------------------------------

// Simple module-level event bus so the Header button can open the palette
// without prop drilling or a separate context.
type Listener = (open: boolean) => void;
const listeners = new Set<Listener>();

/** Emit an open/close event to any mounted CommandPaletteTrigger. */
export function openCommandPalette() {
  listeners.forEach((l) => l(true));
}

/**
 * Subscribe to external open events.
 * Used internally by CommandPaletteTrigger.
 */
export function useCommandPaletteExternalOpen(setOpen: (v: boolean) => void) {
  useEffect(() => {
    listeners.add(setOpen);
    return () => {
      listeners.delete(setOpen);
    };
  }, [setOpen]);
}
