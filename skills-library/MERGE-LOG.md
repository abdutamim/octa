# Merge log

Every same-name pair was diffed with `diff -r --strip-trailing-cr -w -B` on
2026-09-05 before anything was dropped. The decisions below are encoded in
`scripts/collect-skills.mjs` (`ALIAS`, `PREFER`, `KEEP_AS`), so a rebuild
reproduces them. Nothing was deleted from the original source folders.

## Finding 1: most "differences" were line endings

38 of the 57 pairs differed only by CRLF vs LF (the Outfred / Portfolio /
WhatsApp copies are CRLF, `Documents\marketing-os` is LF). Content identical.
The library now normalizes every text file to LF so future diffs are honest.

## Finding 2: renamed copies (9)

Byte-identical except the `name:` line. Folded into the original name:

| Dropped name | Kept name |
|---|---|
| shopify-theme-builder | prism-store-builder |
| impeccable | frontend-ui-polisher |
| ui-ux-pro-max | web-ui-designer |
| bulk-seo-pages | programmatic-seo |
| page-conversion-optimizer | cro |
| schema-markup-builder | schema |
| seo-site-audit | seo-audit |
| website-structure-planner | site-architecture |
| ai-search-optimizer | ai-seo |

`pdf--codex` = `pdf` with lowercase reference file names. Dropped.

## Finding 3: the marketing-os copy was the newer one (9)

The first pass picked the larger folder, which was the CRLF copy. The real
newer version is Bedo's `Documents\marketing-os` (v2.0.1 or with extra
cross-links to `prospecting` / `marketing-plan`, which only exist there).
Now marketing-os is the default winner for every shared name.

| Skill | What marketing-os adds |
|---|---|
| copywriting, launch, pricing, sales-enablement | v2.0.1: description points to the new `offers` skill |
| competitor-profiling, cold-email, customer-research, marketing-ideas | related-skill links to `prospecting` and `marketing-plan` |
| ad-creative | image-tool table lists ChatGPT Images 2.0 |

## Finding 4: the target was genuinely newer (7)

Variant dropped because the kept copy is a strict superset:

| Dropped | Kept | Kept version has |
|---|---|---|
| ads--outfred (2.0.0) | ads (2.0.1) | Google RSA output spec (15 headlines / 4 descriptions, negatives, sitelinks, self-check) |
| ai-seo--outfred, ai-search-optimizer (2.0.0) | ai-seo (2.1.0) | Google's official AI stance, query fan-out, OKF bundle, agentic experiences, `references/content-types.md`, `references/okf.md` |
| social--outfred (2.0.0) | social (2.1.0) | social listening rubric + `references/listening.md` |
| image--outfred (2.0.0) | image (2.0.1) | Nano Banana Pro, Flux Kontext, Ideogram 3.0, Recraft V3, Midjourney v7 |
| video--outfred (2.0.0) | video (2.0.1) | Sora 2, Seedance, Hailuo, Hunyuan/Wan, quick-pick table |
| content-strategy / copywriting / marketing-ideas / marketing-psychology `--claude-app` | same name | the claude-app copies are single-file versions with references inlined as appendices and no evals; the kept copies have the same text split into `references/` plus `evals/` |
| sales-enablement--claude-app | sales-enablement | identical except `name:` quoting |

## Finding 5: two pairs were different skills, not versions

**performance-marketer.** The claude-app version (kept) is a rewrite in
Egyptian dialect with a routing table and four new addenda (brand personality
and voice, persona and VOC, 15-step competitor analysis, insights to angles to
creative), 8 extra reference files (19 to 26: AOV, email, copy formulas, Meta
account structure 2026, pricing, copy workshop), and 3 image assets. Every
reference file it shares with the marketing-os version is a superset (0 lines
removed, 3 to 39 added). The marketing-os version's long formal-Arabic
"course edition" SKILL.md is not fully contained anywhere else, so it was
ported as `performance-marketer/references/98_Course_Edition_SKILL.md`. Its
`ALL_IN_ONE_*.md/.txt` were a concatenation for ChatGPT upload and were dropped.

**sales-operator.** Two unrelated skills shared the name:

| Folder now | Origin | What it is |
|---|---|---|
| `sales-operator` | marketing-os | operative coach: classify stage, channel, signal; ethics check; smallest useful output; 5 short references (routing, qualification, objections, CRM, ethics) |
| `sales-operator-controlled` | claude-app | "controlled draft, not production approved": governance gates, buyer-state map, stall diagnosis, 14 long book summaries (SPIN, Challenger, Gap Selling, Getting to Yes, Influence, JOLT...) and a real-estate project briefing template |

Both kept. The first is the job; the second is the research library and the
real-estate template for Bedo's client work.

## Result

166 folders became 110. Every kept folder is either unique or the verified
newest version. The `duplicates` list in `MANIFEST.json` records each dropped
path with the folder that supersedes it.
