# Task: spec 012 — Quality chain and sources

Read `docs/06-SPECS.md` section 012, `docs/02-RESEARCH-ENGINE.md` §3 and §7, and `skills-library/skills/{copy-editing,stop-slop,fact-checker}/SKILL.md`.

Build (pure library code + tests, no UI beyond what is listed):
1. `electron/core/octa/quality.ts` — `qualityChain(text, {language, outward: boolean, sourcesPath?})` that runs, in order, `copy-editing` → `stop-slop` → `fact-checker` as job steps through a `runStep` callback (injected; the real runner is spec 001, so accept an interface `StepRunner = (skill, input) => Promise<StepResult>` and test with a fake). Each pass returns the edited text plus a list of changes; the chain records them.
2. `electron/core/octa/sources.ts` — parse `sources.jsonl` (schema in `02-RESEARCH-ENGINE.md` §3), validate a report: every `[n]` / `(source n)` citation refers to an existing ledger entry; unsourced numbers detector (a regex for digits with %, currency, "x times", counts ≥ 100) that returns the exact line quoted; depth gate (`distinctUrls ≥ 100`, `domains ≥ 40`, per-language counts, "no material" handling) returning `{ok, failures[]}`.
3. Arabic slop list: add `skills-library/skills/stop-slop/references/phrases-ar.md` with ≥40 Egyptian/MSA AI-tell phrases (e.g. «في عالم اليوم», «لا يخفى على أحد», «من الجدير بالذكر», «دعونا نتعمق», «بكل تأكيد», «رحلة», «يعزز», «يسلط الضوء», over-used «!» chains, ornamental openers) and wire it into the SKILL.md text so the skill applies it when `language` is Arabic.
4. Validator used by the planner (spec 003 will call it): `rejectUnsourced(report, ledger)`.
5. Tests: chain ordering with a fake runner, citation validation, unsourced-number detector catches 10 seeded lines and ignores 10 safe ones, depth gate pass/fail fixtures, the Arabic list catches 20 seeded phrases.
