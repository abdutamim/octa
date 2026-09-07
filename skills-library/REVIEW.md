# Skills review

Reviewed 2026-09-05: 110 folders. Every folder has a verdict, an autonomy grade and the place it plugs into Tamim OS.

| Verdict | Count | Meaning |
|---|---|---|
| core | 31 | Core: wire into a workflow now |
| keep | 55 | Keep: available in the library, run on demand |
| merge | 0 | Merge: delete this variant, keep the target |
| reference | 15 | Reference: docs the agent may read, never a job |
| client | 1 | Client-specific: template for per-client skills |
| drop | 8 | Drop: no use in Tamim OS |

Autonomy: **auto** = can run on a schedule and report; **assisted** = agent produces the deliverable, human approves; **led** = human does the job, skill advises.

## Working set by department

### commerce (1)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `prism-store-builder` | keep | assisted | HTML design → PRISM Shopify theme. Shopify client projects. |

### customer (1)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `churn-prevention` | keep | led | Cancel flows and dunning. SaaS/subscription clients only. |

### deals (4)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `offers` | core | led | Offer design (value stack, guarantee, scarcity) before any proposal. Runs once per service, result stored in company brain. |
| `pricing` | keep | led | Tiering and price-increase logic for Tamim services; pairs with offers. |
| `revops` | keep | assisted | Lead lifecycle stages + scoring model for the Clients page pipeline. Use once to design the stages. |
| `sales-enablement` | keep | assisted | One-pagers, objection docs, demo scripts per service. Output goes to DocumentEditor. |

### design (10)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `carousel-forge` | core | assisted | Own measured carousel system (94 slides, 7 laws, HTML→PNG renderer, image gen). Production engine for posts. 17 MB corpus. |
| `carousel-studio` | core | assisted | Arabic carousel workflow for any brand: diagnosis → hook → chassis → render. Front door to carousel-forge. |
| `photoshop-driver` | core | assisted | Low-level Photoshop automation (ExtendScript, psd-tools, Arabic). Used by photoshop-posts. |
| `photoshop-posts` | core | assisted | HTML design → layered PSD with live text → client-editable variants. Deliverable pipeline for design clients. |
| `tamim-carousel` | core | assisted | Same workflow locked to Tamim brand rules and pillars. Use for Tamim posts only. |
| `ui-forge` | core | assisted | Own UI system from 50 video teardowns with measured rules. Use for client landing pages/dashboards and for Tamim OS itself. 15 MB corpus. |
| `frontend-ui-polisher` | keep | assisted | Command-based UI polish (audit/bolder/clarify/animate). Apache. Use on existing client UIs. |
| `image` | keep | assisted | Marketing image generation/optimization guide (model choice, prompts, WebP). Pairs with growth-os rendering. |
| `video` | keep | assisted | AI/programmatic video (Remotion, HeyGen, Veo). growth-os already uses Remotion; this is the reference. |
| `web-ui-designer` | keep | led | Style/palette/font databases (CSV) + stack rules. Reference when starting a design system. |

### documents (4)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `docx` | core | auto | Word contracts/reports. Alternative to the in-app PDF path when clients want editable files. |
| `pdf` | core | auto | Read/merge/fill PDFs; extract data from client-sent PDFs into tasks/invoices. |
| `pptx` | core | assisted | Pitch decks and client presentations from sales-enablement output. |
| `xlsx` | core | auto | Invoices/quotes/trackers as spreadsheets; financial models. |

