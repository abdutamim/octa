# Apps — Dashboards, Mobile, Desktop

## Dashboards

### The three beginner tells
1. Data doesn't drive the form (decorative charts, forms that ignore content).
2. Nothing is progressively disclosed (everything ingrained in the chrome).
3. No invisible UI (tooltips, hover states, empty/edge states missing) — often MORE UI than the visible layer.

### Structure
- One dashboard, one job done well. If it needs a PhD, it's too complex.
- Sidebar = the spine: top = logo/profile (avatar + chevron signifies clickable); links = icon + short label (survives collapse, supports badges); grouped by relevance; Settings/Help pinned to bottom; nest into dropdowns as links grow; active state required. Spare space can host inline notifications.
- Top strip = page-level actions (view dropdown + primary create button).
- Grid placement = tier list: rank every module high/mid/low priority; important → higher and further toward the reading-start edge. Place high first, fill gaps with low.
- Tabbed page shells (Overview/Billing/Usage) scale gracefully — new features become tabs, not denser layouts.
- Only 4 building blocks: lists/tables, cards (incl. charts, toasts), inputs/forms, tabs.
- Main content area = what matters most to THIS user (project status for PM tools, portfolio for finance).

### Redesign process
- Audit hierarchy first, delete ruthlessly: duplicate search bars, decorative diagrams with no context, cards duplicating other cards' data, KPI rows repeated across pages.
- Merge related widgets; move global chrome into a collapsible sidebar; turn buried features into first-class modules.
- Whether an element is worth keeping = does it have context (labels, units, dates)? Pretty diagram without context is decoration; add amount/date/place and it becomes an alert.
- Repurpose before deleting: rotate it, recolor it, give it real data.
- KPI tiles → add sparkline micro-charts; geographic data → shaded map + table; aggregate charts → per-item split toggle.
- Alerts lead with the status icon, then amount/date/place.
- AI-generated dashboard cleanup list: fonts, alignment, color (the three things AI reliably gets wrong) + semantic color reuse, vague statuses → percentages, sidebar alignment, "MENU" labels deleted.

### Progressive disclosure
- Spectrum of explicitness: global visible button → icon+label → icon on hover + tooltip → hidden in popover/long-press. Rank actions by frequency and place accordingly.
- Tooltips are the #1 missing element — assume icons and labels are ambiguous.
- Onboarding IS progressive disclosure: one tooltip at the most important action, then the next; or a corner checklist. A 6-bullet welcome modal is instantly forgotten.
- New features usually need a well-thought-through overlay, not a dedicated page.

### Type & color for dashboards
- Separate smaller type scale, ∛φ ≈ 1.17 steps, rarely anything above 24px.
- Color comes FROM the data (status red, category chips, avatars) — never sprinkled. Product UIs are neutral-dominant (~90/8/2), not 60-30-10.

## Mobile

- Bottom nav: 3–4 links ideal, 5 hard limit; targets ≥44px; press states mandatory (no hover exists).
- Too many nav items → sidebar becomes a home/hub page, freeing the bottom bar for a big action.
- Tab bar details: icons on one line (no raised center "+"), active state is enough (don't dim inactive into invisibility), avatar replaces the user icon once uploaded, labels only if icons are obscure.
- Don't shrink desktop UI: type and spacing stay same or LARGER (iOS base 17px); one desktop-widget's worth of content per screen.
- Layout law: each mobile section scrolls in exactly ONE direction — stack vertically or scroll horizontally off-page, never both.
- Only 4 building blocks: cards (grouping where whitespace is scarce), text/links, images, inputs.
- One screen = one thing (home excepted). New feature → new page, not a denser layout.
- Bottom sheets keep context: any height, title + search + confirm/cancel, gesture-dismissable, background zooms out as it rises.
- Contextual chrome: entering an editor hides the navbar and reveals formatting; a picker hides everything except confirm + X.
- Fitts efficiency: speed = target size ÷ distance. Primary actions huge and under the thumb; right-edge stacks serve the right-handed 70–80%; important controls at the BOTTOM (top-heavy fails ergonomics).
- Fewer options = better decisions — remove choices, don't shrink them. Friction removal compounds (auto-play, auto-snap).
- Story-format content: scroll between slides beats tap-through; dots double as progress bars; chapterize with a bottom chip; view-summary dashboards make stats shareable without replaying.
- Evolve familiar layouts, don't replace them.

## Desktop / native apps
- Native feel = the app is a system, not a destination: global-shortcut summoned panels (Spotlight/Raycast), Esc dismisses, Enter collapses into a toast.
- Utility layout: top bar = global actions, sidebar = navigation, center = content; skip the sidebar when navigation is trivial. Top ~50px = drag region, keep it uncluttered. macOS base type = 13px.
- Search prominent and always accessible; command palettes pull users away — a floating search + slide-out preview keeps a one-screen app one-screen.
- Every keyboard shortcut needs visible feedback or users assume failure; teach via onboarding modal (closed by performing the shortcut) + cheat sheet in settings.
- Drag-and-drop of anything in AND out of the app is the effortlessness benchmark.
- Guiding question: "What is the minimum UI needed to let the content shine?"

## Gamification (engagement patterns)
- Five pillars: central currency (XP) → visible progress (% + what's left) → social layer (leaderboards, badges) → rewards tied to REAL goals (worthless rewards kill the loop) → completion triggers (profile-completeness meters).
- Duolingo loop: two activities → XP → league rank + quest chests → second currency → modifiers; punishment (hearts) + streaks + reminders.
- Leaderboards: promotion zone / safe middle / demotion zone; localize for markets.
- Personalized-stat formulas that get shared: superlatives ("most-skipped"), time-flavored labels ("late-night anthem"), YoY deltas ("+120%"), obsession percentages ("87% of streams from one track"), quirky emoji-representable symbols.
- Even an intentionally annoying feature needs a visible off switch.
- Onboarding order: welcome → connect → reassurance/trust → show value with personal insight BEFORE any asks → then goal setup.
