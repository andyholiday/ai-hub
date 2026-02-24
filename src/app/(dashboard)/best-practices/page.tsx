// =============================================================================
// Best Practices Overview Page
// Grid of Best Practice cards with category filters, search, and sorting
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ArrowUpDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BestPracticeCard,
  CategoryFilter,
  type BestPracticeCardData,
  type CategoryFilterValue,
} from "@/components/features/best-practices";

// -----------------------------------------------------------------------------
// Sort Options
// -----------------------------------------------------------------------------

type SortOption = "newest" | "popular" | "upvotes";

const sortLabels: Record<SortOption, string> = {
  newest: "Neueste",
  popular: "Beliebteste",
  upvotes: "Meiste Upvotes",
};

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const demoBestPractices: BestPracticeCardData[] = [
  {
    id: "1",
    title: "ChatGPT-Prompts fuer Social Media Content",
    excerpt:
      "Erfahre, wie du mit gezielten Prompt-Techniken fesselnde Social Media Posts erstellst. Von Instagram Captions bis LinkedIn Artikel -- diese Best Practice zeigt dir bewaehrte Prompt-Strukturen fuer maximales Engagement.",
    category: "prompt-engineering",
    author: {
      name: "Markus Koenig",
      department: "Marketing",
    },
    createdAt: "15. Feb 2026",
    tags: ["ChatGPT", "Social Media", "Content"],
    upvotes: 24,
    comments: 8,
    views: 312,
    xpReward: 50,
    isFeatured: true,
  },
  {
    id: "2",
    title: "KI-Automatisierung im Kundenservice",
    excerpt:
      "Wie KI-gestuetzte Automatisierung den Kundenservice revolutioniert. Lerne, wie Chatbots und automatische E-Mail-Klassifizierung die Antwortzeiten um 60% reduzieren und die Kundenzufriedenheit steigern.",
    category: "automatisierung",
    author: {
      name: "Lisa Peters",
      department: "Kundenservice",
    },
    createdAt: "12. Feb 2026",
    tags: ["Automatisierung", "Chatbot", "Kundenservice"],
    upvotes: 31,
    comments: 12,
    views: 487,
    xpReward: 50,
    isFeatured: false,
  },
  {
    id: "3",
    title: "Datenanalyse mit Claude fuer Vertriebsberichte",
    excerpt:
      "Nutze die analytischen Faehigkeiten von Claude, um komplexe Vertriebsdaten in aussagekraeftige Berichte zu verwandeln. Schritt-fuer-Schritt Anleitung mit Beispiel-Prompts und Vorlagen fuer Quartalsberichte.",
    category: "datenanalyse",
    author: {
      name: "Thomas Wagner",
      department: "Vertrieb",
    },
    createdAt: "10. Feb 2026",
    tags: ["Claude", "Datenanalyse", "Vertrieb", "Berichte"],
    upvotes: 18,
    comments: 5,
    views: 198,
    xpReward: 50,
    isFeatured: false,
  },
  {
    id: "4",
    title: "Ethische Richtlinien fuer den KI-Einsatz im Unternehmen",
    excerpt:
      "Ein umfassender Leitfaden zu den ethischen Grundsaetzen beim Einsatz von KI in unserem Unternehmen. Von Datenschutz ueber Transparenz bis hin zu fairer Nutzung -- diese Best Practice definiert den Rahmen fuer verantwortungsvollen KI-Einsatz.",
    category: "ki-ethik",
    author: {
      name: "Julia Richter",
      department: "Compliance",
    },
    createdAt: "8. Feb 2026",
    tags: ["Ethik", "Richtlinien", "Datenschutz", "DSGVO"],
    upvotes: 42,
    comments: 15,
    views: 623,
    xpReward: 50,
    isFeatured: true,
  },
  {
    id: "5",
    title: "Top 10 KI-Tools fuer Marketer 2026",
    excerpt:
      "Die besten KI-Tools fuer das Marketing-Team: Von Text-Generierung ueber Bildbearbeitung bis zur Analyse. Jedes Tool wird mit konkreten Anwendungsfaellen vorgestellt und bewertet.",
    category: "ki-tools",
    author: {
      name: "Sarah Hoffmann",
      department: "Digital Marketing",
    },
    createdAt: "5. Feb 2026",
    tags: ["KI-Tools", "Marketing", "Produktivitaet"],
    upvotes: 35,
    comments: 9,
    views: 541,
    xpReward: 50,
    isFeatured: false,
  },
  {
    id: "6",
    title: "Midjourney-Prompts fuer Produktbilder",
    excerpt:
      "Erstelle professionelle Produktbilder mit Midjourney. Diese Best Practice enthaelt bewaehrte Prompt-Formeln, Stil-Referenzen und Nachbearbeitungstipps fuer Produkte im E-Commerce und Social Media.",
    category: "ki-tools",
    author: {
      name: "Markus Koenig",
      department: "Marketing",
    },
    createdAt: "3. Feb 2026",
    tags: ["Midjourney", "Bilder", "Produktfotografie"],
    upvotes: 28,
    comments: 7,
    views: 389,
    xpReward: 50,
    isFeatured: false,
  },
];

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function BestPracticesPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Filter and sort logic
  const filteredPractices = useMemo(() => {
    let result = demoBestPractices;

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((bp) => bp.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (bp) =>
          bp.title.toLowerCase().includes(query) ||
          bp.excerpt.toLowerCase().includes(query) ||
          bp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        // Demo data is already sorted by date, keep as-is
        break;
      case "popular":
        result = [...result].sort((a, b) => b.views - a.views);
        break;
      case "upvotes":
        result = [...result].sort((a, b) => b.upvotes - a.upvotes);
        break;
    }

    return result;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div className="animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-headline-sm font-bold text-surface-900 sm:text-headline">
            Best Practices
          </h1>
          <p className="mt-1 text-body text-surface-500">
            Entdecke bewaehrte KI-Strategien und teile dein Wissen mit der Community.
          </p>
        </div>
        <Link href="/best-practices/new">
          <Button iconLeft={<Plus />} size="lg">
            Neue Best Practice
          </Button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Category Filter */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6">
        <CategoryFilter value={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search + Sort Bar */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Best Practices durchsuchen..."
            prefixIcon={<Search />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="md"
            iconLeft={<ArrowUpDown />}
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
          >
            {sortLabels[sortBy]}
          </Button>

          {sortMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSortMenuOpen(false)}
              />
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-surface-200 bg-white py-1 shadow-elevated">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center px-4 py-2.5 text-body-sm transition-colors duration-150",
                      sortBy === option
                        ? "bg-brand-primary-50 font-semibold text-brand-primary-700"
                        : "text-surface-600 hover:bg-surface-50"
                    )}
                  >
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Results Count */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-accent-500" />
        <span className="text-body-sm text-surface-500">
          {filteredPractices.length}{" "}
          {filteredPractices.length === 1 ? "Best Practice" : "Best Practices"}{" "}
          gefunden
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Best Practices Grid */}
      {/* ------------------------------------------------------------------ */}
      {filteredPractices.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredPractices.map((bp) => (
            <BestPracticeCard key={bp.id} data={bp} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary-100 shadow-sm">
            <Sparkles className="h-8 w-8 text-brand-primary-600" />
          </div>
          <h3 className="font-heading text-title-md font-semibold text-surface-900">
            {searchQuery || activeCategory !== "all"
              ? "Keine passenden Best Practices gefunden"
              : "Noch keine Best Practices vorhanden"}
          </h3>
          <p className="mx-auto mb-6 mt-2 max-w-sm text-body text-surface-500">
            {searchQuery || activeCategory !== "all"
              ? "Versuche einen anderen Suchbegriff oder waehle eine andere Kategorie aus."
              : "Teile dein Wissen mit der Community! Erstelle die erste Best Practice und erhalte 50 XP als Belohnung."}
          </p>
          <Link href="/best-practices/new">
            <Button size="lg" iconLeft={<Plus />}>
              Best Practice erstellen
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