### engineering (23)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `skill-creator` | core | assisted | The master agent uses this to author new skills + evals when no skill fits. Build path #1. |
| `agents-sdk` | reference | led | Cloudflare Agents SDK. Only if Tamim OS ever gets a cloud agent runtime. |
| `cloudflare` | reference | led | 320-file Cloudflare docs mirror. Needed only when deploying client sites/workers on Cloudflare. |
| `cloudflare-email-service` | reference | led | Transactional email via Cloudflare. Possible send path for cold-email later. |
| `durable-objects` | reference | led | Cloudflare DO reference. |
| `mcp-server-builder` | keep | assisted | When a client integration needs an MCP server (Notion, CRM). Build path #2 helper. |
| `speckit-analyze` | keep | auto | Consistency check across spec/plan/tasks. |
| `speckit-checklist` | keep | auto | Requirement checklists. |
| `speckit-constitution` | keep | led | Project principles doc. |
| `speckit-git-commit` | reference | auto | Git helper; octa-code covers this. |
| `speckit-git-feature` | reference | auto | Git helper. |
| `speckit-git-initialize` | reference | auto | Git helper. |
| `speckit-git-remote` | reference | auto | Git helper. |
| `speckit-git-validate` | reference | auto | Git helper. |
| `speckit-implement` | keep | assisted | See speckit-specify. |
| `speckit-plan` | keep | assisted | See speckit-specify. |
| `speckit-specify` | keep | assisted | Spec-kit flow: spec → plan → tasks → implement. Lighter alternative to octa-code for small tools. |
| `speckit-tasks` | keep | assisted | See speckit-specify. |
| `speckit-taskstoissues` | keep | auto | Tasks → GitHub issues. |
| `turnstile-spin` | reference | led | CAPTCHA setup for client forms. |
| `web-perf` | keep | auto | Core Web Vitals audit via Chrome DevTools. Pairs with seo-audit for client sites. |
| `workers-best-practices` | reference | led | Cloudflare Workers review rules. |
| `wrangler` | reference | led | Cloudflare CLI reference. |

### intelligence (3)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `competitor-profiling` | core | auto | Monthly competitor dossiers from URLs. Needs Firecrawl/DataForSEO or fall back to WebFetch. Stored in vault. |
| `customer-research` | keep | assisted | Persona/VOC synthesis from transcripts, reviews, Reddit. Feeds performance-marketer step 3. |
| `fact-checker` | keep | auto | Verify claims in proposals/content before publishing. Chain into the approval gate. |

### marketing (37)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `ad-creative` | core | assisted | Bulk ad copy variations + iterate from performance data. Pair with Zeely-style static-ad prompt templates. |
| `ads` | core | assisted | Campaign structure, targeting, bidding for Meta/Google. Client ads work. |
| `brand-building` | core | led | Own 9-stage personal-brand methodology (niche, profile, pillars, hooks, filming, algorithm). Used by personal-branding and bedo-brand-engine. |
| `copy-editing` | core | auto | Seven-sweeps pass on any draft. Run automatically on every outbound text before approval. |
| `copywriting` | core | assisted | Landing/hero/pricing copy in brand voice. Used by proposals, client sites, Tamim site. |
| `cro` | core | assisted | Page conversion audit from a URL. Runs as the first step on any client site. |
| `growth-os` | core | assisted | Own Growth OS v3: strategy → production → publishing (Gemini images, Remotion reels, Meta publish). Has tamim profiles (30 posts, 10 videos, 60-day plan). This is the Tamim brand content engine. |
| `marketing-os-workflow` | core | assisted | Master sequence for a full client marketing OS. This is the "Marketing department head": routes to every other marketing skill. |
| `marketing-plan` | core | assisted | 13-section AARRR plan per client. Output = the client deliverable, stored as a document. |
| `performance-marketer` | core | assisted | Own Arabic diagnosis protocol A→Z (intake, persona, gap, offer, copy, funnel, ads, analytics). Default brain for any ads/growth request. 53 files incl. assists/ prompts and 2 book summaries. |
| `personal-branding` | core | led | Arabic personal-brand system (mindset, niche, pillars, viral script, monetization). Overlaps brand-building; keep both, brand-building is the newer structure. |
| `product-marketing` | core | led | Creates the product/positioning context doc = the company-brain intake for a client. Run first for every new client. |
| `seo-audit` | core | auto | Technical + on-page audit from a URL. Can run monthly per client site. |
| `social` | core | assisted | Posts, threads, reels scripts, repurposing, social listening. Feeds the social queue → PHP publisher. |
| `stop-slop` | core | auto | Strip AI tells from prose. Chain after copy-editing on every generated text (Arabic needs its own phrase list). |
| `ab-testing` | keep | led | Experiment design and sample size. Client CRO work. |
| `ai-seo` | keep | assisted | AI-search visibility (llms.txt, OKF). Newest, most complete version. |
| `analytics` | keep | led | GA4/GTM tracking plans for client sites. |
| `aso` | keep | led | App-store listing audits. Only for app clients. |
| `bedo-brand-engine` | client | assisted | Client-specific: Bedo Mousa real-estate brand. Template for how a per-client "brand engine" skill looks. Do not run for other clients. |
| `co-marketing` | keep | led | Partner campaign ideas. Low priority. |
| `community-marketing` | keep | led | Community playbooks. Low priority for a services business. |
| `competitors` | keep | assisted | "X alternative" / "vs" pages from profiles. Client SEO deliverable. |
| `content-strategy` | keep | assisted | Pillars + topic clusters for a client site/blog. |
| `directory-submissions` | keep | auto | Backlink directory campaign with tracker CSV. Launch-time job. |
| `emails` | keep | assisted | Lifecycle/drip sequences for clients (welcome, nurture, win-back). |
| `free-tools` | keep | led | Engineering-as-marketing ideas (calculators, graders). Pairs with the build path (octa-code). |
| `launch` | keep | assisted | Launch plan (ORB channels, 5 phases) for client products and for Tamim OS itself. |
| `marketing-ideas` | keep | led | 139-idea library; used by marketing-plan cross-reference. |
| `marketing-psychology` | keep | led | Mental models reference for copy and offers. |
| `paywalls` | keep | led | In-app upgrade screens. Only for SaaS clients. |
| `popups` | keep | led | Popup/overlay CRO for client sites. |
| `programmatic-seo` | keep | assisted | Template pages at scale (city/keyword). Client SEO projects. |
| `public-relations` | keep | assisted | Press page, journalist pitches, newsjacking. Occasional. |
| `schema` | keep | auto | JSON-LD generator for client pages. |
| `site-architecture` | keep | assisted | Sitemap + navigation + URL plan for new client sites. First step of a web project. |
| `sms` | keep | led | SMS flows + compliance. Rare in Egypt market; keep for ecommerce clients. |

