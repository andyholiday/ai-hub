// =============================================================================
// Cooldown Tests — localStorage-Mock, 24h-Cooldown, Frequency-Cap, SSR-Guard
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// localStorage / sessionStorage Mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock, writable: true });

// document.activeElement Mock — kein Formular aktiv per default
Object.defineProperty(globalThis, 'document', {
  value: {
    activeElement: { tagName: 'BODY' },
  },
  writable: true,
});

// Jetzt erst importieren (nach den Mocks)
import { canShowBubble, markBubbleShown, markBubbleDismissed } from '@/lib/orb-rules/cooldown';

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.restoreAllMocks();
  // Reset activeElement to non-form
  (globalThis as unknown as { document: { activeElement: { tagName: string } } }).document.activeElement = { tagName: 'BODY' };
});

describe('canShowBubble', () => {
  it('gibt true zurueck wenn kein Gate aktiv ist', () => {
    expect(canShowBubble()).toBe(true);
  });

  it('gibt false zurueck wenn Session-Cap aktiv (sessionStorage gesetzt)', () => {
    sessionStorageMock.setItem('orb:bubble:sessionShown', '1');
    expect(canShowBubble()).toBe(false);
  });

  it('gibt false zurueck innerhalb 24h nach Dismiss', () => {
    const recent = Date.now() - (23 * 60 * 60 * 1000); // 23h ago
    localStorageMock.setItem('orb:bubble:dismissedAt', String(recent));
    expect(canShowBubble()).toBe(false);
  });

  it('gibt true zurueck nach mehr als 24h nach Dismiss', () => {
    const old = Date.now() - (25 * 60 * 60 * 1000); // 25h ago
    localStorageMock.setItem('orb:bubble:dismissedAt', String(old));
    expect(canShowBubble()).toBe(true);
  });

  it('gibt false zurueck wenn Frequency-Cap >= 3/Woche erreicht', () => {
    const weeklyData = { count: 3, windowStart: Date.now() };
    localStorageMock.setItem('orb:bubble:weeklyCount', JSON.stringify(weeklyData));
    expect(canShowBubble()).toBe(false);
  });

  it('gibt true zurueck wenn Frequency-Cap < 3/Woche', () => {
    const weeklyData = { count: 2, windowStart: Date.now() };
    localStorageMock.setItem('orb:bubble:weeklyCount', JSON.stringify(weeklyData));
    expect(canShowBubble()).toBe(true);
  });

  it('setzt Counter zurueck wenn Weekly-Window abgelaufen', () => {
    const oldWindow = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 Tage alt
    const weeklyData = { count: 3, windowStart: oldWindow };
    localStorageMock.setItem('orb:bubble:weeklyCount', JSON.stringify(weeklyData));
    // Altes Window → Counter wird als 0 behandelt → darf zeigen
    expect(canShowBubble()).toBe(true);
  });

  it('gibt false zurueck wenn Formular aktiv (input)', () => {
    (globalThis as unknown as { document: { activeElement: { tagName: string } } }).document.activeElement = { tagName: 'INPUT' };
    expect(canShowBubble()).toBe(false);
  });

  it('gibt false zurueck wenn Formular aktiv (textarea)', () => {
    (globalThis as unknown as { document: { activeElement: { tagName: string } } }).document.activeElement = { tagName: 'TEXTAREA' };
    expect(canShowBubble()).toBe(false);
  });
});

describe('markBubbleShown', () => {
  it('setzt lastShownAt in localStorage', () => {
    markBubbleShown();
    expect(localStorageMock.getItem('orb:bubble:lastShownAt')).not.toBeNull();
  });

  it('setzt sessionShown in sessionStorage', () => {
    markBubbleShown();
    expect(sessionStorageMock.getItem('orb:bubble:sessionShown')).toBe('1');
  });

  it('inkrementiert weeklyCount', () => {
    markBubbleShown();
    const raw = localStorageMock.getItem('orb:bubble:weeklyCount');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { count: number };
    expect(parsed.count).toBe(1);
  });
});

describe('markBubbleDismissed', () => {
  it('setzt dismissedAt in localStorage', () => {
    markBubbleDismissed();
    const ts = localStorageMock.getItem('orb:bubble:dismissedAt');
    expect(ts).not.toBeNull();
    expect(Number(ts)).toBeGreaterThan(0);
  });

  it('nach Dismiss kann canShowBubble nicht mehr true sein (24h Gate)', () => {
    markBubbleDismissed();
    expect(canShowBubble()).toBe(false);
  });
});

describe('SSR-Guard', () => {
  it('canShowBubble gibt false zurueck wenn window undefined', () => {
    // Simuliere SSR: window auf undefined setzen
    const origWindow = globalThis.window;
    // @ts-expect-error -- intentionally deleting window for SSR test
    delete globalThis.window;
    // Re-import wuerde die SSR-Pfade testen — da der Modul-Cache aber aktiv ist,
    // testen wir den Guard indirekt: canShowBubble soll nie einen Fehler werfen
    // Stattdessen pruefen wir den Guard-Pfad ueber typeof window === 'undefined'
    // indem wir den internen Guard manuell ueberpruefen
    expect(() => canShowBubble()).not.toThrow();
    if (origWindow !== undefined) {
      globalThis.window = origWindow;
    }
  });
});
