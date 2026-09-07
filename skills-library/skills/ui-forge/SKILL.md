---
name: ui-forge
description: >
  Elite UI/UX system distilled from 50 practitioner video teardowns — build or review any
  web page, landing page, dashboard, or mobile UI with measured rules (type scales, color
  math, spacing values, easing curves) instead of taste guesses. Use for any request like
  "review this page", "why does this look bad/cheap/AI-generated", "build a landing page",
  "improve this UI", "design a dashboard", "raise the quality level", "اعمل لاندنج بيدج",
  "راجع الصفحة دي", "الموقع شكله وحش", "حسّن التصميم", "اعمل داشبورد". Covers layout,
  typography, color systems, components, motion, conversion, dashboards, mobile, RTL-friendly.
---

# UI Forge

A measured design system reverse-engineered from 50 expert teardowns, fused with the
impeccable craft doctrine and the ui-ux-pro-max style database. Everything here is a
number or a named pattern — never "make it pop."

## Read this before anything else
`references/grammar.md` is measured from Tamim's own 30 shipped landing pages and
**outranks every other file here**. The rest of this skill is distilled from video
transcripts and third-party skills — useful for objective matters (contrast, a11y,
RTL, honesty) and unreliable on taste. Section 7 of grammar.md lists the specific
rules elsewhere in this skill that the corpus proves wrong; do not apply those.

## Route first: the register split
Before anything, classify the task (see `references/craft-discipline.md`):
- **Brand register** (design IS the product: landing pages, portfolios, campaigns) →
  drama, fluid type, orchestrated entrance, committed color.
- **Product register** (design SERVES a task: apps, dashboards) → familiarity, fixed rem
  scale, 150–250ms state-only motion, restrained color.

## Operating modes

**Review mode** — user shows a page/screenshot/URL and wants critique:
1. Read `references/review-checklist.md` + `references/craft-discipline.md` and run both:
   the checklist section by section, then the AI-slop test and category-reflex check.
2. Score it: Nielsen 10 heuristics ×0–4 = /40 (bands: 36+ ship · 28–35 good · 20–27
   acceptable · <20 overhaul) + L1–L4 level estimate.
3. Report top 5 fixes ranked by ROI (**layout > color > icons/type > effects**), each
   tagged P0–P3 with concrete values. If asked to fix, apply in that order.

**Build mode** — user wants a page/screen designed or coded:
1. Read `references/foundations.md` + `references/craft-discipline.md` always, plus
   `references/landing-pages.md` (marketing) or `references/apps.md` (apps), and pick a
   named style direction from `references/style-systems.md`.
2. Follow the build sequence below. On existing designs, extract the identity lock first
   (one factual sentence) and vary within it.
3. Before delivering, self-review with `references/review-checklist.md` + the AI-slop
   bans — the page must survive its own audit at L3 minimum and score 28+/40.

## Build sequence (never skip steps, never reorder)

1. **Intent & sector** — who is this for, what one action should they take, what does the
   sector *feel* like (a restaurant page evokes menus; an auto page smells of garages).
   Write the headline first: ≤7 words, actionable, "how it helps" not "what it is".
2. **Section roadmap** — list sections before designing. Default skeleton in
   `references/landing-pages.md`. Cut anything redundant now.
3. **Wireframe with variety** — no two consecutive sections share a layout. Fix boredom
   at the wireframe stage; a boring wireframe cascades. 5-second test the wireframe.
4. **Type system** — 1–2 fonts; scale ×1.27 (landing) / ×1.17 (dense); 2 weights;
   headlines get −2..−4% tracking, 110–130% leading; body 150%, secondary at 45–70% opacity.
5. **Color system** — brand hue tints EVERYTHING: background = near-white/near-black
   version of the accent (Tailwind 50/500 light, 950/300 dark); text tints 11/15–20/30–40%;
   accent ≤10% of the screen, introduced through function (CTA, state, data). Gradients:
   one hue, two values — or none. Semantic red/green kept regardless of brand.
