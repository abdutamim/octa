# spec-012 report — Quality chain and sources

## Built

- Added [quality.ts](../../electron/core/octa/quality.ts): injected `StepRunner`, fixed outward chain order (`copy-editing` → `stop-slop` → `fact-checker`), per-step inputs/outputs, and ordered change records.
- Added [sources.ts](../../electron/core/octa/sources.ts): `sources.jsonl` parsing, citation validation for `[n]` and `(source n)`, exact-line unsourced-number detection, planner-facing `rejectUnsourced`, and the multilingual depth gate.
- Added [phrases-ar.md](../../skills-library/skills/stop-slop/references/phrases-ar.md) with more than 40 Egyptian/MSA AI-tell phrases and wired Arabic-language use into `stop-slop/SKILL.md`.
- Added [quality.test.ts](../../tests/quality.test.ts) and [sources.test.ts](../../tests/sources.test.ts) covering the acceptance criteria.

## Copied

No files were copied from the Tamim OS reference or the Octa Code reference. This spec was implemented as new library code.

## Commands and results

- `npm run typecheck` — passed.
- `npm test` — passed: 9 files, 46 tests.
- `git diff --cached --check` — passed.
- `git commit -m "spec-012: quality chain and sources"` — passed.

## Acceptance checklist

- ✅ Outward quality chain executes the three skills in the required order through an injected fake runner and records each pass's edits.
- ✅ JSONL ledger parser follows the §3 source shape and supports file paths or JSONL text.
- ✅ `[n]` and `(source n)` citations are checked against existing ledger entries.
- ✅ Unsourced detector catches percentages, currencies, multipliers, scaled counts, and counts ≥100 while returning the exact report line.
- ✅ Tests cover 10 seeded numeric failures and 10 safe lines.
- ✅ Depth gate covers 100 distinct URLs, 40 domains, per-language minimums, and the 15-query “no material” exception, with pass/fail fixtures.
- ✅ `rejectUnsourced(report, ledger)` blocks an unsourced statistic and exposes the exact offending line for the planner.
- ✅ Arabic reference contains more than 40 patterns and the 20 seeded phrases; `SKILL.md` activates it for Arabic input.

## Open questions / owner requirements

- No keys, installs, or external services are required for this pure-library spec.
- The real spec-001 job runner still needs to be injected as `runStep` when the chain is integrated. Non-outward drafts intentionally return unchanged without running the outward chain.
- The source-ledger viewer is deferred to the panel UI spec; the validator APIs are ready for planner/workflow callers.
