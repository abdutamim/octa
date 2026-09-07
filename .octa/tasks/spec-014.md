# Task: spec 014 — Reviewer step (Sol)

Read `docs/01-RUNTIME-CONTRACT.md` §1 (`codex-review`), §3.2, and `docs/06-SPECS.md` section 014.

Build:
1. `electron/core/octa/review.ts` — `reviewStep(job, step)`: runs `codex-review` (GPT-5.6 Sol, effort high, read-only sandbox, `--output-schema review.schema.json`) with the step's acceptance criteria, its `result.json`, and its outputs; schema `{verdict: 'pass'|'revise', issues: [{criterion, detail, severity}], fixed_output_path?}`.
2. Runner wiring (in spec 001's runner, minimal change, listed in the report): after any executor step (`codex-exec`, `claude-skill`) → review → `revise` re-runs the step once with the review appended to the prompt → second review → then the gate. Store review JSON and cost on the `job_runs` row (`review_json` column, add migration).
3. Prompt `electron/core/octa/prompts/reviewer.md`: check each acceptance line, quote the criterion, never rewrite the deliverable unless trivially fixable (then write the fixed file and set `fixed_output_path`).
4. Tests with a fake runner: violating output → `revise` with the criterion quoted; clean output → `pass` unchanged; the re-run happens exactly once; cost recorded.