6. **Spacing** — 4/8px grid; hero rhythm 8/12/32; one radius token; nested radius =
   outer − gap; chips thinner than buttons; whitespace over dividers.
7. **Components** — per `references/components.md`: full state coverage (hover, press,
   disabled, loading, empty, error), one icon library, labels above inputs, honest pricing.
8. **Depth** — shadow y ≥ x, blur 1.3–2×y, 15–20% opacity; dark mode = lighter surfaces,
   never shadows; noise/glass/glow sparingly.
9. **Motion last** — per `references/motion.md`: layout must stand without it. Signature
   easing expo.inOut ~1.3s for big moves, 0.2s stagger/0.6s items, springs for micro.
   Every interaction responds. ONE well-built surprise per page.
10. **Self-audit** — run the review checklist on your own output before showing it.

## Non-negotiables (memorize)

- The AI-slop bans (full list in craft-discipline.md): no side-stripe accents, no gradient
  text, no decorative glass, no hero-metric template, no identical icon-card grids, no
  modal-as-first-thought, no purple/pink "AI" gradients in trust verticals, no em dashes
  in copy, no bounce/elastic easing.
- Cognitive quotas: nav ≤5 · ≤4 fields per group · 1 primary action · ≤4 metrics · ≤3 tiers.
- Eight states per interactive element (default/hover/focus/active/disabled/loading/error/success).
- One primary CTA per screen. Two equal buttons = broken hierarchy.
- Proximity is hierarchy: related tight, unrelated far; nothing floats alone.
- No pure black/white backgrounds; no two-hue gradients; no thin black borders.
- H1 stays regular weight — size already wins; bold the subheads instead.
- Never restate the brand name in the headline beside the logo.
- No emojis as icons. No display fonts at small sizes. No lorem ipsum — worst-case content.
- Charts: labeled axes, no smoothed lines, no rounded bar tops.
- Destructive = red, always, even off-brand.
- Every gesture needs a button fallback; every mouse effect needs a touch fallback.
- Real product imagery > stock; text never covers a focal point.
- Subtle > flashy. If an effect slows load or navigation, cut it.
- RTL projects: mirror "left" rules to reading-start; Arabic type needs ~10–15% more
  leading and NO tight negative tracking on Arabic script (tracking rules apply to Latin only).

## References (read on demand)

- `references/grammar.md` — **the house grammar, measured from his own shipped work. Read first, always. Overrides everything below.**
- `corpus/` — reference frames from the showcased builds (archidot, ecart, exoraspark). Look at these before designing; naming 2–3 moves from them and getting a yes is cheaper than building the wrong direction.

- `references/foundations.md` — layout, grids, hero anatomy, typography math, color systems, spacing values. **Always read in build mode.**
- `references/components.md` — buttons, cards, nav, forms, pricing, tables, charts, icons, overlays, empty states, shadows/effects recipes.
- `references/motion.md` — the 5 animation types, exact easings/durations, mobile motion semantics, optimistic UI.
- `references/landing-pages.md` — L1–L4 quality ladder, page skeleton, conversion rules, sector fit, imagery, presenting work.
- `references/apps.md` — dashboards (structure, progressive disclosure, redesign process), mobile, desktop/native, gamification.
- `references/review-checklist.md` — the full audit, scoring, fix-ranking.
- `references/process.md` — design process, AI/vibe-coding rules, case studies, portfolio, pricing & client strategy.
- `references/craft-discipline.md` — register split, AI-slop bans, identity lock, numeric scoring, cognitive quotas, technique upgrades (spacing/type/color/motion/interaction), UX writing. **Always read in both modes.**
- `references/style-systems.md` — named style catalogue (30+), sector palette formulas, font pairings, landing patterns with conversion notes, hard a11y/engineering rules, chart mapping.
