# 06 — Specs (ready for Octa Code)

Each spec below becomes one `runners/spec_runner.py --task-file` input, in
order. Each has a goal, scope, acceptance criteria, and a demo. Specs 001–004
are the spine; nothing else starts before they pass.

Conventions: **new repository `octa`, built from scratch** (decision D15). Spec 000 creates it. Same stack as Tamim OS so proven modules can be copied in with their tests: Electron + electron-vite, TypeScript strict, React, Tailwind, better-sqlite3, vitest. Folder layout `electron/core`, `electron/db`, `src/components`, `tests/`. No new runtime dependency without a line in the spec. All user-facing strings bilingual (ar/en). Every module copied from Tamim OS is listed in the spec that copies it, with the commit it came from.

---

### 000 · New repository

Goal: an empty Octa app that boots, with CI and the copied foundations.

Scope: create the `octa` repo (published in place of Octa Code on GitHub, decision D15), scaffold Electron + electron-vite + React + Tailwind + better-sqlite3 + vitest; copy from Tamim OS with tests: `electron/cloud/vertex.ts`, `gemini.ts`, `gemini-chat.ts`, `codex-chat.ts`, `fallback-chat.ts`, `chat.ts`, `electron/db/busy-timeout.ts`, the settings table + Settings page skeleton, the theme tokens from `AGENTS.md`, `notify.ts`; `.env.example`, secret scan in CI, MIT license for the new code with an AGPL notice for any Octa Code prompt text reused; `SETUP.md` first draft.

Acceptance: `npm run dev` opens a window with Settings; `npm test` passes the copied tests; CI green; a fresh clone follows `SETUP.md` to the same state.


---

### 001 · Job runner and `job_runs`

Goal: spawn `claude -p` and `codex exec` from Electron, stream their output,
persist every run.

Scope: `electron/core/jobs/runner.ts` (spawn, stdin prompt, stream-json
parsing for Claude, JSON-lines for Codex, kill tree, timeouts, retry policy
from `01-RUNTIME-CONTRACT.md` §7), `electron/db/jobs.ts` (tables §3.3),
IPC `jobs:start|cancel|list|get|approve`, a minimal Jobs page listing runs
with live log.

