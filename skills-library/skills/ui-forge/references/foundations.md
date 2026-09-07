# Foundations — Layout, Typography, Color, Spacing

Distilled from 50 practitioner teardowns. Numbers are defaults, not laws — break them with intent, never by accident.

## Layout & Grid

### The grids
- 12-column grid + 8px spacing are guidelines, not law. Use strict grids for repeating/structured content (galleries, blogs, product grids): 12 cols desktop → 8 tablet → 4 mobile. Custom landing pages routinely break column alignment — fine.
- 4-point grid's real value: every value is a multiple, so anything splits in half cleanly. It buys consistency, not beauty.
- Whitespace outranks grids: "letting things breathe" is the higher-order rule.
- Set explicit column grids BEFORE aligning. If one element must break the grid slightly and still feels balanced, leave it.
- Design to real viewport reality: full-screen desktop ≈ 1920px wide but only ~1000px tall after browser chrome. Dribbble shots cheat with ~50% taller canvases — squish to real dimensions before judging.
- Assess the fold first: don't burn vertical space on a huge header while the money content sits below the fold.

### Variety & rhythm
- Boring sites repeat one column layout (image-left/text-right alternating all the way down = template tier). Vary: full-screen section → 3-column cards → stacked single column → bento → slider.
- Two consecutive sections with the same layout but different content is lazy — flip one, or convert to bento/slider.
- If stacked content blocks all line up identically, flip the middle one (image left ↔ right).
- Convert a 2-column feature layout into one large stacked vertical column (Apple-style) so users focus on one feature at a time.
- Replace a boring row of 4 equal cards with a bento grid. Bento arrangement must respect asset orientation (vertical images need a different arrangement than horizontal). Simple-grid bentos (Butter, Kit, Ramp) beat Apple-style complex ones — buildable; one slightly tilted card inside adds interest.
- "Straight line grid": visible thin border lines forming the section structure (Vercel style) instead of floating cards. Framing the page with vertical lines running its full length also makes very-wide screens trivial.

### Breaking the box
- Overlap elements across section boundaries; shift cards in a row up/down; let card strips extend off the frame edge (implies scrollability). Start with small offsets before full overlaps.
- Decorative elements outside the grid must trail off in density away from the center so the eye is pulled to the message. Keep generous clear space around the text.

### Hero anatomy & wireframing
- Nearly all heroes share one skeleton: 4 zones — main text block, navbar, stats/proof row, hero visual. Learn to see it, then remix.
- Hero layout options are finite: text beside image; full-screen image under text; text top + visual below; (rare) text below image. Text alignment: centered (most common), start-aligned, or body+CTA kicked to one side. Visual: defined-border image, full-bleed, or carousel.
- Layout follows content intent: profound statement → centered, bigger type, breathing room. Feature list → text supports visuals. Too many features for one screen → bento so nothing is lost on scroll.
- Never obstruct the hero image's focal point — slide text off it first; busy image areas kill legibility.
- "Frankenstein" wireframing: borrow one section pattern per reference site (hero from A, logo ribbon from B, feature tabs from C, testimonials from D, CTA from E), keep only the wireframes, discard styling, then apply your own identity. Same layout + different visual identity = wildly different site — separating layout from identity is the mastery move.
- Trending section patterns worth stealing: cards floating on dark bg (tight precise gaps); thin cropped photo "interlude" strip between text-heavy sections; giant display text (~290px) with tiny nav below it; gallery = one large image + arrows + dots; stacked cards sliding up on scroll (3–5 steps); horizontal card scroller (3–10 cards max); cutout image-in-text (boolean-subtract uppercase letters from a photo); text-only whitespace section (body needs 3+ lines or it feels empty).

### Conventions & hierarchy
- Information flows top-to-bottom, right-to-left in RTL (left-to-right in LTR); nav on top; CTAs easy to find. Respect 30 years of user expectations — differentiate with micro-interactions, not rearranged fundamentals.
- One primary CTA per header/screen. Give users one, max two, things to look at and click; delete the rest.
- Hierarchy comes from proximity: group related elements tightly. Equal huge gaps everywhere = no hierarchy; nothing should "float alone." Both under- AND over-whitespace are failures.
- Cut page length aggressively — a page far longer than its content needs feels unprofessional. Fix via information-architecture overhaul, not spacing tweaks.
- Don't mix two visual styles on one page (airy hero up top, dense small-text specs below) — reads as two different websites.
- Kill redundant pages/sections: two pages selling the same thing → condense; a homepage that only redirects shouldn't exist.
- Fewer containers, fewer lines: remove card borders/dividers and let spacing do the grouping. Cards have a much larger footprint than card-less layouts.
- Line dividers used deliberately are back; they can have rounded corners; avoid "line on everything."

