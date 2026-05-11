// =============================================================================
// Time-of-Day Helper (Pattern P3.3, Tageszeit-Awareness)
//
// Verwendung in Wave 4 Pattern P3.1 (Wandernder Orb).
// =============================================================================

export type TimeOfDay = 'day' | 'evening' | 'night';

/**
 * Gibt die Tageszeit fuer ein gegebenes Date-Objekt zurueck.
 *
 * day:     06:00 – 17:59
 * evening: 18:00 – 21:59
 * night:   22:00 – 05:59
 *
 * @param date  Optionales Date-Objekt; default ist `new Date()` beim Aufruf.
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hours = date.getHours();

  if (hours >= 6 && hours < 18) return 'day';
  if (hours >= 18 && hours < 22) return 'evening';
  return 'night';
}
