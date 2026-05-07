// =============================================================================
// Orb Bubble — Cooldown Gate (Pattern P3.2)
// localStorage/sessionStorage-Wrapper fuer Frequency-Cap und Cooldown.
// SSR-Safe: alle Zugriffe sind hinter typeof window === 'undefined' Guards.
// =============================================================================

const KEY_LAST_SHOWN_AT = 'orb:bubble:lastShownAt';
const KEY_DISMISSED_AT = 'orb:bubble:dismissedAt';
const KEY_WEEKLY_COUNT = 'orb:bubble:weeklyCount';
const KEY_SESSION_SHOWN = 'orb:bubble:sessionShown';

const COOLDOWN_DISMISS_MS = 24 * 60 * 60 * 1000; // 24 h
const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage
const MAX_PER_WEEK = 3;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isSSR(): boolean {
  return typeof window === 'undefined';
}

function isFormActive(): boolean {
  if (isSSR()) return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea';
}

function getWeeklyCount(): number {
  if (isSSR()) return 0;
  try {
    const raw = localStorage.getItem(KEY_WEEKLY_COUNT);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { count: number; windowStart: number };
    const now = Date.now();
    if (now - parsed.windowStart > WEEKLY_WINDOW_MS) return 0;
    return parsed.count;
  } catch {
    return 0;
  }
}

function incrementWeeklyCount(): void {
  if (isSSR()) return;
  try {
    const raw = localStorage.getItem(KEY_WEEKLY_COUNT);
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { count: number; windowStart: number };
      if (now - parsed.windowStart > WEEKLY_WINDOW_MS) {
        localStorage.setItem(KEY_WEEKLY_COUNT, JSON.stringify({ count: 1, windowStart: now }));
      } else {
        localStorage.setItem(KEY_WEEKLY_COUNT, JSON.stringify({ count: parsed.count + 1, windowStart: parsed.windowStart }));
      }
    } else {
      localStorage.setItem(KEY_WEEKLY_COUNT, JSON.stringify({ count: 1, windowStart: now }));
    }
  } catch {
    // localStorage blocked (private browsing, quota exceeded) — ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Prueft alle Gates: Session-Cap, 24h-Cooldown nach Dismiss,
 * Frequency-Cap 3/Woche, kein Trigger waehrend Formular aktiv.
 */
export function canShowBubble(): boolean {
  if (isSSR()) return false;

  // Gate: Formular aktiv
  if (isFormActive()) return false;

  // Gate: max 1 pro Session (bis Tab-Close)
  const sessionShown = sessionStorage.getItem(KEY_SESSION_SHOWN);
  if (sessionShown === '1') return false;

  // Gate: 24h Cooldown nach Dismiss
  try {
    const dismissedAt = localStorage.getItem(KEY_DISMISSED_AT);
    if (dismissedAt) {
      const ts = parseInt(dismissedAt, 10);
      if (!isNaN(ts) && Date.now() - ts < COOLDOWN_DISMISS_MS) return false;
    }
  } catch {
    // localStorage not available — skip check
  }

  // Gate: Frequency-Cap 3 pro Woche
  if (getWeeklyCount() >= MAX_PER_WEEK) return false;

  return true;
}

/** Muss aufgerufen werden, wenn eine Bubble angezeigt wird. */
export function markBubbleShown(): void {
  if (isSSR()) return;
  try {
    localStorage.setItem(KEY_LAST_SHOWN_AT, String(Date.now()));
    sessionStorage.setItem(KEY_SESSION_SHOWN, '1');
    incrementWeeklyCount();
  } catch {
    // ignore
  }
}

/** Muss aufgerufen werden, wenn der User eine Bubble dismissed. */
export function markBubbleDismissed(): void {
  if (isSSR()) return;
  try {
    localStorage.setItem(KEY_DISMISSED_AT, String(Date.now()));
  } catch {
    // ignore
  }
}
