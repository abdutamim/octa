# Task: spec 001 — Job runner and `job_runs`

Read `docs/01-RUNTIME-CONTRACT.md` fully (runners table §1, debate §1.1, workspace §2, schemas §3, prompt assembly §4, gates §6, failure §7, budgets §8), then `docs/06-SPECS.md` section 001.

Build:
1. `electron/core/jobs/runner.ts` — `startJob(spec: JobSpec): JobHandle`. Runners: `claude-plan`, `claude-skill`, `codex-exec`, `codex-critic`, `codex-review`, `gemini-inline` (stub that calls the copied ChatProvider). Each runner builds its argv exactly as documented; spawn with `child_process.spawn` (no shell), hidden window on Windows, prompt on stdin, cwd = job folder. Parse Claude `stream-json` and Codex JSON-lines into a common `JobEvent` stream (`text`, `tool`, `usage`, `error`, `done`). Kill the whole process tree on cancel (use `taskkill /T /F` on Windows). Timeouts and retry policy per §7/§8 with statuses `ok | failed | needs_approval | needs_input | cancelled`.
2. Job folder layout §2 under the Octa home from settings (`C:\Octa\jobs\<id>\`): `brief.md`, `inputs/`, `out/`, `evidence/`, `log.jsonl`, `result.json`, `contract.json` (the result schema §3.2 written for the agent to follow).
3. `electron/db/jobs.ts` — tables `job_runs`, `workflows`, `plans` per §3.3, with `createJob/updateJob/listJobs/getJob/approveJob`. WAL mode, busy timeout via the copied helper.
4. IPC `jobs:start|cancel|list|get|approve|events` (events via `webContents.send`), preload bridge, and a minimal `src/components/JobsPage.tsx` (list + live log + cancel + approve buttons, bilingual).
5. Skill path resolution: `runSkill({name, input})` looks up `skills-library/MANIFEST.json` (path from settings, default `<repo>/skills-library`) and mounts the folder via `--add-dir` / inlines `SKILL.md` for codex-exec.
6. Tests (`tests/jobs/*.test.ts`): stream parsers with recorded fixtures (create fixtures by running `claude -p --output-format stream-json` and `codex exec --json` once on a trivial prompt and saving the output under `tests/fixtures/`), argv builders for every runner, timeout → `needs_input`, cancel kills a fake long-running `node -e "setInterval(()=>{},1000)"` within 2 s, DB CRUD.
7. Acceptance demo: running `stop-slop` via `codex-exec` on a paragraph writes `result.json`. Do this once for real and paste the result into the report.

Do not build the planner, workflows, or research here (specs 003/004/006).
