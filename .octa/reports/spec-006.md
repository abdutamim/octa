# spec-006 report — Workflow runner

## Built

- Added `electron/core/octa/workflows.ts`: validated workflow definitions, recursive `{{brief.x}}` / `{{steps.s1.out}}` interpolation, DAG scheduling with at most three concurrent steps, durable coordinator state, step execution through spec 001, Sol review through spec 014, one review correction pass, gates, notifications, voice hook, expiry, resume, custom workflow saving, and autonomy counters.
- Added the six JSON launch definitions under `electron/core/octa/workflows/` plus `electron/core/octa/schemas/workflow.schema.json`. W4 and W6 use the currently available Codex/research paths; voice, Octa Code, invoice, and other not-yet-merged paths are explicitly marked `todo` and are skipped with a bilingual log message.
- Extended `job_runs` with workflow/gate/state metadata and added `workflow_stats` and `recurring_jobs` persistence in `electron/db/jobs.ts`.
- Added the six recurring seed entries and `RecurringScheduler`; all are `assisted`, with only the daily brief placeholder enabled.
- Added main/preload IPC for `workflows:list|get|start|resume|gate:approve|gate:reject|gate:comment|save` and broadcasts for `workflow:step` / `workflow:gate`.
- Added `src/components/WorkflowsPage.tsx`, sidebar navigation, live dependency/status cards, exact gate payload rendering, gate actions, bilingual strings, and styles.
- Added “Save as workflow” to custom planner results.
- Added `scripts/workflow-demo.ts` for the requested live W4/W6 runs.

## Shared changes

- `electron/core/jobs/runner.ts` now carries `workflowRunId`, supports `stale`, preserves both workflow brief and step instructions, and lets the workflow coordinator own review persistence.
- `electron/core/octa/research.ts` records research child jobs under their parent workflow run.
- `electron/core/octa/review.ts` resolves the native Windows Codex executable and uses a strict valid review schema; `fixed_output_path` is required by the API schema but nullable to preserve its optional application semantics.
- `electron/core/notify.ts` (the existing copy of `C:\Users\Admin\Desktop\Projects\tamim-os\electron\core\notify.ts`) now supports ntfy action buttons. The reference app and the old Python backend remained read-only; no Python was imported or spawned.

## Tests

- Added `tests/workflows.test.ts` covering seed validation, recurring defaults, interpolation, DAG order/parallelism/max-three concurrency, exact-payload approval, expiry, crash resume, and promotion/demotion counters.
- Extended `tests/review.test.ts` to verify the strict nullable `fixed_output_path` schema.

## Commands and results

- `npm run typecheck` — passed.
- `npm test` — passed: 21 test files, 112 tests.
- `npm run build` — passed: typecheck, tests, Electron main/preload/renderer bundles, and artifact verification.
- `git diff --cached --check` — passed before commit.

## Acceptance checklist

- ✅ Workflow schema, seeds, DAG execution, interpolation, max-three parallelism, durable `job_runs` state, and resume are implemented and tested.
- ✅ Every non-todo production step goes through spec 001 and an explicit spec 014 review before its configured gate.
- ✅ Review gates show the exact payload and allow continue or one comment-driven rerun; approve gates require the exact payload string.
- ✅ In-app IPC/UI actions, ntfy action-button metadata, and the spec-007 voice hook are wired; gates never auto-approve.
- ✅ Pending gates expire after 24 hours and mark the coordinator job `stale`.
- ✅ Clean-run promotion after ten runs and rejection demotion are persisted in `workflow_stats`.
- ✅ Recurring jobs, custom-plan saving, IPC, renderer events, and bilingual UI are implemented.
- ✅ Automated acceptance tests and production build pass.
- ❌ The live external-model demos did not both complete end to end in this environment. W6 attempts with ten-minute wall budgets produced local Astro/Next research drafts but stopped at s1 input-token limits (`1,216,914 > 300,000` in run `ec10464d-4852-4f13-a39d-e6d2f365197c`, and `3,127,954 > 2,000,000` in run `efb9f2f6-0db3-4100-8886-5d584e5c94c4`). W4 run `0abafb08-5e2d-4255-bdc4-d6adafe712d2` produced and reviewed `out/clarification.md`; a later run with the corrected workflow timed out at the ten-minute Codex step budget before writing the memo (`8aad2dbc-4faf-48f0-8894-1ab9237c7be8`). Earlier W4 runs also produced Arabic Astro recommendations, but Sol correctly rejected them because they were not clarification deliverables. No external send, publish, deploy, or payment occurred.

## Open questions / owner requirements

- Re-run the live W6 and W4 demos after Codex model-service capacity is healthy; W6 also requires the configured search/browser access from spec 004 and its 100-URL/40-domain depth gate.
- Keep Codex/Claude installed and signed in on the target Windows machine. Configure an ntfy topic for phone actions and Gemini credentials when the currently todo voice/invoice steps land.
- The daily brief recurring row is intentionally a placeholder: the scheduler records/skips it until the daily-brief workflow exists.