### operations (4)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `consolidate-memory` | reference | auto | Memory hygiene pattern; apply to the company brain (vault) monthly. |
| `morning` | keep | auto | Morning brief as HTML. The existing daily-brief.ts does this natively; borrow its section design. |
| `onboarding` | keep | assisted | Client onboarding checklist generator after a deal closes → tasks created automatically. |
| `schedule` | reference | auto | Claude-app scheduled tasks. Tamim OS has its own triggers; reference for the workflow builder UX. |

### sales (7)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `cold-email` | core | assisted | Drafts first-touch + follow-up sequence per prospect; queued in Inbox for approval before send. |
| `prospecting` | core | auto | Weekly lead-list job: ICP from company brain → candidate list → scored CSV into Clients page as "prospects". Feeds cold-email. |
| `sales-operator` | core | assisted | Operative sales coach: classify stage/channel/signal, ethics check, smallest useful output (next question, CRM note, follow-up). Runs after every client call note. |
| `lead-magnets` | keep | assisted | Plan gated PDFs/templates; PDF module renders them. |
| `referrals` | keep | led | Referral program design for Tamim and for clients. |
| `sales-operator-controlled` | reference | led | Governance-gated controlled draft (ethics screen, buyer-state map, stall diagnosis) + 14 book summaries (SPIN, Challenger, Gap Selling, Getting to Yes, Influence, JOLT) + real-estate briefing template. Research library behind sales-operator; not a job. |
| `signup` | keep | led | Client-site signup flow audits (for web clients). |

### thinking (8)

| Skill | Verdict | Autonomy | Use in Tamim OS |
|---|---|---|---|
| `concept-fan` | keep | led | Widen a decision. |
| `inversion` | keep | led | Flip assumptions. |
| `lateral` | keep | led | Router to the other de Bono tools. Use in strategy sessions. |
| `provocation` | keep | led | Po technique. |
| `random-stimulus` | keep | led | Force-fit ideation; good for hooks and campaign angles. |
| `scamper` | keep | led | Variations of an existing idea (offers, posts). |
| `six-hats` | keep | led | Structured decision review. |
| `worst-idea` | keep | led | Reverse brainstorming. |

## Merge list (delete after checking references/)

| Variant | Keep instead | Note |
|---|---|---|

## Drop list

- `cloudflare-one` — Zero Trust networking. No use.
- `cloudflare-one-migrations` — No use.
- `sandbox-migrate-to-next` — No use.
- `sandbox-next` — No use.
- `sandbox-stable` — Cloudflare Sandbox SDK. No use in this app.
- `explain-usage` — Claude-app specific.
- `import-memory` — Claude-app specific.
- `setup-cowork` — Claude-app onboarding. Not applicable.
