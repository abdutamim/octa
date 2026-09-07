# Octa Assistant — master plan

Written 2026-09-05. Supersedes `docs/AGENT-OS-PLAN.md` where they differ.
Read this file first, then the numbered files in this folder in order.

```
docs/octa/
  00-OCTA-ASSISTANT.md   this file: what Octa is, the three brains, hard rules, build order
  01-RUNTIME-CONTRACT.md how a job runs: subprocess contracts, I/O schemas, approval gates
  02-RESEARCH-ENGINE.md  the 100-source multilingual research protocol
  03-COMPANY-BRAIN.md    knowledge folder layout + the intake interview
  04-WORKFLOWS.md        the launch workflows, step by step, with gates
  05-ENVIRONMENT.md      tools, keys, runtimes each skill needs, and what is missing
  06-SPECS.md            numbered specs with acceptance criteria, ready for Octa Code
  07-DECISIONS.md        the questions Bedo answers before spec 001 starts
```

---

## 1. What Octa is

Octa Assistant is Bedo's Jarvis: a voice-first desktop assistant inside Tamim
OS that talks in whatever language Bedo speaks (Egyptian Arabic, English, or
mixed), turns a conversation into a plan, asks back whenever something is
unclear, researches the world deeply before it acts, and then executes work
through the 110-skill library and defined workflows: building websites,
reviewing websites, marketing any project, planning and thinking through any
project, invoices, client ops.

Product name: **Octa Assistant** (the app-level assistant). **Octa Code** stays
the name of the coding engine it delegates to.

## 2. The three brains

| Brain | Model | Runs as | Job |
|---|---|---|---|
| **Voice / front** | Gemini Live (newest native-audio model with good Egyptian Arabic); `gemini-3.5-flash` for text | inside Electron, existing `electron/cloud/gemini*.ts` | Always listening for the wake word "أوكتا / يا أوكتا" (push-to-talk too), talk back in the user's language, keep the thread, hand off to the planner |
| **Planner (debate)** | Claude **Fable 5.1** (effort medium) via `claude -p` **+** GPT-6 **Astra** (effort xhigh) via `codex exec` | two subprocesses, alternating | Fable drafts the plan from the conversation + brain; Astra critiques; Fable answers; until both agree (max 4 rounds). Either may raise **questions back** to the user; blocking questions stop everything |
| **Scout** | GPT-5.6 **Luna**, reasoning max, fast mode | `codex exec --json` + the research browser | Gather files, search in every relevant language, read ≥100 sources, write evidence packs |
| **Executor** | GPT-5.6 **Luna** (fast, max) for text work and all code; `claude -p` when a skill needs Claude Code's tool set | subprocess | Run skills and workflows, build with Octa Code |
| **Reviewer** | GPT-5.6 **Sol** | `codex exec` | Reviews every execution output against the plan's acceptance criteria before it reaches a gate |

Details in `01-RUNTIME-CONTRACT.md`. Model choices are decision D12 in `07-DECISIONS.md`.

Two users from day one: the owner (Tamim: websites, self-marketing) and
Bedo Mousa (marketing, real-estate marketing, needs a website). Each runs his
own Octa with his own company brain; skills and code are shared through one
open-source GitHub repo named **Octa**.

**Octa is a new application built from scratch** (decision D15). It is not
an edit of Tamim OS and not an edit of Octa Code. Tamim OS modules that are
proven (Gemini transport, dictation, SQLite layer, PDF, vault, notify) are
copied into the new codebase where they fit; Octa Code's pipeline is
re-implemented natively in TypeScript. The new repo replaces Octa Code at its
GitHub location. Stack stays Electron + TypeScript + React + SQLite so the
copied modules work unchanged.

## 3. The loop

```
 voice/text ──▶ Conversation (Gemini) ──▶ "plan this" ──▶ Planner (Claude)
                      ▲                                        │
                      │ questions read back to Bedo   ◀────────┤ questions? (must ask)
                      │                                        │ plan approved
                      │                                        ▼
                      │                         ┌── Research jobs ──▶ Scout (Codex, ≥100 sources)
                      │                         │                          │ evidence pack
                      │                         ▼                          ▼
                      │                    Workflow runner ──▶ skills in claude -p / Octa Code
                      │                         │
                      │                    approval gate (send / publish / pay / delete)
                      │                         │
                      └────── result spoken + shown ◀── job_runs + documents + vault
```

## 4. Hard rules (non-negotiable, enforced in code, not in prompts)

1. **Mirror the language.** Reply in the language of the last user turn.
   Mixed Arabic/English stays mixed; English terms stay in Latin script.
