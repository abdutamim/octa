# Craft Discipline — register, anti-slop, scoring, hard technique
(Absorbed from impeccable: methodology + the rules that override taste.)

## The register split (route EVERY task first)
- **Brand register** — design IS the product: landing pages, portfolios, campaigns. Defaults: risk, drama, fluid clamp() type, one orchestrated page-load with staggered reveals, committed color.
- **Product register** — design SERVES a task: app UI, dashboards. Defaults: familiarity, fixed rem type scale (no fluid — no major design system uses it in product UI), 150–250ms state-only motion, NO page-load choreography, restrained color.
- Bold-brand = stronger hierarchy (900 vs 200 weight, 3–5× scale jumps, grid-breaking hero, one color owning 60%) — never gradients/glass/neon theatrics. Bold-product = clarity amplification only.
- Quieter ≠ generic: desaturate to 70–85%, reduce weights one step (900→600), shorten motion distances (10–20px), KEEP the point of view.

## The AI-slop test (opens every review)
"If someone said 'AI made this,' would you believe them immediately?"
**Absolute bans — match and refuse, restructure instead:**
- Side-stripe accents (border-left/right >1px colored) — use full hairline border + 4–8% accent wash + leading glyph instead
- Gradient text (background-clip: text)
- Decorative glassmorphism (glass with no layering job)
- The hero-metric template (big number + small label + gradient accent) unless it's real user data
- Identical icon+heading+text card grids (vary structure or merge)
- Modal-as-first-thought (exhaust inline/progressive disclosure first)
- Em dashes in UI copy; "Herding pixels"-style cutesy loading copy
- Cyan/purple gradients, neon-on-dark as "bold"
**Category-reflex check, two altitudes:** if the palette is guessable from the category alone ("finance → navy+gold", "crypto → neon dark"), rework. If the aesthetic is guessable from category+anti-reference ("fintech but not navy → terminal dark"), that's the same trap one tier deeper — rework again. Force theme choice with a one-sentence physical scene ("SRE glancing at incident severity at 2am"), never with the category.
**Font monoculture ban (greenfield picks):** Inter, Space Grotesk, DM Sans/Serif, Playfair, Fraunces, Lora, Cormorant, Syne, IBM Plex, Space Mono, Outfit, Plus Jakarta, Instrument — pick from a real foundry catalog using three physical-object brand words ("warm, mechanical, opinionated"); if the final pick matches your first reflex, start over. (Doesn't apply when preserving an existing identity.)

## Identity lock (before ANY variation/fix)
Extract the existing design's identity as ONE factual sentence (from tokens/CSS/computed styles). Default mode (~90%): vary WITHIN that identity. Departure only on explicit user trigger. When exploring, produce 3 variants on 3 DIFFERENT named axes (hierarchy / topology / type system / color strategy / density / decomposition) — squint-test that they're actually different.

## Scoring (make reviews numeric)
- **Design critique**: Nielsen's 10 heuristics × 0–4 = /40. Most real interfaces score 20–32. Bands: 36+ ship · 28–35 good · 20–27 acceptable · 12–19 overhaul · <12 redesign.
- **Technical audit**: a11y, performance, theming, responsive, anti-patterns × 0–4 = /20. Anti-pattern dim: 5+ tells=0, 3–4=1, 1–2=2, subtle=3, none=4.
- Severity: P0 blocks task · P1 major/WCAG-AA (fix before release) · P2 workaround exists · P3 polish. Tiebreak: "would a user contact support about it?" → ≥P1.
- Persona walkthroughs (pick 2–3): power user (keyboard, <60s core task) · first-timer (obvious first action in 5s, no jargon) · a11y (keyboard-only, 4.5:1, announced states) · stress tester (refresh mid-flow, emoji input, rapid clicks) · distracted mobile (thumb zone, 3G). Landing → first-timer/stress/mobile; dashboard → power/a11y.
- Honesty doctrine: detector output is defect evidence, never proof of completion; screenshots must actually be read back; don't invent defects to look thorough.

## Cognitive load (hard quotas)
Working memory ceiling = **4 items** (not 7). Nav ≤5 top-level · ≤4 form fields per visual group · 1 primary + 1–2 secondary actions, rest in a menu · ≤4 dashboard metrics above the fold · ≤3 pricing tiers.
Named violations: Wall of Options (10+ flat choices) · Memory Bridge (remember step 1 to do step 3) · Hidden Navigation (no location cues) · Visual Noise Floor (everything equal weight) · Inconsistent Pattern (same action, different UI) · Context Switch (info not co-located with its decision).

## Technique upgrades (override older habits where they conflict)
### Spacing & layout
- **4pt base beats 8pt** (you constantly need 12px): 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Vertical rhythm: body line-height (16×1.5=24px) is the base unit for vertical spacing multiples.
- Size hierarchy needs ≥3:1 ratio to read strong; combine 2–3 dimensions (size+weight+space) but use the fewest that work.
- Centered-stack = template tell. Left-aligned asymmetric composition (70/30, 80/20 splits) feels designed — or a rigorously visible grid. Don't split the difference.
- Dramatic scale jumps = 3–5× (not 1.5×); dramatic whitespace = 100–200px gaps.
- `repeat(auto-fit, minmax(280px,1fr))` for breakpoint-free grids; named grid-areas per breakpoint; gap over margins; container queries for components.
- Z-index semantic scale: dropdown 100 · sticky 200 · backdrop 300 · modal 400 · toast 500 · tooltip 600.
- Optical alignment: pull text -0.05em at margins; shift play/arrow icons toward their direction — only when it visibly looks wrong.
- Hit area ≥44px even for 24px icons (::before{inset:-10px}).

### Typography
- 5 sizes max: 0.75 / 0.875 / 1 / 1.25–1.5 / 2–4rem. Brand scale ratio ≥1.25; product 1.125–1.2. 14/15/16/18 together = muddy.
- Light-on-dark compensation is THREE-axis: +0.05–0.1 line-height, +0.01–0.02em tracking, body weight down to ~350 (light text reads heavier).
- clamp() max ≤ 2.5× min or zoom breaks; body text always fixed size.
- ALL-CAPS labels: +0.05–0.12em tracking. Paragraphs: space OR indent, never both. text-wrap:balance on headings, pretty on prose; tabular-nums for data.
- Font loading: font-display swap/optional, metric-matched fallback (size-adjust/ascent-override), preload only critical body weight, variable font at 3+ weights.

### Color
- Work in OKLCH. Tint EVERY neutral toward brand hue at chroma 0.005–0.015 (invisible tint, subconscious cohesion). Reduce chroma near L extremes.
- **Pick a color strategy BEFORE colors**: Restrained (tinted neutrals + ≤10% accent; product default) · Committed (one color owns 30–60%; brand default) · Full palette (3–4 roles) · Drenched (surface IS the color). The 10% rule applies to Restrained only — don't collapse to it by reflex.
- Name a real reference ("Stripe purple-on-white restraint", "Vercel pure black") — unnamed ambition becomes beige.
- Placeholder text needs 4.5:1 too. Never gray text on colored bg (use darker shade of the bg color). Danger pairs: red/green, blue/red, yellow/white, thin light text on images.
- Heavy rgba/alpha = incomplete palette smell (define explicit overlay colors); exception: focus rings.
- Dark surfaces: 3-step lightness scale ~15/20/25% L at brand hue; never pure black (12–18% L).

### Interaction
- **Eight states** per interactive element: default, hover, focus, active, disabled, loading, error, success. Most-missed: focus (keyboard users never see hover).
- Focus ring: 2–3px, offset OUTSIDE, 3:1 contrast, :focus-visible.
- **Undo beats confirm** — confirm only for irreversible/batch; otherwise act + undo toast.
- Dropdown clipping (the #1 generated-code bug): position:absolute inside overflow:hidden — use Popover API / portal to body / position:fixed + rect math with edge flipping.
- Validate on blur (not keystroke); errors below field + aria-describedby; roving tabindex for tabs/menus; `@media (hover:hover)` before any hover state; `pointer:coarse` → bigger padding.
- Optimistic UI for low-stakes only (never payments/destructive). Skeletons > spinners.

### Motion
- Duration ladder: 100–150ms feedback · 200–300ms state · 300–500ms layout · 500–800ms entrances. **Exits at ~75% of entrance.**
- Default micro easing: **quart-out cubic-bezier(0.25,1,0.5,1)**; exit ease-in (0.7,0,0.84,0). Never plain `ease`. **No bounce/elastic — ever** (draws attention to the animation itself). This overrides any spring/bounce recipe elsewhere — reserve springs for explicitly playful brands.
- Stagger 50ms/item, cap total ~500ms. 80ms = perceived-instant threshold; brief delay on complex ops builds trust.
- Not "transform/opacity only" but "never casually animate layout properties": blur, clip-path wipes, shadow bloom, grid-template-rows expand (not height), FLIP — allowed when verified smooth in small areas. will-change only when imminent.
- Ambitious effects: propose 2–3 directions + get a pick BEFORE building; tests = wow / removal (is it missed?) / mid-range phone 60fps / reduced-motion still beautiful / right for brand. @supports fallback chain.

### UX writing
- Verb+object buttons ("Save changes", "Delete 5 items"); "Cancel"→"Keep editing"; never OK/Submit/Yes.
- Errors: what happened + why + fix; never blame, never humor in errors.
- Empty state = onboarding: what appears here + why valuable + CTA.
- Loading: specific + expectation ("Analyzing… usually 30–60s").
- One term per concept everywhere. Numbers separate from sentence for i18n ("New messages: 3"). No em dashes.

### Responsive & hardening
- Content-driven breakpoints (stretch until it breaks; 640/768/1024 usually enough); mobile = rethink (thumb-zone actions, bottom sheets), not shrink; same IA everywhere — never hide core features on mobile.
- Safe areas: viewport-fit=cover + max(1rem, env(safe-area-inset-bottom)).
- i18n stress: +30% German/Finnish text, logical properties (margin-inline-start), [dir=rtl] arrow flips, min-width:0 on flex children.
- Test with: 100+ char names, emoji input, 0 items, 1000 items, 10 rapid clicks, refresh mid-flow. Tables→cards on mobile (data-label).
- Production bar: real content only, verified image URLs, image-led sectors MUST ship imagery (zero images is a bug, not restraint), all states designed.

## Build flow additions
- Discovery before code on ambiguous briefs: 2–3 assert-then-confirm questions, produce a compact brief (summary · primary user action · direction · scope · key states · references), get explicit confirmation.
- Every enhance pass ends with a polish pass: design-system alignment first (polish without alignment is decoration on drift), flow-shape consistency (same nouns, same disclosure depth as neighboring features), copy consistency (no random 13px gaps, no widows, one capitalization scheme).
- Delight only at earned moments (completion, first-time, recovery, milestones), <1s, skippable, varies across repeats.
