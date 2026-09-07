# Task: spec 003 — Planner protocol (Fable + Astra debate)

Read `docs/01-RUNTIME-CONTRACT.md` §1 (runners `claude-plan`, `codex-critic`), §1.1 (debate), §3.1 (plan schema), §4 (prompt assembly), `docs/00-OCTA-ASSISTANT.md` §3–4 (hard rules 1, 2, 4, 6), `docs/03-COMPANY-BRAIN.md` §4, and `docs/06-SPECS.md` section 003. Also read the old Octa Code `prompts/planner.md`, `spec_writer.md`, `spec_critic.md` for style reference (TypeScript re-implementation only).

Build:
1. `electron/core/octa/planner.ts`:
   - `compileBrief(conversation, attachments, brain)` → `brief.md` (last 40 turns, attachments listed with paths, brain injection from spec 005's `loadBrain`).
   - `plan(brief, opts)` running the debate: `claude-plan` (Fable, `--model claude-fable-5-1 --effort medium --output-format json`) drafts v0 validated against `plan.schema.json` (write the JSON schema from §3.1); `codex-critic` (Astra xhigh, read-only) returns `critique.schema.json` `{issues[], missing_questions[], risks[], verdict}`; Fable replies with plan v(n) + `replies[]` (accepted/rejected with reason); loop until `verdict=agree` or 4 rounds; write `debate.md` (every issue, who won, why) next to the plan; merge + dedupe `questions[]` from both models.
   - Questions loop: if any `questions[].blocking`, return `{status:'needs_input', questions}`; `answer(planId, answers)` appends answers to the brief and re-runs (max 3 rounds; after that the plan lists assumptions and waits for explicit approval).
   - Validators: invalid JSON → retry once with the validation error appended; every step's `skill` must exist in the registry (spec 002) or the step must be `runner: codex-exec` with a free-form prompt; call spec 012's `rejectUnsourced` on any numbers in the summary.
   - Persist to `plans` table (spec 001's `electron/db/jobs.ts`).
2. Prompt files under `electron/core/octa/prompts/`: `planner.md` (Fable), `critic.md` (Astra), `reply.md`; all instruct the language mirror and the "must ask" rule.
3. IPC `planner:plan|answer|approve|get`, events `planner:questions`, `planner:round`. Minimal `src/components/PlanCard.tsx` (summary, steps table, questions form, debate viewer) used by the Jobs page for now.
4. Tests with a fake runner: 5 ambiguous brief fixtures → ≥1 blocking question each; a complete brief → 0 questions; seeded weak plan changed after Astra's critique within 2 rounds and visible in `debate.md`; invalid JSON retry; 4-round cap; schema validation.
5. One real end-to-end run (both CLIs are logged in): brief "اعمل ماركتنج لمشروع جديد" with no details → paste the questions Octa asked into the report.


## Note added 2026-09-07
The installed Claude Code session may be logged out (`claude -p` returned "OAuth session expired"). If real `claude -p` calls fail with auth errors, implement and test everything with the fake runner, keep the real end-to-end run as a documented manual step in the report, and do not retry logins yourself.
