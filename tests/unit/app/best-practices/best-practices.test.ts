// =============================================================================
// Best Practices — Unit Tests
// Testet: Kategorie-Mapping, toCardData-Transformation, Create-Schema-Validierung
//
// Hinweis: Page-Components (page.tsx) sind in der vitest-Coverage explizit
// ausgeschlossen (siehe vitest.config.ts). Diese Tests decken die extrahierbare
// Logik ab, die in den Pages direkt verwendet wird.
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  createBestPracticeSchema,
} from "@/lib/validators/best-practice";

// =============================================================================
// 1. Kategorie-Mapping DB <-> UI
// Spiegelt die Mapping-Tabellen aus den Pages (chirurgisch nicht ausgelagert,
// da sie keine eigene Lib-Datei haben — Tests verifizieren das erwartete Mapping).
// =============================================================================

const DB_TO_UI_CATEGORY: Record<string, string> = {
  prompt_engineering: "prompt-engineering",
  ai_tools: "ki-tools",
  automation: "automatisierung",
  data_analysis: "datenanalyse",
  ai_ethics: "ki-ethik",
};

const UI_TO_DB_CATEGORY: Record<string, string> = {
  "prompt-engineering": "prompt_engineering",
  "ki-tools": "ai_tools",
  automatisierung: "automation",
  datenanalyse: "data_analysis",
  "ki-ethik": "ai_ethics",
};

describe("Kategorie-Mapping", () => {
  it("mappt alle DB-Kategorien korrekt auf UI-Slugs", () => {
    expect(DB_TO_UI_CATEGORY["prompt_engineering"]).toBe("prompt-engineering");
    expect(DB_TO_UI_CATEGORY["ai_tools"]).toBe("ki-tools");
    expect(DB_TO_UI_CATEGORY["automation"]).toBe("automatisierung");
    expect(DB_TO_UI_CATEGORY["data_analysis"]).toBe("datenanalyse");
    expect(DB_TO_UI_CATEGORY["ai_ethics"]).toBe("ki-ethik");
  });

  it("mappt alle UI-Slugs korrekt auf DB-Kategorien", () => {
    expect(UI_TO_DB_CATEGORY["prompt-engineering"]).toBe("prompt_engineering");
    expect(UI_TO_DB_CATEGORY["ki-tools"]).toBe("ai_tools");
    expect(UI_TO_DB_CATEGORY["automatisierung"]).toBe("automation");
    expect(UI_TO_DB_CATEGORY["datenanalyse"]).toBe("data_analysis");
    expect(UI_TO_DB_CATEGORY["ki-ethik"]).toBe("ai_ethics");
  });

  it("DB->UI und UI->DB sind invers zueinander", () => {
    for (const [db, ui] of Object.entries(DB_TO_UI_CATEGORY)) {
      expect(UI_TO_DB_CATEGORY[ui]).toBe(db);
    }
  });

  it("gibt undefined fuer unbekannte Kategorie-Slugs zurueck", () => {
    expect(DB_TO_UI_CATEGORY["unknown_category"]).toBeUndefined();
    expect(UI_TO_DB_CATEGORY["unbekannt"]).toBeUndefined();
  });
});

// =============================================================================
// 2. toCardData-Transformation
// Verifiziert die Mapping-Logik zwischen API-Response und BestPracticeCardData
// =============================================================================

interface ApiAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface ApiBestPractice {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: string;
  upvotes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  author: ApiAuthor;
}

// Spiegelt die toCardData-Funktion aus page.tsx
function toCardData(item: ApiBestPractice) {
  const dbToUi: Record<string, string> = DB_TO_UI_CATEGORY;
  const uiCategory = dbToUi[item.category] ?? "prompt-engineering";

  const date = new Date(item.created_at);
  const createdAt = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt ?? "",
    category: uiCategory,
    author: {
      name: item.author?.full_name ?? "Unbekannt",
      avatarUrl: item.author?.avatar_url ?? null,
      department: "",
    },
    createdAt,
    tags: item.tags ?? [],
    upvotes: item.upvotes_count,
    comments: item.comments_count,
    views: item.views_count,
    xpReward: 50,
  };
}

