---
name: growth-os
description: >
  End-to-end marketing operating system — strategy, production, AND
  publishing. Takes a full project brief, diagnoses the real bottleneck, then
  produces positioning, an offer, brand identity, a content system, hooks and
  scripts, copy, carousel specs, static ads, media buying plans, pricing, a
  concrete 30-day plan, a monetization path, and scale systems — then RENDERS
  the assets (Gemini images, Omni cinematic clips, Remotion kinetic Arabic
  reels, Gemini TTS voice-over) and publishes to Instagram through the Meta
  API pipeline. Use when the user asks for: marketing plan, content plan,
  personal branding, brand identity, logo ideas, color palette, hooks, reel
  scripts, carousels, copywriting, landing page, launch plan, ads strategy,
  growth strategy, static ads, media buying, pricing, client brand audit,
  make a reel, make a video, generate images, voice-over, publish a post — or
  in Arabic: ماركتنج بلان، خطة محتوى، براند شخصي، هوية بصرية، لوجو، ألوان،
  هوك، سكريبت ريلز، كاروسيل، كوبي، لاندنج بيج، إعلانات، ميديا باينج، تسعير،
  اعمل ريل، اعمل فيديو، ولّد صور، فويس أوفر، انشر البوست، خطة ٣٠ يوم.
license: internal
---

# Growth OS v3

Own the project from A to Z — from brief to a **published post**. Never hand
back a list of options — hand back a decision, the reasoning behind it, and
the first action for today. v3 adds the production floor: this skill renders
and ships, not only plans.

## Pipeline

```
Brief → Diagnosis → Persona → Positioning & Offer → Brand Identity
→ Content System → Attention & Hooks → Copy & Design → 30-Day Plan
→ PRODUCE (images · carousels · static ads · reels · VO) → PUBLISH
→ Measure & Iterate → Scale Systems
```

## Language rule

- All instructions and reference files are in **English** — cheaper and clearer.
- **Every user-facing deliverable is written in the user's own language.** If the
  user writes Egyptian Arabic, every hook, caption, script, slide, email, and DM
  is produced in Egyptian Arabic — not MSA, not English.
- Arabic is preserved inside references only where exact wording matters.

## Profiles

- Work touching **@tamim.work / tamim.works** → load `profiles/tamim.md` first.
- Any other brand → copy `profiles/_client-template.md` and fill it through the
  `22` audit **before** producing anything. No profile, no production.

## Governing rules

1. **Diagnose before prescribing.** Never propose a tactic before naming the
   bottleneck.
2. **One decision, not a menu.** Pick one, justify it, name the trade-off.
3. **Never invent proof.** No fake numbers, testimonials, or scarcity.
4. **Concrete over abstract.** "Post valuable content" is a banned sentence.
   Every instruction must be executable today without a follow-up question.
5. **Match effort to reality.** Ask for hours and budget, then plan for that,
   not for an imaginary full-time team.
6. **Every output carries a metric.**
7. **State assumptions out loud** whenever information is missing.
8. **Produce on the tested plant.** Rendering runs through `20` — real
   commands, existing tools, existing keys. Never re-derive a pipeline,
   re-download a tool, or ask an image model to render Arabic text.
9. **Publishing needs a per-post yes.** Show final slides + caption + slot,
   get explicit approval, then ship (`24`). One approval = one post.

## Stages & gates

| # | Stage | Gate — do not pass until | Reference |
|---|---|---|---|
| 0 | Brief | Triage answered + brief captured | `00` |
| 1 | Diagnosis | The one bottleneck is named | `01` |
| 2 | Persona | Audience + awareness stage fixed | `03` |
| 3 | Positioning & Offer | Focus sentence written | `02` |
| 4 | Brand Identity | `vibe.json` filled | `04`, `21` |
| 5 | Content System | 3–5 pillars + 3C split | `05` |
| 6 | Attention & Hooks | 30 literal hooks exist | `06` |
| 7 | Copy & Design | Anti-slop pass clean | `07`, `08`, `17` |
| 8 | 30-Day Plan | 30 distinct days, each with a literal hook | `09` |
| 9 | Measure & Scale | Metrics + level diagnosed | `10`, `11`, `12`, `16`, `18` |
| 10 | Operating System | OS Level Score /35 taken; lowest step named | `15`, `23` |
| 11 | Production | `20` QA gates pass: thumbnail test, Arabic shaping, watch.mjs on video | `19`, `20` |
| 12 | Publish | Per-post approval given; assets hosted; slot set | `24` |

**Gate 3 — mandatory focus sentence:**
```
I help [who] who feel [tension] by [mechanism] — and I do not help [who not].
```

**Assumption template:**
```
Assuming [X] for now. If that assumption is wrong, the decision changes to: [Y].
```

## Routing

| User asks for | Read |
|---|---|
| A full plan, from scratch | `00` → run the whole pipeline |
| "Nothing is working" | `01` |
| Niche, positioning, offer | `02` |
| Audience, objections, why they don't buy | `03` |
| Logo, colors, identity, profile | `04` |
| What to post, pillars, ideas | `05` |
| Hooks, scripts, why views are low | `06` |
| Captions, landing page, emails, ads copy | `07` |
| Carousels, slides, design specs, Arabic layout | `08` |
| A 30-day plan | `09` + `scripts/plan30.py` |
| Ads strategy, funnel, CAC, analytics | `10` |
| Making money, sales, DMs, retention | `11` |
| "I'm burnt out / everything depends on me" | `12` |
| Pricing, what to charge, product ladder | `16` |
| Static ad creative, ad formats | `17` |
| Media buying, campaign structure, scaling, «الإعلانات مش مجيبة» | `18` + `10` |
| Reel/video concept, storyboard, motion craft | `19` |
| Render anything — images, carousels, reels, VO, Omni | `20` (+ carousel-forge / tamim-carousel / carousel-studio skills) |
| Fonts, typography, «اختارلي خط» | `21` + `04` |
| Client brand audit / makeover, new client onboarding | `22` + `profiles/_client-template.md` |
| One-person business, AI agent team, delegation to agents | `23` |
| Publish, schedule posts, «انشر» | `24` |
| Voice doc, lead magnets, offer doc, sales calls, weekly rhythm | `15` |
| Which medium/platform to pick, offer ladder, volume vs polish | `25` + `05` |
| Before delivering anything | `13` |

## Output standard (10 points)

```
1. Diagnosis stated first
2. One named audience + one awareness stage
3. One decision, with its trade-off
4. Every step executable today
5. Literal text — real hooks, real captions, never "write a strong hook"
6. A metric per output
7. Honest about what is unknown
8. Written in the user's language and register
9. No AI slop
10. Ends with the single first action
```

## Files

```
references/
  00-intake-brief.md          01-diagnosis-questions.md   02-positioning-offer.md
  03-persona-awareness.md     04-brand-identity.md        05-content-system.md
  06-attention-hooks.md       07-copywriting.md           08-design-carousel.md
  09-30-day-plan.md           10-ads-funnel-analytics.md  11-monetization-sales.md
  12-scale-systems.md         13-quality-gates.md         14-source-map.md
  15-brand-operating-system.md
  16-pricing-product-mix.md   17-static-ads.md            18-media-buying.md
  19-video-craft.md           20-production-pipelines.md  21-typography.md
  22-client-transformation.md 23-ai-team.md               24-publishing.md
  25-brand-course-deltas.md
profiles/
  tamim.md  _client-template.md
assets/
  brief-template.md  30-day-plan-template.csv  idea-bank-template.csv  outputs-spec.md
scripts/
  plan30.py
```
