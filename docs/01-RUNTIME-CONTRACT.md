# 01 — Runtime contract

How a job actually runs. This is the part an executor cannot guess.

## 1. Decision: skills run in headless CLIs, not in the Electron tool loop

The skills assume a Claude Code style environment: read files, run shell,
fetch URLs, write outputs. 12 skills ship Python/JSX/shell scripts, 9 need
external tools. Re-implementing that agent inside Electron would be a second
Claude Code. So:

| Runner | Command | Used for |
|---|---|---|
| `claude-plan` | `claude -p --model claude-fable-5-1 --effort medium --output-format json --add-dir <workspace> --append-system-prompt-file planner.md` | planner drafts and replies in the debate |
| `codex-critic` | `codex exec --json -m gpt-6-astra -c model_reasoning_effort="xhigh" -s read-only -C <workspace> --output-schema critique.schema.json` | Astra's critique rounds |
| `codex-exec` | `codex exec --json -m gpt-5.6-luna -c model_reasoning_effort="max" -c 'service_tier="priority"' -c features.fast_mode=true -s workspace-write -C <workspace> --add-dir <skill> --output-schema result.schema.json` | default executor for skill steps and research (scout); SKILL.md is inlined into the prompt |
| `claude-skill` | `claude -p --output-format stream-json --add-dir <skill> --add-dir <workspace> --append-system-prompt-file <skill>/SKILL.md --allowedTools <per autonomy> --model claude-sonnet-5` | skill steps that need Claude Code's tool set (MCP servers such as Chrome DevTools, sub-agents, scripts the skill expects Claude to drive) |
| `codex-review` | `codex exec --json -m gpt-5.6-sol -c model_reasoning_effort="high" -s read-only -C <workspace> --output-schema review.schema.json` | Sol reviews a step's output against its acceptance criteria before any gate |
| `build` | native TypeScript pipeline (`electron/core/octa/build/`): spec writer → planner → coder sessions in a git worktree (`codex-exec` with Luna) → QA loop (`codex-review` with Sol) → merge; roadmap / competitor-roadmap / ideation as the same pipeline's read-only phases | code builds, tools, sites, roadmaps |
| `gemini-inline` | existing `ChatProvider` in-process | conversation, quick answers, vision on screenshots, TTS, wake word |

Which runner a skill step uses: `codex-exec` by default; `claude-skill` when
the manifest marks the skill `runner: claude` (set in spec 002 for skills that
need MCP tools or Claude-driven scripts: web-perf, frontend-ui-polisher,
skill-creator, photoshop-*, carousel-forge). The reviewer runs after every
executor step; a failed review sends the step back once with the review
attached, then to a gate.

### 1.1 Planner debate protocol

```
round 0  Fable: plan v0 (schema §3.1) from brief + brain
round n  Astra: critique {issues[], missing_questions[], risks[], verdict: agree|revise}
         Fable: plan v(n) + reply to each issue (accepted / rejected with reason)
stop     when Astra's verdict is agree, or after 4 rounds
output   final plan + debate.md (every issue, who won, why) + merged questions[]
```

Questions raised by either model are merged and deduplicated; blocking ones
stop the job and are spoken to the user. The debate transcript is stored with
the plan so the owner can read why a step exists.

Both CLIs are already logged in on this machine (Claude Code 2.1.257, Codex
0.147.0). Electron spawns them with `child_process.spawn`, never a shell, and
pipes stdin for the prompt. Windows note: `creationflags` hidden window; kill
tree on cancel.

## 2. Workspace layout per job

```
%USERPROFILE%\Octa\
  knowledge\            company brain (mirrored from the vault, read-only for jobs)
  jobs\<job_id>\
    brief.md            what the planner sent
    inputs\             files Bedo attached, screenshots, previous outputs
    skill\  -> link     the skill folder (or copied when links are not allowed)
    evidence\           scout output: sources.jsonl, pages\*.md, report.md
    out\                deliverables (md, html, pdf, psd, xlsx...)
    log.jsonl           streamed events from the runner
    result.json         final structured result (schema below)
```