## Typography

### Font choice
- 1 font is fine (a solid sans); 2 is the sweet spot (display+sans, or sans+serif); 3 is the max and only as display-heading + sans-body + mono/serif-caption; 4 = never.
- NEVER use display or handwritten fonts for small paragraph text — ornamentation breaks at small sizes.
- Serif = older, authoritative, legible small; sans = clean, modern, interface default; display = large text only.
- Use text as a visual element: one (max two) giant display-font moments per page.
- You'll use the same ~3 fonts for 90% of projects — that's fine.

### Scale — the math
- Golden ratio 1.618 per step grows too fast from 16px base. Use **√1.618 ≈ 1.27** as the step multiplier for websites; **∛1.618 ≈ 1.17** for dashboards/mobile (dense UIs need tighter jumps).
- Simple two-level case: header = body × 1.618.
- Max ~6 font sizes for a landing page. Dashboards compress hard — rarely anything above 24px.
- Fluid type: `clamp(min, calc(...vw-based...), max)` bounded to the 320–1920px design range.
- iOS base = 17px, macOS base = 13px — mobile type gets LARGER than desktop, never smaller.

### Setting type
- Large headings: letter-spacing −2% to −3%, line-height 110–130% — instantly professional. Don't trust "auto" leading on display sizes.
- Paragraphs: line-height ~150%. Smaller text or longer lines → more leading; larger text → less.
- Letter spacing: large text needs less, small text needs more.
- Max **2 weights** per design, separated by at least one intermediate step (Regular+Semibold, not Regular+Medium).
- Hierarchy tools = size, weight, color (beginners use size only). Thin weight ≈ low opacity ("fewer dark pixels") — interchangeable levers; you can build a whole hierarchy with color alone or weight alone.
- Don't auto-bold the H1: large size already wins. Keep the big header regular, bold the subheads for scannability. Never give the smallest text the least contrast.
- Verbally list the hierarchy of every text element (H1 → subhead → body → caption) and map styles to it.
- Avoid extreme size jumps between heading and body in one section.
- Truncate long strings by design; test with worst-case content, never "perfect content," no lorem ipsum.
- Copy: friendly natural language over corporate jargon ("we sweat the details"). Punchy short headline beats descriptive. Never restate the company name in the headline next to the logo.
- Hero copy budget: ~7 words in the headline, ~14 in the subtext.
- Above ~70–80px, negative tracking (−2% to −4%) is mandatory or the headline looks disjointed.
- Same-size hierarchy: two equal-size lines, second at ~55% opacity — size isn't the only lever.
- A serif mixed into a sans design adds personality when the sector suggests it (menu-like serif for food).

## Color

### Palette discipline
- Max 2 text colors: primary (near-black/near-white) + same color at **45–70% opacity** for secondary.
- 60-30-10 as a starting instinct (60% dominant neutral / 30% secondary / 10% accent) — but it's a diagnostic, not a formula; see review-checklist.md for when it misleads.
- Escape the upper-right corner of the hex picker: pure saturated hues are the beginner tell. Muted colors (baby blue, beige, lavender), off-whites in light mode, blue-tinted blacks in dark mode signal seniority.
- Prefer grays over pure black/white: most "black" text should be very dark gray or a dark brand-tinted hue; secondary metadata = mid gray; borders = light gray. Comfort with gray separates professionals from mediocre designers.
- Tint neutrals with the brand hue (gray + hint of brand color) for on-brand backgrounds that don't overpower.
- Start with one primary color: lighten for backgrounds, darken for text — that's halfway to a full ramp (powers chips, states, charts).
- From a palette generator's 15 suggestions, take only the 1–2 that catch your eye.
- Extending a cramped brand palette: rotate the hue slightly for analogous companions; take the complement across the wheel for the accent — all will harmonize. If the brand color fails WCAG with white text, darken it or use a passing complement. Adapt brand colors to serve the design.

