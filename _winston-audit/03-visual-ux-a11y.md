# 03 — Visual / UX / Accessibility Audit (Static)

Scope: static design/UX/a11y review from code only (no live server). Next.js 14 +
Tailwind + framer-motion + lucide-react.

## Verdict: 7 / 10

A genuinely strong, modern foundation that falls short of "visually perfect" because
of a few real defects, not taste calls.

**Why it is good (7):** The design system is coherent and professional. The token set
in `tailwind.config.ts` is mature — a full brand color ramp (50–950), a custom type
scale with tuned line-heights and letter-spacing, layered brand shadows
(`card`/`card-hover`/`elevated`/`brand-primary`), a semantic z-index scale, and
Framer-compatible animation tokens. Core UI primitives (`button.tsx`, `card.tsx`,
`input.tsx`, `badge.tsx`, `avatar.tsx`) are well-typed, have proper variants/sizes,
real focus-visible rings, loading and error states, and correct `aria-*` wiring
(e.g. `Input` associates `aria-describedby` to hint/error, errors use `role="alert"`).
Feature pages like `leaderboard` and `community` ship dedicated skeletons, empty
states, and error states. The Cosmos orb is a polished centerpiece with an `sr-only`
`aria-live` region, `aria-label`, focus ring, and thorough `prefers-reduced-motion`
coverage in CSS.

**Why it is not a 9 (defects):**

1. **Dark mode is defined but non-functional.** `darkMode: "class"` + `.dark` tokens
   exist in `globals.css`, and `site.ts` advertises `darkMode: true`, but
   `theme-provider.tsx` is an **empty file**, no provider is mounted in
   `src/app/layout.tsx`, no `.dark` class is ever applied, and only **1 of ~70**
   component files uses any `dark:` variant. 67 files hardcode `bg-white` /
   `text-surface-900`. Toggling dark mode today changes nothing.
2. **Duplicate `<h1>` on every dashboard page.** The shell `Header` renders an `<h1>`
   greeting on every route, and **22 dashboard pages each render their own `<h1>`**.
   Two competing top-level headings per page = broken document outline / a11y defect.
3. **13 empty placeholder component files.** `shared/empty-state`, `error-boundary`,
   `loading-skeleton`, `modal`, `avatar`, `badge`, `pagination`, `search-bar`,
   `breadcrumbs`, `footer`, plus `theme-provider`, `toast-provider`,
   `supabase-provider` are all 0 bytes. They are not imported (no build break), but
   they signal unfinished shared infrastructure — and each page re-implements its own
   skeleton/empty state, so there is visual drift and duplicated effort.
4. **Contrast risk from the neutral ramp.** `surface-400` (#BDBDBD ≈ 1.9:1 on white)
   and `surface-500` (#9E9E9E ≈ 2.8:1) both fail WCAG AA for normal text. They are
   used as *text* (not just icons) in several places (e.g. login "oder" divider,
   `innovation-radar` overlines, placeholder text in multiple forms).

## Prioritized Improvements

| Pri | Area | Issue | Suggested fix | Effort |
|-----|------|-------|---------------|--------|
| P0 | A11y | Two `<h1>` per page (shell Header + each page) | Demote shell greeting to `<p>`/`<div role="presentation">` or make page titles `<h1>` and Header `<h2>`/visually-hidden; one h1 per page | M |
| P0 | Dark mode | Advertised but non-functional; `theme-provider` empty, never mounted, ~0 `dark:` usage | Either ship it (mount ThemeProvider in root layout, apply `.dark`, migrate `bg-white`→`bg-card`/`text-surface-900`→`text-foreground`) or remove the claim from `site.ts`/docs | L |
| P0 | A11y / contrast | `surface-400`/`surface-500` used as body/label text below AA | Use `surface-600`+ for text; reserve 400/500 for icons/borders/disabled only | S |
| P1 | Polish / consistency | 13 empty shared components; each page reinvents skeleton/empty/error | Fill `shared/empty-state`, `loading-skeleton`, `error-boundary`, `modal` and adopt across pages for visual consistency | M |
| P1 | A11y | Orb JS animations (drag spring, scroll scale-pulse) ignore reduced-motion; only CSS layer is guarded | Gate the framer-motion `transition`/`scrollPulse` behind `useReducedMotion()` in `cosmos-companion.tsx` | S |
| P1 | A11y | Orb is drag-only repositioning; no keyboard path to move/dock | Add keyboard handler or a docked-position menu; ensure orb reachable in tab order | M |
| P1 | Consistency | Duplicate primitives: `ui/avatar` + empty `shared/avatar`, `ui/badge` + empty `shared/badge` | Delete the empty duplicates; single source of truth | S |
| P2 | Design tokens | Orb uses `z-[9999]` arbitrary value, bypassing the z-index scale (`tooltip`/`toast` top out at 1700) | Add an `orb` token to the scale and use it | S |
| P2 | Iconography | Mix of lucide-react and hand-inlined SVGs (e.g. leaderboard `RankIcon`/`XPIcon` etc.) | Prefer lucide for consistency of stroke-width/sizing where equivalents exist | S |
| P2 | Loading | No `loading.tsx` route-level streaming for most segments; each page does client-side spinners | Consider Suspense/`loading.tsx` for perceived performance | M |
| P2 | Polish | Hardcoded layout color `bg-[#F7F8FA]`, border `#E5E7EB` in shell instead of `surface` tokens | Map to tokens so theming/dark mode stays consistent | S |

## A11y Checklist (static)

| Check | Status | Note |
|-------|--------|------|
| Semantic landmarks (`nav`, `main`, `header`, `aside`) | PASS | Sidebar/MobileNav have `role="navigation"` + `aria-label`; `main` present |
| One `<h1>` per page | **FAIL** | Shell Header h1 + per-page h1 = two per route |
| `aria-label` on icon-only controls | PASS | Header notifications, orb, community upvote, close buttons all labelled |
| Form labels / error association | PASS | `Input` wires `htmlFor`, `aria-describedby`, `aria-invalid`, `role="alert"` |
| Focus-visible styles | PASS | Global `*:focus-visible` ring + per-component rings |
| `aria-current` on active nav | PARTIAL | MobileNav sets it; Sidebar uses styling only, no `aria-current="page"` |
| Color contrast (text) | **FAIL** | `surface-400`/`surface-500` used as text below WCAG AA |
| Reduced-motion (CSS animations) | PASS | Thorough `prefers-reduced-motion` block covers orb + cosmos CSS |
| Reduced-motion (JS/framer-motion) | **FAIL** | `cosmos-companion.tsx` spring/scroll-pulse not gated; some orb hooks do guard |
| Live-region for dynamic state | PASS | Orb has `aria-live="polite"` sr-only region |
| Alt text on images | PASS | `Avatar` exposes `alt`; only 3 `next/image` users, no bare `<img>` |
| Keyboard nav for custom widgets | PARTIAL | Orb draggable but no keyboard reposition; otherwise links/buttons native |
| Dark-mode support | **FAIL** | Defined in tokens but not wired/applied |

Legend: PASS = no static defect found; PARTIAL = works but gap; FAIL = real defect.
