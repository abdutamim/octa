# Review Mode — The Audit Checklist

Run this top-to-bottom against any page/screen. For each finding: name the flaw, cite the rule, propose the concrete fix (with values). Order findings by ROI: **layout > color > icons/type > effects**.

## 0. Five-second test
- [ ] Scroll the page fast for 5 seconds. Is it instantly clear what this is, who it's for, and what to do? If not, structure fails before any styling critique matters.
- [ ] Is the product name/category stated immediately (not buried at 12px)?
- [ ] Does the page match its sector? (Restaurant site that evokes restaurants; oil shop that smells of garages.) Zero imagery = vibe-coded tell.

## 1. Layout & hierarchy
- [ ] One primary CTA per screen? Two equal-weight buttons side by side = broken hierarchy.
- [ ] Does information flow with reading direction? Conventions respected (nav top, CTA findable)?
- [ ] Proximity = grouping: related items tight, unrelated far? Anything "floating alone"? Equal gaps everywhere = no hierarchy.
- [ ] Layout variety: any two consecutive sections with identical structure? Alternating image/text all the way down = template tier.
- [ ] Page length proportional to content? Cut aggressively.
- [ ] Two visual styles mixed on one page (airy top, dense bottom)?
- [ ] Redundant sections/pages saying the same thing?
- [ ] Anything important below the fold that should be above? Real viewport ≈ 1920×1000.
- [ ] Text obstructing any image's focal point?
- [ ] Card-in-card nesting? Borders doing work whitespace could do?

## 2. Typography
- [ ] Max 2 fonts, max 2 weights (separated by an intermediate step), max ~6 sizes (landing) / tight scale ≤24px (dashboard)?
- [ ] Scale steps ≈ ×1.27 (web) / ×1.17 (dense)? Extreme jumps between heading and body?
- [ ] Headlines >70px: letter-spacing −2% to −4%, line-height 110–130%?
- [ ] Body: line-height ~150%, secondary text at 45–70% opacity — never the smallest text with the least contrast?
- [ ] H1 regular-weight (size already wins), subheads bolded for scanning?
- [ ] Hero copy ≤ ~7 words headline / ~14 subtext? Company name repeated next to its own logo?
- [ ] Display/handwritten fonts used at small sizes? (Never.)
- [ ] Worst-case content tested — long names truncated by design?

## 3. Color
- [ ] Count the accents: more than ~10% of the screen in accent color? 5 competing hues?
- [ ] Pure black/white backgrounds? Should be tinted toward the brand hue (Tailwind 50/500 light, 950/300 dark).
- [ ] Text: near-black not pure black; borders light gray (~85% white), never thin black.
- [ ] Gradients: two different hues in one gradient? (One hue, two values — or delete it.)
- [ ] Semantic colors: destructive = red, always. Success/warning present where needed?
- [ ] Color doing a job (state, data, focus) or just decoration?
- [ ] Dark mode: values FAR enough apart (4–6% steps)? Elevation gets lighter as it rises? Body text light-gray not white? Accents desaturated to 300/400?
- [ ] Contrast: adjacent tints distinguishable? WCAG on text over brand colors?

## 4. Spacing & sizing
- [ ] 4/8px grid held? One radius token, nested radii = outer − gap?
- [ ] Hero rhythm: subtext ~8px from heading, eyebrow ~12px, buttons ~32px (≥2× heading-gap)?
- [ ] Button padding horizontal ≈ 2× vertical? Chips thinner than buttons?
- [ ] Touch targets ≥44px? Identical-function elements pixel-identical?

## 5. Components
- [ ] Buttons: all states exist (hover, pressed, disabled, loading)?
- [ ] Icons: one library, consistent stroke/corner, sized to line-height, no emojis?
- [ ] Cards: hierarchy inside (image → key item → metadata)? Redundant "Label:" text? Whole card clickable instead of a per-card CTA?
- [ ] Forms: labels above inputs, realistic placeholders, focus + error states?
- [ ] Charts: labeled axes, gridlines, no smoothed lines, no rounded bar tops, bar count = data count?
- [ ] Carousels: dots + arrows grouped on a legible pill?
- [ ] Pricing: ≤4 plans, price bigger than plan name, honest billing note, next-tier delta shown?
- [ ] Empty/loading/error states designed?
- [ ] Footer conventional?

## 6. Motion
- [ ] Every interaction responds (hover/press/loading/confirm)?
- [ ] Any linear easing? Any motion that exists for its own sake or delays the product reveal?
- [ ] One deliberate, well-built surprise per page — and only one?
- [ ] Mouse-only effects have touch fallbacks? Scroll-jacking hindering navigation?
- [ ] Layout strong with animations disabled?

## 7. Depth & effects
- [ ] Shadows: y ≥ x, blur 1.3–2× y, opacity 15–20% — is any shadow the first thing you notice?
- [ ] Dark mode using shadows instead of lighter surfaces?
- [ ] Noise/glass/glow used sparingly and consistently?

## 8. Trust & conversion (landing pages)
- [ ] Social proof present (logo bar/badges/reviews) and NOT a paragraph in the hero?
- [ ] Real product imagery over stock? Cropped to the feature being sold?
- [ ] CTA near the top if the header lacks one? Sections segue into each other?
- [ ] Privacy/trust section if the product touches data or money?
- [ ] Offer copy sanity-checked as an OFFER (not just pixels)?

## 9. Mobile pass
- [ ] Type same-or-larger than desktop; one scroll direction per section; one thing per screen?
- [ ] Primary actions bottom, under the thumb? Press states everywhere?
- [ ] Gestures have button fallbacks?

## Scoring
Report as: **L1–L4 level estimate** + top 5 fixes ranked by ROI (layout first), each with a concrete value ("change X to Y"), not adjectives.