### Numeric color systems (use these when building from scratch)
- HSB ramp formula: each darker step = saturation +20, brightness −10, and shift hue ~20 points toward the perceptually dark hues (blue/purple darkest; yellow/red lightest).
- Zero-effort palette: Tailwind shades — light mode = shade **50** background + **500** accent; dark mode = **950** background + **300** primary. Works for every hue. Generate custom ramps at uicolors.app.
- Never pure-white/pure-black page backgrounds — use a very light or very dark version of the accent hue (GitHub's near-black blue).
- Light-mode text tints: headings ≈ 11% white (near-black), body 15–20%, subtext 30–40%.
- Light-mode card borders: never thin black — ~85% white gray stroke.
- Button importance = darkness: ghost → tinted → solid dark. Secondary buttons sit ~90–95% white.
- Accent is a ramp, not one color: main = 500/600, hover = 700, links = 400/500. Dark mode: primary drops to 300/400 (hover 400/500).
- Dark mode doubles distances: if light-mode neutral layers sit 2% apart, dark-mode layers need 4–6% apart. Elevation in dark mode ALWAYS gets lighter as it rises (brightness +4–6, saturation −10/−20 per layer) — or use a border.
- App frames/sidebars: only slightly darker than content (~2% hue-tinted shift) — large areas need tiny shifts.
- Theming any neutral design: per neutral, in OKLCH do lightness −0.03, chroma +0.02, then set the brand hue — reliable in both modes.
- Chart series: fix lightness+chroma in OKLCH, increment hue ~25–30 per series for uniform perceived brightness. Neutral charts are lame; one-hue ramps too similar.
- 60-30-10 is a MARKETING-page rule; product UIs invert it (Vercel ≈ 90% black / 8% white / 2% red). A product app needs ~4 background layers, 1–2 strokes, ~3 text tints.

### Color with purpose
- Semantic color carries meaning: red = danger/destructive (non-negotiable, even off-brand), green = success, yellow = warning, blue = trust. Notification-badge red is swappable for a brand color; destructive red is not.
- Introduce color through data and function (charts, status, focus states, "new" chips) rather than colored buttons and containers.
- Icons need no color — their job is being recognizable symbols. Reserve color for state (active tab).
- Introduce the bright accent only on interaction (accent appears on CTA hover) to keep it tasteful.
- States via color alone: hover = slightly lighter; pressed = slightly darker; disabled = desaturated. Mobile has no hover — a darker press state is mandatory.

### Gradients & backgrounds
- Gradient rule: both stops = variations of ONE hue (darker/lighter), never two hues. Most designs are cleaner with the gradient removed entirely.
- A very subtle background gradient keeps a hero from feeling flat. Dark-mode trick: gradient of two brand colors slid way down in lightness — subtle color without saturation.
- Replace flat white with off-white, or add a noise/texture overlay — sparingly (too much = TV static).
- Section background clashing with imagery? Sample colors directly from the imagery above until it harmonizes.
- Text over photos: gradient scrim behind the text zone (never a full-screen dim — it ruins the image); add progressive blur on the scrim for the premium look.

### Dark mode
- Dark mode is NOT inverted light mode. Dark surfaces need BIGGER value differences to read as distinct; collapse values when going dark→light.
- Depth without shadows: make the card lighter than the background.
- Body text = light gray, not white (eye strain); reserve pure white for the most important text/actions.
- Desaturate and lighten accents; dim borders that over-contrast; chips = dimmed fill + brighter text.

## Spacing & Sizing
- Work on a 4px/8px base grid religiously. For large dimensions round to the nearest 5–10 (120 vs 128 is invisible); make large steps exponentially bigger.
- Beginner UIs are packed too tight; mobile needs MORE space than you think.
- Hero rhythm: ~32px between stacked items, then pull related pairs closer (eyebrow+headline, headline+subtext) — proximity grouping IS hierarchy. Reference values: subtext 8px from heading, eyebrow 12px above, buttons 32px below (at least 2× the heading→subtext gap — big type's baseline already carries space).
- Chips: vertical padding = ¼–½ of horizontal (20px horizontal → 5–10px vertical). Chips are thinner than buttons and never wear the primary CTA color.
- Lists: generous spacing over divider lines; if rows must be tight, subtle alternating-row background instead of lines. "The fewer elements to make your point, the better."
- Button padding: horizontal ≈ 2× vertical.
- Icon size = the adjacent text's line-height (24px line-height → 24px icon); most icons are too large by default.
- Touch targets ≥ 44px.
- One corner-radius token for all small components (~10px); matching radius language everywhere (sharp images next to rounded buttons = disconnect). Nested radii: inner = outer − padding.
- No card-inside-card double nesting — group with whitespace instead.
- Identical-function elements must be pixel-identical (size, radius, style).
- Consistency machinery: tokens for colors, variables for measurements, components for repeated UI. Same margins/type scale across all cards of a system.