2. **The planner must ask.** If the plan JSON has `questions[]`, nothing
   executes. Questions are spoken and shown; answers go back to the planner.
   Up to 3 rounds, then the planner states assumptions explicitly and proceeds
   only with Bedo's "go".
3. **Research depth.** Any research job (persona, competitors, market, topic)
   is rejected by the runner unless the evidence pack has ≥100 distinct
   sources across the languages the topic lives in. See `02-RESEARCH-ENGINE.md`.
4. **Brain first.** Every skill run gets the company brain prepended. A job
   on a client gets that client's file too.
5. **Outward actions are gated.** Send, publish, post, invoice, pay, delete,
   and anything touching a client's live system waits for approval (in-app,
   phone via ntfy, or spoken "approve" after a read-back).
6. **Every claim has a source.** Reports carry a source ledger; the planner
   rejects unsourced numbers.
7. **Everything is a job.** Every run writes a `job_runs` row with inputs,
   outputs, cost, duration, and status. The map lights up from this table.
8. **Autonomy is earned.** Every workflow starts human-assisted; promotion to
   autonomous after 10 clean runs; demotion on one rejection.

## 5. What already exists and is copied into the new app

Copied, not imported: the new repo starts empty and each module below is
brought over with its tests when its spec needs it.

| Need | Existing piece in Tamim OS |
|---|---|
| Gemini transport with Vertex fallback | `electron/cloud/vertex.ts`, `gemini.ts`, `gemini-chat.ts` |
| Chat provider abstraction + Codex provider + fallback | `electron/cloud/chat.ts`, `codex-chat.ts`, `fallback-chat.ts` |
| Tool loop with confirmation gate | `electron/core/assistant.ts` (13 tools in `assistant-tools.ts`) |
| Dictation (STT), overlay, global hotkey | `electron/core/dictation.ts`, `src/overlay/` |
| Tasks, clients, invoices, documents, brands | `electron/db/*.ts`, `pdf.ts`, `documents.ts` |
| Screenshot → Gemini Vision → task | `screen-capture.ts`, `gemini-vision.ts`, `inbox.ts` |
| Vault (Obsidian) read/search/graph | `vault.ts`, `vault-graph.ts` |
| Daily brief, task triggers, time tracking | `daily-brief.ts`, `task-trigger.ts`, `time-tracking.ts` |
| Phone notifications | `notify.ts` (ntfy) |
| Skills library + manifest with verdict/autonomy | `skills-library/` |
| Code build pipeline | re-implemented natively (spec 010); the old Octa Code stays as the reference for the phase design, prompts in `prompts/`, and the recovery/QA logic |

## 6. What is new (build order)

1. **Job runner + `job_runs`** — the spine. Spawns `claude -p` / `codex exec`,
   streams output to the UI, records everything.
2. **Skill registry** — loads `skills-library/MANIFEST.json`, hides merged and
   dropped, exposes `list_skills` / `run_skill`.
3. **Planner protocol** — conversation → brief → Claude plan JSON with
   questions loop.
4. **Research engine** — Codex scout with the 100-source ledger and the
   multilingual query plan.
5. **Company brain** — `knowledge/` in the vault + intake interview.
6. **Workflow runner** — JSON workflows, gates, retries, resume.
7. **Voice** — Gemini Live API session, language mirror, read-back of
   questions and results; push-to-talk on the existing hotkey.
8. **Map page** — departments × skills, coloured by `job_runs`.
9. **Native build pipeline** — spec → plan → build in a git worktree → QA → merge, in TypeScript, with Luna coding and Sol reviewing.
10. **Launch workflows** — the six in `04-WORKFLOWS.md`, each with a demo.

Specs for each are in `06-SPECS.md`.

## 7. Success criteria for "done"

Octa is done when, on this machine, Bedo can do all six of these by voice
without touching a file:

1. "راجع الموقع ده" with a URL → one report (CRO + SEO + performance + UI
   critique) with a prioritized fix list, in Arabic, sourced, in under 20 minutes.
2. "ابنيلي موقع لـ X" → site architecture, copy, design system, then an Octa
   Code build in an isolated workspace, with a preview URL and a punch list.
3. "اعمل ماركتنج لمشروع X" → intake questions asked back, a 100+ source
   market and competitor study, a dream buyer persona, an offer, a 30-day
   plan, and the first week of posts and ads drafted for approval.
4. "فكّر معايا في X" → a structured thinking session (six hats or concept
   fan as fitting), a decision memo, and tasks created.
5. "ابعت فاتورة لـ Y" → invoice from time tracking, PDF, approval, sent,
   overdue follow-up scheduled.
6. Every one of the above shows up on the map, in `job_runs`, and in the
   vault, with sources.
