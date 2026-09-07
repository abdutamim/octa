# spec-014 report — Reviewer step (Sol)

## Built

- Added `electron/core/octa/review.ts` with the `reviewStep(job, step)` contract, review request assembly, result/output inspection context, `review.schema.json` generation, Sol CLI invocation, JSONL result parsing, usage extraction, and injectable fake-runner support.
- Added `electron/core/octa/prompts/reviewer.md`, requiring criterion-by-criterion checks, verbatim criterion strings in issues, and tightly limited trivial fixes via `fixed_output_path`.
- Wired `electron/core/jobs/runner.ts` so `codex-exec` and `claude-skill` steps with acceptance criteria run Sol before the existing gate; a `revise` verdict gets exactly one additional executor pass with the review appended, followed by a second review.
- Added `review_json` persistence and an additive migration in `electron/db/jobs.ts` / `electron/db/migrations/002-add-review-json.sql`. Review usage is included in final job metrics and stored separately under the review portion of `cost_json`.
- Added acceptance tests in `tests/review.test.ts` and migration/persistence coverage in `tests/jobs/db.test.ts`.

## Copied

No files were copied from `C:\Users\Admin\Desktop\Projects\tamim-os` or the Octa Code reference. Both references remained read-only.

## Commands and results

- `npm run typecheck` — passed.
- `npm test` — passed: 15 files, 73 tests.
- `npm run build` — passed: typecheck, 73 tests, Electron bundles, and artifact verification.
- `git diff --check` — passed.

## Acceptance checklist

- ✅ A violating seeded output returns `revise` with the failed acceptance criterion quoted verbatim.
- ✅ A clean output returns `pass` without changes.
- ✅ A revised executor step runs exactly once more, receives the review feedback, then receives a second review before the existing gate status is applied.
- ✅ Sol runs with GPT-5.6 Sol, high reasoning effort, read-only sandbox, and `--output-schema review.schema.json`.
- ✅ Review JSON is persisted on `job_runs.review_json`; review cost is recorded in `job_runs.cost_json` and included in result metrics.
- ✅ `review.schema.json` contains `verdict`, structured `issues` with `criterion`, `detail`, and `severity`, plus optional `fixed_output_path`.

## Open questions / owner requirements

- A real Sol run still requires the Codex CLI to be installed and signed in on the target Windows machine. No keys or secrets were added.
- The reviewer-driven tests use an injected fake reviewer; no external model call was made during verification.
