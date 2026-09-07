# 04 — Launch workflows

Six workflows ship at launch. Each is a JSON document in the `workflows`
table (schema in `01-RUNTIME-CONTRACT.md` §3.1 `steps[]`); this file is the
human-readable source they are written from. Every workflow starts with the
planner, which may reorder or drop steps and must ask its questions first.

Legend: **R** = codex-scout, **S** = claude-skill, **C** = octa-code,
**G** = gemini-inline. Gates: review / approve.

---

## W1 · review-website — "راجع الموقع ده"

Input: URL (+ optional goal: leads / sales / brand, + competitor URLs).

| # | Runner | Skill / action | Output | Gate |
|---|---|---|---|---|
| 1 | G | Planner brief: confirm goal, audience, language of the site, what "better" means. Asks if unclear. | brief.md | — |
| 2 | R | Crawl the site (all public pages, ≤200), screenshots per page (Playwright), extract copy, tech stack, analytics tags | evidence/site/ | — |
| 3 | S | `cro` on home + top 3 pages | out/cro.md | — |
| 4 | S | `seo-audit` + `schema` check + `ai-seo` quick audit | out/seo.md | — |
| 5 | S | `web-perf` (Chrome DevTools MCP) on home + 2 pages | out/perf.md | — |
| 6 | S | `ui-forge` critique (register split, type, color, spacing) + `frontend-ui-polisher` audit | out/ui.md | — |
| 7 | S | `copy-editing` seven sweeps on hero + CTAs (in the site's language) | out/copy.md | — |
| 8 | R | If competitors given or found: 5 competitor sites, same checklist, ≥100 sources total | evidence/report.md | — |
| 9 | S | Planner (Claude) merges into one report: score card, top-10 fixes ranked by impact × effort, quick wins, copy rewrites, mockup notes; `stop-slop` pass | out/review.md + .pdf via `pdf.ts` brand template | review |
| 10 | G | Read the top-5 back by voice; create tasks for accepted fixes | tasks | — |

Acceptance: report exists in the conversation language, every score has a
rationale, every fix has an effort estimate, ≤20 min without competitors.

## W2 · build-website — "ابنيلي موقع لـ X"

Input: client/project name, goal, references, brand assets (or "make them").

| # | Runner | Skill / action | Output | Gate |
|---|---|---|---|---|
| 1 | G | Planner intake: pages needed, language(s), CMS or static, hosting, deadline, budget. Blocking questions. | brief.md | — |
| 2 | S | `product-marketing` → client context file (proposed edit to `knowledge/clients/`) | knowledge proposal | review |
| 3 | R | Market + competitor scan (≥100 sources) if no persona exists for this client | evidence/ | — |
| 4 | S | `site-architecture` → sitemap, nav, URLs | out/sitemap.md | review |
| 5 | S | `copywriting` per page in brand voice (+ `stop-slop`) | out/copy/*.md | review |
| 6 | S | `web-ui-designer` → design system (palette, type, components); `ui-forge` register decision | out/design-system.md | review |
| 7 | S | `frontend-ui-polisher` craft pass on a static HTML prototype of home + 1 inner page | out/proto/*.html | approve (look) |
| 8 | C | Octa Code spec from steps 4–7 → build (Astro/Next/static per decision) in isolated workspace, QA loop | build branch + preview | review |
| 9 | S | `seo-audit` + `schema` + `web-perf` on the preview; fixes fed back to step 8 (max 2 loops) | out/qa.md | — |
| 10 | S | `prism-store-builder` instead of 8 when the site is a Shopify store | theme branch | review |
| 11 | S | Handoff doc + `launch` checklist + `directory-submissions` plan | out/handoff.md | approve (deploy) |

Acceptance: preview URL opens, Lighthouse ≥90 perf/SEO on home, copy in
the right language(s) with RTL correct, all pages from the sitemap exist.

## W3 · market-project — "اعمل ماركتنج لمشروع X"

Input: project or client, goal (leads/sales/brand), budget, channels, timeline.

| # | Runner | Skill / action | Output | Gate |
|---|---|---|---|---|
| 1 | G | Planner intake using `performance-marketer` Step 1–2 questions (business intake, product classification). Blocking questions. | brief.md | — |
| 2 | R | Dream buyer persona research: ≥100 sources, multilingual, forums/reviews heavy (`02-RESEARCH-ENGINE.md` §4) | evidence/persona | — |
| 3 | R | Competitor study: ≥5 competitors, ≥100 sources (§5) | evidence/competitors | — |
| 4 | S | `performance-marketer` Steps 3–5 with the evidence: persona sheet (32 fields, sourced), market gap, offer draft (`offers`) | out/persona.md, gap.md, offer.md | review |
| 5 | S | `marketing-plan` (13 sections, AARRR) or `marketing-os-workflow` when it is a full OS engagement | out/plan.md | review |
| 6 | S | `growth-os` / `brand-building` → 30-day content plan, pillars, hooks; `social` → first week's posts; `ad-creative` + `ads` → first campaign structure and 10 ad variants | out/content/, out/ads/ | review |
| 7 | S | `carousel-studio` (+ `carousel-forge` render) for the first 3 carousels; `image` for statics; `photoshop-posts` when the client edits PSDs | out/creative/ | approve (before publish) |
| 8 | S | `analytics` tracking plan; `emails` welcome sequence if there is a list | out/tracking.md, out/emails.md | review |
| 9 | S | `copy-editing` + `stop-slop` + `fact-checker` over everything outward | — | — |
| 10 | G | Queue approved posts to the social queue; schedule week-2 generation as a recurring job | job schedule | approve |

Acceptance: persona and competitor reports each pass the depth gate; plan has
budget math; first week of content exists in the right language; nothing
published without approval.

## W4 · think-project — "فكّر معايا في X"

Input: a topic, decision, or idea, spoken.

| # | Runner | Skill / action | Output | Gate |
|---|---|---|---|---|
| 1 | G | Clarify: is it a decision, a design, or an open exploration? What would "decided" look like? (asks) | brief.md | — |
| 2 | R | Background research when facts matter: ≥100 sources, multilingual; skipped for purely personal choices | evidence/ | — |
| 3 | S | `lateral` router picks the technique: `six-hats` for decisions, `concept-fan` for "are we solving the right thing", `inversion` for assumptions, `scamper` for variations, `worst-idea` when ideas feel timid | out/session.md | — |
| 4 | S | `fact-checker` on the claims the session leaned on | out/checks.md | — |
| 5 | S | Decision memo: options, recommendation, risks, next 3 actions, what would change the decision; `stop-slop` | out/memo.md | review |
| 6 | G | Spoken summary; on "go": tasks created, one dated line added to `knowledge/decisions.md` | tasks, knowledge proposal | approve (knowledge edit) |

Acceptance: memo in the conversation language, options ≥3, recommendation
with explicit assumptions, tasks created only after "go".

## W5 · invoice — "ابعت فاتورة لـ Y"

| # | Runner | Skill / action | Output | Gate |
|---|---|---|---|---|
| 1 | G | Resolve client, period, scope; pull hours from time tracking and tasks; confirm line items by voice | draft items | — |
| 2 | G | `invoiceDocument()` → PDF with client brand; `xlsx` when the client wants a sheet | out/invoice.pdf | approve |
| 3 | G | Send via the configured channel (email / WhatsApp text prepared) | sent | approve |
| 4 | G | Schedule follow-ups at +7/+14/+21 days using `list_overdue_invoices`; `cold-email` style reminder copy in the client's language | scheduled jobs | — |

Acceptance: PDF matches the brand, numbers reconcile with time tracking, no
send without approval, follow-ups appear in tasks.

## W6 · research — "دوّر لي على X"

The bare research engine as a workflow: brief → language plan → ≥100 sources
→ report → spoken summary → saved to `knowledge/personas|competitors|projects`.
Used standalone ("عايز أعرف كل حاجة عن السوق ده") and by W1–W4.

---

## Recurring jobs (scheduled via `task-trigger.ts`)

| Job | Cadence | Skills | Autonomy at launch |
|---|---|---|---|
| Daily brief with open gates, overdue invoices, stale jobs | daily 08:00 | existing `daily-brief.ts` + `morning` layout | auto |
| Prospect list refresh | weekly | `prospecting` → Clients page | assisted |
| Competitor watch per active client | monthly | W6 with delta vs last run | assisted |
| SEO + perf check per live client site | monthly | `seo-audit`, `web-perf` | auto (report only) |
| Content batch for next week | weekly | `social`, `carousel-studio` | assisted |
| Brain consolidation | monthly | planner + `vault-librarian` | assisted |

## Writing a new workflow

The planner can propose a `custom` workflow from skills in the manifest; if
it runs cleanly twice, Octa offers to save it as a named workflow. Bedo can
also dictate one: "لما أقول كذا، اعمل كذا وكذا". `skill-creator` writes a new
skill when a step has no skill; Octa Code builds a tool when a step needs code.
