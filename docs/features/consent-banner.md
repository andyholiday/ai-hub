# Consent Banner

## Status

Active

## Owner

knowledge-agent (stub), developer-agent (implementation)

## Summary

Cookie-free analytics consent banner using `localStorage` (key `analytics-consent`).
Web-Vitals tracking is gated behind this consent. The banner is fully accessible:
`aria-modal="true"`, labelled headings, and a keyboard focus-trap.

## Usage

The banner mounts via `src/app/layout.tsx` and renders `src/components/consent-banner.tsx`.
On accept or reject the result is written to `localStorage`. Subsequent page loads read
the stored value — no banner is shown once a choice has been made.

The analytics gate lives in `src/lib/analytics/web-vitals.ts` (`hasAnalyticsConsent()`
export). Both dev-mode console logging and production endpoint posting are blocked until
consent is granted.

## API

```ts
// src/lib/analytics/web-vitals.ts
export function hasAnalyticsConsent(): boolean
```

Returns `true` when `localStorage.getItem('analytics-consent') === 'granted'`.

## Accessibility

- `aria-modal="true"` on the dialog root
- `aria-labelledby="consent-banner-heading"` + `aria-describedby="consent-banner-desc"`
- Focus trapped between Reject and Accept buttons (Tab / Shift+Tab cycle)
- First button receives focus on mount
- ESC intentionally ignored (consent is mandatory before analytics run)

## Tests

`tests/unit/components/consent-banner.test.tsx` — 12 tests covering visibility,
ARIA attributes, focus management, and button actions.

`tests/unit/lib/analytics/web-vitals.test.ts` — 7 tests covering no-consent,
denied, and granted paths plus beacon payload.

## History

2026-05-01 — Phase 1, Wave 1. Initial implementation (tasks 1.2 + M02 + M03).
GDPR Art. 6 / Art. 13 compliance for Web-Vitals analytics.

## Related Decisions

No formal ADR. Compliance requirement from Phase 1 roadmap entry 1.2 in
[docs/IMPROVEMENTS.md](../IMPROVEMENTS.md).