Acceptance:
- `jobs:start` with `{runner:'claude-skill', skill:'stop-slop', input:{text}}` returns a job id, streams events, and writes `result.json` in `%USERPROFILE%\Octa\jobs\<id>\`.
- Same with `runner:'codex-scout'` and a trivial prompt.
- Cancel kills the process tree within 2 s (verified on Windows).
- A run that exceeds its time budget ends with status `needs_input` and a partial summary.
- Unit tests for the stream parsers with recorded fixtures.

Demo: run `stop-slop` on a paragraph from the Jobs page and see the result.

### 002 · Skill registry

Goal: the app knows every runnable skill.

Scope: `electron/core/skills/registry.ts` loads `skills-library/MANIFEST.json`
at startup (path configurable), filters `verdict in (core, keep, client)`,
exposes `list_skills({department?, query?})` and `run_skill({name, input})`
as assistant tools, resolves the skill folder for the runner, builds the
`--add-dir` and `--append-system-prompt-file` arguments.

Acceptance: 87 skills listed (31 core + 55 keep + 1 client), dropped and
reference ones hidden but reachable via `include_reference`; `run_skill`
creates a job through 001; missing folder → clear error.

### 003 · Planner protocol (Fable + Astra debate)

Goal: conversation → brief → plan JSON through the Fable/Astra debate (runtime contract §1.1) with the questions loop.

Scope: `electron/core/octa/planner.ts`: compile the conversation (last N
turns + attachments list + brain summary) into `brief.md`; run `claude -p`
with the planner system prompt and `--output-format json` validated against
the plan schema (§3.1); if `questions[]` has a blocking item, emit
`planner:questions` to the UI and voice, wait for answers, re-run (max 3
rounds); the debate loop (`claude-plan` ↔ `codex-critic`, max 4 rounds, `debate.md` saved with the plan); on approval, hand the plan to the workflow runner (006) or run
steps sequentially until 006 exists.

Acceptance: fixtures with 5 ambiguous briefs each produce ≥1 blocking
question; a complete brief produces zero; a seeded weak plan is changed by Astra's critique within 2 rounds and the change is visible in `debate.md`; invalid JSON is retried once with
the validation error; plan is stored in `plans`.

Demo: say "اعمل ماركتنج لمشروع جديد" with no details → Octa asks 4–6 questions.

### 004 · Research engine

Goal: the 100-source multilingual scout.

Scope: `electron/core/octa/research.ts`: prompt assembly, the research browser profile (`C:\Octa\browser\research`: persistent Playwright context, guided first-time login to Facebook / X, read-only tool surface, pacing, 24 h back-off on challenges), with the protocol
from `02-RESEARCH-ENGINE.md`, `evidence.schema.json`, ledger validation
(distinct URLs ≥100, domains ≥40, ≥2 languages with ≥10 each, claims
reference existing sources), saturation logic, budget; an `octa-tools` MCP
server (`electron/core/octa/mcp-server.ts`, stdio) exposing `search`,
`fetch_markdown`, `youtube_transcript`, `reddit_search` to both CLIs, backed
by the search API from decision D3 and Electron `net`.

Acceptance: a persona job on a real topic ends with a ledger that passes the
gates; a deliberately shallow run (budget 5 min) fails with `failed: depth`
and a partial report; report language matches the conversation.

Demo: "اعمل dream buyer persona لعيادة أسنان في القاهرة" → ≥100 sources, Arabic + English at least, report read back.

### 005 · Company brain

Goal: `knowledge/` layout, mirror, injection, intake interview.

Scope: `electron/core/octa/brain.ts` (mirror vault `knowledge/` →
`Octa\knowledge`, watch for changes), prompt injection rules
(`03-COMPANY-BRAIN.md` §4), the 20-question intake as a guided voice/text
flow that writes the files, per-client intake hooked into the Clients page,
proposals queue for edits (approve → `vault-librarian` applies).

Acceptance: after intake, `company.md`, `voice.md`, `icp.md`, `pricing.md`
exist; a skill run shows the brain in its prompt (log); a job's proposed edit
appears as a pending approval and lands in the vault only after approval.

### 006 · Workflow runner

Goal: JSON workflows with dependencies, gates, retries, resume.

Scope: `electron/core/octa/workflows.ts`, `workflows` table, the six
launch workflows from `04-WORKFLOWS.md` seeded as JSON, gate handling
(review / approve, in-app + ntfy action + voice), resume from any step,
"save as workflow" for custom plans, autonomy promotion/demotion counters.

Acceptance: W6 research and W4 think-project run end to end; a gate blocks
until approved and expires after 24 h; killing the app mid-workflow and
reopening resumes from the last finished step.

### 007 · Voice: Gemini Live session

Goal: talk to Octa, in Arabic or English, hands-free: wake word "أوكتا / يا أوكتا" always on, plus push-to-talk on a key set in Settings.

Scope: `electron/cloud/gemini-live.ts` (WebSocket session to the Gemini
Live API with native audio in/out, newest native-audio model with Arabic, AI Studio key per D1), a local wake-word detector (openWakeWord or Porcupine free tier with a custom "أوكتا" model; audio stays local until the wake word fires), push-to-talk on a configurable key, the greeting turn ("إيه يا عميل، عايز إيه؟"), a new Octa panel
(transcript, speaking indicator, interrupt), language mirror (§9 of the
runtime contract), TTS fallback with `gemini-3.5-flash` TTS when Live is
unavailable, read-back of planner questions and job results, spoken
"approve" recognized only after a read-back of the exact payload.

Acceptance: saying "يا أوكتا" from across the room opens a session within 1 s with fewer than 1 false wake per hour of background speech; a mixed Arabic/English sentence is answered in the same mix;
latency to first audio <1.5 s on this machine; barge-in works; a planner
question round completes by voice; an approve by voice is refused if no
read-back happened.

### 008 · Octa panel UI

Goal: one place to see the conversation, the plan, questions, running jobs,
gates, and outputs.

Scope: `src/components/OctaPage.tsx` (conversation + plan card + steps with
live status + gate buttons + outputs list opening in `DocumentEditor` or the
file), Sidebar entry, theme per `AGENTS.md` (burgundy/plum/cream), RTL
correct. Follow `ui-forge` rules; run `frontend-ui-polisher` audit before
merge.

Acceptance: every state from specs 001–007 is visible without opening a
file; a gate can be approved with one click; outputs open.

### 009 · Map page

Goal: the SkillTree-style map, lit by real runs.

Scope: `src/components/MapPage.tsx`: departments from the manifest, nodes
per skill, colour by last `job_runs` status, click → run form generated from
the skill description, hover → last outputs, autonomy badge.

Acceptance: renders 87 nodes in <1 s; a node lights up within 2 s of a job
finishing; run-from-node creates a job.

### 010 · Native build pipeline (replaces Octa Code)

Goal: build tools and sites inside Octa, no Python backend.

Scope: `electron/core/octa/build/`: (1) **spec writer** — from a plan step or a sentence, the Fable/Astra debate produces `spec.md` + `plan.json` (phases → subtasks with dependencies, acceptance per subtask) using the phase design and prompts from the old Octa Code `prompts/` folder as the reference; (2) **workspace** — git worktree per build under `C:\Octa\builds\<id>`, isolated by default, `--direct` option; (3) **coder sessions** — `codex-exec` (Luna) per subtask, context pack from the previous sessions (the "memory" the old backend kept in `.auto-claude/memory`), commit per subtask; (4) **QA loop** — `codex-review` (Sol) + the project's own tests, fixer session on failure, max 3 loops; (5) **merge** — preview of conflicts, AI-assisted resolution, merge or PR via `gh`; (6) **recovery** — resume, rollback to last good commit, mark stuck for human; (7) read-only phases: roadmap, competitor roadmap, ideation (code quality, security, performance, UX, docs) reusing the research engine for the competitor part; (8) register outputs: a built tool becomes a skill folder via `skill-creator` or a project entry in `knowledge/projects/`.

Acceptance: W2 step 8 builds a two-page Astro site in an isolated worktree and returns a preview; "ابنيلي tool يعمل X" produces spec, plan, commits per subtask, a passing QA loop, and a registered skill; killing the app mid-build and reopening resumes at the last committed subtask; the old Octa Code is not invoked anywhere.

### 011 · Launch workflows W1–W5 wired

Goal: the six demos in `00-OCTA-ASSISTANT.md` §7 pass.

Scope: seed JSON for W1–W5 (W6 done in 006), per-step prompts, acceptance
checks as code, the PDF export of review/plan reports via `pdf.ts` brand
templates, the recurring jobs table from `04-WORKFLOWS.md`.

Acceptance: each demo runs by voice on this machine, in Arabic, within its
time budget, with outputs in the vault and rows in `job_runs`.

### 012 · Quality chain and sources

Goal: nothing outward leaves without the chain.

Scope: `copy-editing` → `stop-slop` (with an Egyptian Arabic phrase list
added to `references/phrases.md`) → `fact-checker` as an automatic post-step
on any output marked outward; the source ledger viewer in the panel; the
planner's "reject unsourced numbers" rule as a validator.

Acceptance: an outward draft with an unsourced statistic is blocked with
the exact line quoted; the Arabic slop list catches 20 seeded phrases.

### 013 · Packaging and environment

Goal: a fresh Windows machine can run Octa.

Scope: installer checks (Claude Code, Codex, uv + Python 3.12, Playwright
browsers, ffmpeg, optional Photoshop) with guided install; settings page for
search API key, ntfy topic, vault path, Octa folder; health check page that
runs each runner once; `docs/octa/05-ENVIRONMENT.md` kept in sync.

Acceptance: health check green on this machine; red items link to the fix.

### 014 · Reviewer step (Sol)

Goal: every executor output is reviewed before a gate.

Scope: `codex-review` runner with `review.schema.json` (`verdict: pass|revise`, `issues[]` each tied to an acceptance criterion, `fixed_output_path?`); wiring in the runner: revise → re-run the step once with the review attached → gate. Review results stored on the `job_runs` row.

Acceptance: a seeded output that violates a criterion is sent back with the criterion quoted; a clean output passes without changes; review cost shows in the job metrics.

### 015 · Release and partner setup

Goal: both users run the same app from GitHub.

Scope: release builds via GitHub Actions (NSIS installer like Tamim OS's), update check in the app, first-run wizard (keys, vault path, Octa home, research browser login, Photoshop path or fallback), `SETUP.md` final, the health check from spec 013 as the wizard's last page, tag v0.1.0 and publish at the Octa Code location.

Acceptance: Bedo Mousa's machine reaches a green health check from the installer plus `SETUP.md` only; `git log` contains no secrets; the app shows the version and offers updates.

---

## Order and estimate

| Spec | Depends on | Size |
|---|---|---|
| 000 | — | M |
| 001 | 000 | L |
| 002 | 001 | S |
| 003 | 001, 002 | M |
| 004 | 001 | L |
| 005 | — | M |
| 006 | 001–005 | L |
| 007 | 003 | L |
| 008 | 003, 006 | M |
| 009 | 002, 006 | S |
| 010 | 001, 003, 004, 014 | XL |
| 011 | 006–010 | L |
| 012 | 002 | S |
| 013 | all | M |
| 014 | 001 | M |
| 015 | 001–013 | L |

005 and 012 can run in parallel with 001–004. Everything else is sequential.