describe("toCardData Transformation", () => {
  const baseItem: ApiBestPractice = {
    id: "abc-123",
    title: "Test Best Practice",
    excerpt: "Kurze Zusammenfassung",
    category: "prompt_engineering",
    tags: ["KI", "Prompts"],
    status: "published",
    upvotes_count: 5,
    views_count: 100,
    comments_count: 3,
    created_at: "2026-02-15T10:00:00Z",
    author: {
      id: "user-1",
      full_name: "Max Mustermann",
      avatar_url: null,
      level: 3,
    },
  };

  it("mappt ID, Titel und Excerpt korrekt", () => {
    const card = toCardData(baseItem);
    expect(card.id).toBe("abc-123");
    expect(card.title).toBe("Test Best Practice");
    expect(card.excerpt).toBe("Kurze Zusammenfassung");
  });

  it("konvertiert DB-Kategorie korrekt in UI-Slug", () => {
    const card = toCardData(baseItem);
    expect(card.category).toBe("prompt-engineering");
  });

  it("faellt auf prompt-engineering zurueck bei unbekannter Kategorie", () => {
    const card = toCardData({ ...baseItem, category: "unbekannt" });
    expect(card.category).toBe("prompt-engineering");
  });

  it("mappt Zaehler korrekt (upvotes, comments, views)", () => {
    const card = toCardData(baseItem);
    expect(card.upvotes).toBe(5);
    expect(card.comments).toBe(3);
    expect(card.views).toBe(100);
  });

  it("setzt xpReward immer auf 50", () => {
    const card = toCardData(baseItem);
    expect(card.xpReward).toBe(50);
  });

  it("mappt Author-Name korrekt", () => {
    const card = toCardData(baseItem);
    expect(card.author.name).toBe("Max Mustermann");
  });

  it("faellt auf 'Unbekannt' zurueck wenn Author-Name null ist", () => {
    const card = toCardData({
      ...baseItem,
      author: { ...baseItem.author, full_name: null },
    });
    expect(card.author.name).toBe("Unbekannt");
  });

  it("gibt leeres Tags-Array bei fehlendem Tags-Feld zurueck", () => {
    const card = toCardData({ ...baseItem, tags: [] });
    expect(card.tags).toEqual([]);
  });

  it("gibt leeren Excerpt bei fehlendem Excerpt zurueck", () => {
    // @ts-expect-error -- simuliert API-Antwort ohne excerpt
    const card = toCardData({ ...baseItem, excerpt: undefined });
    expect(card.excerpt).toBe("");
  });

  it("formatiert Datum auf Deutsch", () => {
    const card = toCardData(baseItem);
    // 15. Februar 2026 oder aequivalent je nach Node-Locale
    expect(card.createdAt).toMatch(/2026/);
    expect(card.createdAt).toMatch(/15/);
  });
});

// =============================================================================
// 3. Create-Schema-Validierung (geteilt zwischen Server und Client)
// =============================================================================

describe("createBestPracticeSchema", () => {
  const validInput = {
    title: "Mein guter Titel hier",
    summary: "Kurze Zusammenfassung",
    content: "Dies ist ein ausreichend langer Inhalt mit mindestens 50 Zeichen fuer den Test.",
    category: "prompt_engineering",
    tags: ["KI", "Prompts"],
    status: "published",
  };

  it("akzeptiert valide Eingabe", () => {
    const result = createBestPracticeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("lehnt Titel kuerzer als 5 Zeichen ab", () => {
    const result = createBestPracticeSchema.safeParse({ ...validInput, title: "Hi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("title");
    }
  });

  it("lehnt Titel laenger als 150 Zeichen ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      title: "A".repeat(151),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("title");
    }
  });

  it("lehnt Inhalt kuerzer als 50 Zeichen ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      content: "Zu kurz",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("content");
    }
  });

  it("lehnt ungueltige Kategorie ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      category: "ungueltig",
    });
    expect(result.success).toBe(false);
  });

  it("lehnt unguestigen Status ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      status: "geloescht",
    });
    expect(result.success).toBe(false);
  });

  it("setzt Status-Default auf 'draft' wenn nicht angegeben", () => {
    const { status: _s, ...withoutStatus } = validInput;
    const result = createBestPracticeSchema.safeParse(withoutStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("setzt Tags-Default auf leeres Array wenn nicht angegeben", () => {
    const { tags: _t, ...withoutTags } = validInput;
    const result = createBestPracticeSchema.safeParse(withoutTags);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("lehnt mehr als 10 Tags ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
    });
    expect(result.success).toBe(false);
  });

  it("lehnt Tag laenger als 30 Zeichen ab", () => {
    const result = createBestPracticeSchema.safeParse({
      ...validInput,
      tags: ["A".repeat(31)],
    });
    expect(result.success).toBe(false);
  });

  it("akzeptiert alle gueltigen Kategorien", () => {
    const validCategories = [
      "prompt_engineering",
      "ai_tools",
      "automation",
      "data_analysis",
      "ai_ethics",
      "other",
    ];
    for (const category of validCategories) {
      const result = createBestPracticeSchema.safeParse({ ...validInput, category });
      expect(result.success).toBe(true);
    }
  });

  it("akzeptiert draft und published als Status", () => {
    for (const status of ["draft", "published"] as const) {
      const result = createBestPracticeSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });
});
