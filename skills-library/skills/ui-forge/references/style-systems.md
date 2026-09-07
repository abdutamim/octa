# Style Systems — named styles, palettes, pairings, anti-patterns
(Absorbed from ui-ux-pro-max: 67 styles / 96 palettes / 57 pairings / 99 UX rules, curated.)

## Choosing a style: the reasoning layer
Map product category → (landing pattern + style stack + color mood + anti-patterns). Conditionals worth applying:
- e-commerce + luxury → liquid-glass/slow reveals (400–600ms; "fast animations = cheap" for luxury)
- SaaS + data-heavy → add glassmorphism panels; portfolio + creative field → add brutalism
- healthcare → WCAG AAA mandatory; fintech → security badges mandatory; luxury → storytelling mandatory
- **The generic-AI look (purple/pink gradients) is BANNED in trust verticals**: healthcare, government, banking, legal, insurance, logistics, B2B enterprise, consulting, construction, pharmacy.
- Dark-mode-by-default is wrong for general SaaS; light-mode-default is wrong for financial dashboards/dev tools/crypto (inverse pairs).
- Hidden pricing kills local services; corporate templates kill portfolios; static design kills gaming/startups.

## Style catalogue (essence → when / never)
- **Minimalism/Swiss** — whitespace, strict grid, single accent, 8px unit; enterprise/SaaS/docs. AAA-friendly.
- **Glassmorphism** — blur(10–20px), rgba(255,255,255,.15) fill, 1px rgba(255,255,255,.2) border, needs a vibrant bg behind; SaaS, fintech, modals/nav. Light mode needs bg-white/80+, not /10. Verify 4.5:1.
- **Neumorphism** — dual shadows ±5px/15px, pastel; low contrast — never data-heavy or a11y-critical. Its fixed successor: **Soft UI Evolution** (0 2px 4px shadows, radius 8–12, AA+) for health/beauty/enterprise.
- **Brutalism / Neubrutalism** — raw primaries, 0 radius, no transitions, 2–4px visible borders / 3px black border + hard offset shadow 4px 4px 0 #000, pop colors; portfolios, counter-culture, Gen-Z tools. Conversion-rated LOW — not for selling.
- **Bento Grid** (Apple/Linear) — modular 1x1/2x1/2x2 cards, radius 16–24, bg #F5F5F7, card shadow 0 4px 6px rgba(0,0,0,.05), hover scale 1.02.
- **Dark OLED** — #000/#121212 + restrained neon, text 7:1+; coding/entertainment/night.
- **Aurora** — flowing mesh gradients, 8–12s loops, blend screen; heroes, music, premium SaaS.
- **Exaggerated Minimalism** — clamp(3rem,10vw,12rem), weight 900, tracking −0.05em, 8rem+ padding, B/W + one accent; fashion/architecture/agency.
- **Editorial/Magazine** — asymmetric named grid areas, drop caps, pull quotes, serif body, multi-column; publishing/content brands.
- **Kinetic Typography** — split-text reveals, background-clip:text, typing steps(); heroes only, weak a11y.
- **Parallax Storytelling** — 0.3/0.6/1.0 layer speeds, 100vh chapters; brand stories. Needs skip + reduced-motion + mobile simplification.
- **Claymorphism** — chunky 3D, radius 16–24, bounce cubic-bezier(.34,1.56,.64,1); kids/education/onboarding.
- **Cyberpunk/HUD** — matrix green/magenta on #0D0D0D, mono, scanlines, 1px cyan frames; gaming/security only.
- **AI-Native** — minimal chrome, streaming text, typing pulse, accent #6366F1, context cards; copilots.
- **Tactile Deformable** — press scale(.95) + spring back (stiffness 300, damping 20); playful mobile.
- **Interactive Cursor** — cursor:none + custom element, mix-blend-mode:difference, magnetic lerp ≤100px; agencies; touch fallback required.
- Others by vibe: Y2K (chrome+hot pink), Memphis, Vaporwave (#FF71CE→#01CDFE→#B967FF + grid), Vintage Analog (grain+sepia 20%), Organic Biophilic (terracotta #C67B5C/sand/olive + grain), E-Ink (#FDFBF7+#1A1A1A serif, no transitions), Pixel, Spatial/VisionOS (blur(40px) saturate(180%), radius 24), Anti-Polish (hand-drawn borders, random rotations), Gen-Z Chaos (viral marketing only), Dimensional Layering (4-level elevation 0 1px 3px → 0 20px 40px rgba(0,0,0,.15)).

## Palette formula (per sector)
**Trust-color primary + complementary high-energy CTA + near-white tinted bg + very dark same-hue text + light tinted border.** Orange #F97316 is the workhorse CTA across SaaS/e-com/education/travel.
- SaaS #2563EB+#F97316 on #F8FAFC / text #1E293B · E-com green #059669 + urgency orange · Luxury near-black #1C1917 + gold #CA8A04 on #FAFAF9 · Fintech gold #F59E0B + purple #8B5CF6 on #0F172A · Health cyan #0891B2 + green (never purple/pink) · Legal/banking navy #1E3A8A + gold #B45309 · Restaurant red #DC2626 + gold · Coffee #78350F on cream #FEF3C7 · Gaming #7C3AED + #F43F5E on #0F0F23.

## Font pairings (heading + body)
- Luxury/editorial: Playfair Display+Inter · Cormorant+Montserrat · Bodoni Moda+Jost · Cinzel+Josefin Sans (real estate).
- Tech/startup: Space Grotesk+DM Sans · Outfit+Work Sans · Clash Display+Satoshi · Plus Jakarta Sans solo.
- SaaS: Poppins+Open Sans · Lexend+Source Sans 3 (a11y) · IBM Plex Sans solo (finance).
- Arabic: Noto Naskh Arabic headings + Noto Sans Arabic body (or local brand fonts); display Arabic fonts headlines-only like Latin display rules.
- Display fonts (Bebas Neue, Anton, Abril Fatface…) = headlines ONLY + workhorse body. Single-font systems: Inter solo. Niche: JetBrains Mono+IBM Plex (dev), Barlow Condensed+Barlow (sports), Syne+Manrope (fashion), Atkinson Hyperlegible (max legibility).

## Landing patterns with conversion notes
- Hero+Features+CTA: 3–5 features, sticky nav CTA, CTA contrast 7:1, headline 60–80 chars, clamp(2rem,5vw,4rem).
- CTA AFTER social proof (3–5 testimonials w/ photo+name+role).
- 3-step funnel: red(problem)→orange(process)→green(solution) + mini-CTA per step.
- Lead magnet: ≤3 fields; form max-width 600px; inputs 48px.
- Pricing: mid-tier "most popular", annual discount 20–30%, FAQ kills objections.
- Video hero: 60% overlay, muted autoplay, captions. Before/after: muted-grey before vs vibrant after. Comparison table: highlight your row. Marketplace: the search bar IS the CTA. AI product: prompt input as hero. Waitlist: countdown + count + referral.
- Minimal single-column: one CTA, ≤3 bullets, <500KB page, <2s load.

## Hard UX/engineering rules (highest severity)
- Animate 1–2 key elements per view MAX; 150–300ms micro (>500ms sluggish); ease-out enter/ease-in exit; infinite loops for loaders only; animate transform/opacity only; prefers-reduced-motion always.
- Z-index scale 10/20/30/40/50 — never 9999. `dvh` not `100vh` on mobile. Reserve space for async content (no CLS). Text 65–75ch.
- Touch: 44px + 8px between targets; touch-action:manipulation; overscroll-behavior:contain.
- Feedback: >300ms = spinner/skeleton; keep submit ENABLED during request with spinner inside (prevents double-submit without dead buttons); errors NEAR the field + role=alert + focus first error; confirm destructive; toasts 3–5s.
- Forms: visible labels (placeholder ≠ label), validate on blur, semantic types + inputmode + autocomplete, password toggle, never block paste.
- A11y: 4.5:1 min; never color-only; aria-label on icon buttons; :focus-visible ring (never outline-none without replacement); never maximum-scale=1; tab order = visual order; onKeyDown with onClick on custom interactive divs; aria-hidden decorative icons; one <label> wraps checkbox+text.
- URL reflects state (tabs/filters/pagination deep-linkable). Virtualize lists >50. Proper Unicode (… " –), nbsp between number and unit, Intl formatters, no transition-all, spellcheck=false on codes/emails.
- Tailwind conventions: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; gaps not child margins; bg-black/50 not opacity-50; motion-reduce:animate-none; buttons min-h 44px mobile.

## Charts quick-map
trend→line · categories→sorted bar + value labels · part-of-whole→pie ≤5 slices else stacked bar · correlation→scatter (opacity .6–.8) · vs-target→bullet chart · forecast→solid actual + dashed forecast + band · waterfall +green/−red · hierarchy→treemap (children 15–20% lighter, 2–3px white borders) · candlestick #26A69A/#EF5350. Any low-a11y chart ships a data-table alternative.

## "Unprofessional UI" tells (fix on sight)
Emoji icons · layout-shifting hover scales · unverified brand SVGs · missing cursor-pointer · light-mode glass at /10 opacity · light-mode muted text lighter than #475569 · border-white/10 in light mode · floating navbar glued to edges (needs top-4 inset + content compensation) · mixed container widths · no focus states · horizontal scroll at 375px.
