# Components, Depth & Effects

## Buttons
- Every button needs 4 states minimum: default, hover, active/pressed, disabled (+ loading spinner when relevant). Pressed = slightly darker; hover = slightly lighter/brighter; disabled = desaturated (light gray bg + muted text survives dark mode with no other cues).
- Not every button needs a background. Two side-by-side equal-weight buttons = broken hierarchy: delete the second, or strip it to ghost/border-only/low-opacity.
- Destructive action gets the filled red primary; Cancel gets border-only or low opacity.
- Primary CTA in nav and hero: same label + same style (same label = same destination mental model). Nav gets ONE visually dominant action, not a flat row of identical links.
- Padding: horizontal ≈ 2× vertical. Sidebar links are ghost buttons.
- Buttons should almost always have a small animation (see motion.md).

## Cards
- Spreadsheet-looking card → add hierarchy: image/icon on top, most important item large/bold, metadata small below, price/number in accent at the corner.
- Kill redundant labels: if the card needs "Location:" labels, the layout isn't clear enough. Group like items (name+location stacked; price+rating stacked and end-aligned; details in one icon row).
- In repeating card grids drop the per-card CTA — the whole card is the link; arrow icon fades in on hover. Keep an explicit CTA only for specific actions ("جرّبه الآن").
- Card hovers that read premium: image zooms out + CTA reveals; or blur image + enlarge + reveal extra text; long descriptions behind a "see more" sliding up over the image.
- Fancy image card: image at ¾ card height with a long smooth gradient rising from the bottom, text on top — works only with calm images; the plain version always works.
- Collapse multiple action buttons into a ⋯ menu; chips → icons; key metric to the far edge.
- No card-inside-card. Match radius language across the whole system.
- Nested rounded corners: inner radius = outer − gap (outer 30, gap 10 → inner 20). Breaks when gap > outer radius — then eyeball. Pills are exempt.

## Navigation
- Dropdowns with images/thumbnails per link convert better than text-link lists — context before the click.
- Mega menus signal product depth; premium behavior: once open, stays open and slides content between sections instead of close/reopen per hover.
- Links overflow → consolidate into an animated menu; one dominant product → hamburger the rest, spotlight the product.
- Search bar can double as layout balance in a nav; collapse to icon that expands on click when browsing is the priority.

## Forms & inputs
- Labels ABOVE inputs, never placeholder-only (users forget mid-typing); placeholders = realistic example content.
- Inputs need focus state, error state (red border + message), sometimes warning.
- Off-white input backgrounds with ~40%-opacity strokes.
- Signup: "Create account" heading to disambiguate from login + visible Login escape-hatch link.
- Sparse create-flows belong in a modal, not a page; collapse advanced options by default.
- Preset-choice screens (allergies, sizes): always add a search fallback + a Skip button for the null case.
- Slide-to-confirm for irreversible/high-impact actions.

## Pricing tables
- 3–4 plans max. Shrink the plan name, enlarge the price. Show the actual discount amount and the honest "billed annually / actually X/mo" note.
- List what the next tier ADDS over the current one; optionally include one feature the plan does NOT get.
- CTA can move to the top of the card if downgraded to stroke-only. Make CTA copy actionable.
- Separate price block from features with a reduced-opacity brand-color background rather than a divider.
- The CTA itself can be one of the plan cards (gradient stroke) instead of a floating button.
- Audience-splitting: features for ~2% of visitors (Enterprise) get a tiny link, not their own section.

## Tables & lists
- Data drives the form: enum columns → chips; numbers → end-aligned so digits align; truncate long text; gray out inactive rows; time-sequenced data is a timeline, not a table.
- Search + filter + sort turn a display into a tool.
- Separation: whitespace, dividers, OR alternating rows — pick one, prefer whitespace.
- Bulk selection revealing a contextual bulk-actions button = the canonical dashboard micro-interaction.

## Charts
- Non-negotiables: labeled axes, value gridlines, bar count matches data periods, NO curved/smoothed lines (they hide the data points), no rounded-top bars, no heavy fade on the newest data.
- Add: time-range switcher (dropdown if cramped, segmented if not), compare-previous-period as a gray overlay line + legend, full-screen expand, hover = value bubble + dim non-hovered bars.
- Income vs expenses → two-sided bar chart. Favicon/avatar per bar for identification.
- Don't pair a chart with a stat showing the same data — pick one.

## Icons
- One interface library (Phosphor, Lucide, Feather), filtered by stroke width + corner style. NEVER emojis in product UI.
- Cards without icons force reading — add them. Icon size = adjacent text line-height.
- Small icons must be minimal; detail scales with size. Unlabeled is fine only for universal glyphs; obscure ones need labels or delayed tooltips.
- Icons don't need color; save color for state. If gradient icons feel noisy, flatten to one brand color.
- Save/like icons over imagery: put them in a circle chip to guarantee contrast.

## Overlays: popover vs modal vs page
- Popover = simple, non-blocking, click-away-safe context (display settings).
- Modal = complex same-page context, blocking (create/cancel); follow changes with a confirmation toast.
- New page = permanent/large context — back button or breadcrumb mandatory.
- Toasts = the notification system: slide up, interactive states (loading → success + particle burst).
- Lightbox for option/detail views: full-bleed photo, gradient scrim under text, don't forget the close X.

## Carousels & galleries
- Always show position (dots) + arrows, grouped on a blurred dark pill so they survive any image; arrows sit NEXT to the dots, not floating at the edges.
- Bonus: active dot becomes a circular auto-advance timer. 3–10 cards for horizontal scrollers; more → switch formats.
- Load-more button > infinite scroll (users can reach the footer).

## Footers
- Don't copy 23-link enterprise footers for a 5-link site. 3–5 links: centered links, logo above, socials below, copyright one side, credits the other. Columns only when link count demands.
- Footer conventions are settled — copy a conventional footer, don't innovate there.

## Empty states
- First-run: invite action — spotlight the primary button, full-screen empty state + one instructional popover, small animation + message + clear next step.
- No-results: imagery + acknowledge the miss + typo suggestions + an exit action.

## Depth, shadows, effects
- Shadow formula: x ≤ y; blur = 1.3–2× the y offset; opacity 15–20%. Better than lowering opacity: make the shadow a light gray color and raise the blur. If the shadow is the first thing you notice, it's wrong.
- Cards = weak shadows; layered content (popovers, dropdowns) = stronger.
- Light-mode washed-out cards: fix with the ~85%-white border, not more shadow.
- Dark mode: no shadows — surfaces get LIGHTER as they rise; or use a border.
- Tactile/raised buttons: inner + outer shadows combined.
- "Dark soft glass" recipe: dark bg + semi-transparent panel + subtle gradient + backdrop blur + 1px border + soft inner shadow; optional slow border shimmer.
- Ambient glow: large blurred circles of the accent behind the UI (dark mode); or duplicate an image, blur the copy, layer behind the original.
- Noise/grain: warms dark backgrounds, improves text contrast over images, makes flat backgrounds feel designed — sparingly.
- Sticker/badge treatment: 12-point star or pill, drop shadow = darker version of the sticker color at 100% opacity offset (reads as print, not blur). Quirky display font, optional outline.
- Progressive blur + edge fade on logo marquees; skewed product screenshots as graphics; text-behind-subject only when sliding the text off the focal point fails.
- Mesh gradient by hand: stack 8–10 transparent blurred circles, upper ones in Overlay blend.
- Photo too bright under text → subtle dark overlay; need more sky → duplicate image, flip vertically, crop.