`Octa\` lives outside the project tree and outside AppData (MSIX virtualization).

## 3. Schemas

### 3.1 Plan (planner → runner)

```json
{
  "plan_id": "uuid",
  "language": "ar-EG | en | mixed",
  "summary": "one paragraph in the user's language",
  "questions": [
    { "id": "q1", "text": "...", "why": "...", "options": ["..."], "blocking": true }
  ],
  "assumptions": ["..."],
  "workflow": "review-website | build-website | market-project | think-project | invoice | research | custom",
  "steps": [
    {
      "id": "s1",
      "runner": "codex-scout | claude-skill | octa-code | gemini-inline",
      "skill": "competitor-profiling",
      "input": { "urls": ["..."], "language_plan": ["ar", "en", "fr"] },
      "needs": ["s0"],
      "gate": "none | review | approve",
      "autonomy": "led | assisted | auto",
      "acceptance": ["≥100 sources", "report.md exists", "..."]
    }
  ],
  "deliverables": ["out/report.md", "..."],
  "estimated_minutes": 25
}
```

Rule: `questions[].blocking = true` on any item → runner stops, UI/voice asks,
answers appended to the brief, planner re-runs. Non-blocking questions are
shown but do not stop execution.

### 3.2 Job result (runner ← any step)

```json
{
  "job_id": "uuid", "step_id": "s1", "status": "ok | failed | needs_approval | needs_input",
  "outputs": [{ "path": "out/report.md", "type": "markdown", "title": "..." }],
  "sources": "evidence/sources.jsonl",
  "metrics": { "source_count": 137, "languages": ["ar", "en", "fr"], "tokens_in": 0, "tokens_out": 0, "seconds": 0 },
  "questions": [], "notes": "..."
}
```

### 3.3 `job_runs` table (SQLite, `electron/db/jobs.ts`)

```
job_runs(id TEXT PK, plan_id, workflow, step_id, skill, runner, department,
         status, autonomy, gate, input_json, result_json, source_count,
         cost_json, started_at, finished_at, approved_by, approved_at, error)
workflows(id, name, version, definition_json, created_at, updated_at)
plans(id, conversation_id, brief_md, plan_json, round, created_at)
```

## 4. Prompt assembly for a `claude-skill` run

System prompt (appended to Claude Code's own):

```
<octa>
You are running inside Octa Assistant for Bedo (Tamim). Language rule: reply in {language}.
Company brain follows; treat it as ground truth and never contradict it.
{knowledge/company.md}
{knowledge/clients/<client>.md if any}
Skill to execute: {skill name}. Its SKILL.md is your instruction set; read
references/ on demand. Write deliverables to ./out. Do not send, publish or
pay; write what you would send to ./out and set status needs_approval.
When information is missing, do not invent it: return status needs_input with questions[].
Finish by writing result.json matching the schema in ./contract.json.
</octa>
```

User prompt = `brief.md` + step input JSON.

Allowed tools by autonomy:

| autonomy | allowedTools |
|---|---|
| led | Read, Grep, Glob, WebFetch, WebSearch |
| assisted | + Write, Edit, Bash(limited: python, node, uv, npx, ffmpeg) |
| auto | same as assisted; approvals still gate outward actions at the runner level |

## 5. Codex scout contract

Prompt = research task from the plan + the protocol in `02-RESEARCH-ENGINE.md`
inlined + `--output-schema evidence.schema.json`. Sandbox: `workspace-write`
in the job folder. The scout may not touch anything outside `jobs/<id>/`.

## 6. Approval gates

| gate | who | how |
|---|---|---|
| review | Bedo | outputs shown; "continue" or comments → step re-runs with comments |
| approve | Bedo | explicit yes on the exact payload (email text, post, invoice PDF, deploy target). Channels: in-app button, ntfy action button on phone, or voice "approve" after the assistant reads the payload back |

Never auto-approve. A gate older than 24 h expires and the job is marked stale.

## 7. Failure and resume

- Each step is idempotent on its `out/` folder; re-run overwrites.
- Runner retries a failed step once with the error appended to the prompt.
- Rate-limit / capacity errors: wait and retry (Codex 15 min, Claude 5 min), max 3.
- A job can be resumed from any step via `job_runs` (inputs are on disk).
- Cancel kills the process tree and marks the step `cancelled`.

## 8. Cost and time budget

Per step defaults (planner may raise with a reason): 30 minutes, 2M input
tokens for scouts, 300k for skill runs. Exceeding the budget stops the step
with `needs_input` and a summary of what was gathered so far.

## 9. Language mirror implementation

Detect on the last user message (script ratio + Gemini language hint). Store
on the conversation. Pass `{language}` to every runner. The TTS voice is the
same for both languages (Gemini TTS voices are multilingual).
