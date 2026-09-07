# spec-001 report - Job runner and `job_runs`

## Built

- Added `electron/core/jobs/runner.ts` with `startJob(spec): JobHandle`, injectable subprocess execution, native CLI resolution, hidden Windows processes, stdin prompts, job-folder cwd, process-tree cancellation, time budgets, retries, result normalization, and event persistence.
- Implemented the documented `claude-plan`, `claude-skill`, `codex-exec`, `codex-scout`, `codex-critic`, `codex-review`, and `gemini-inline` paths. The extra `codex-scout` name is supported because the spec acceptance line uses it as the research alias.
- Added Claude stream-json and Codex JSONL parsers producing common `text`, `tool`, `usage`, `error`, and `done` events. Claude stream mode includes the current CLI's required `--verbose`; Codex job-folder commands include the current CLI's required `--skip-git-repo-check`.
- Added job storage in `electron/db/jobs.ts` with `job_runs`, `workflows`, and `plans`, WAL mode, the copied 15-second busy-timeout helper, CRUD, filtering, and approval recording.
- Added the `brief.md`, `inputs/`, `skill/`, `out/`, `evidence/`, `log.jsonl`, `contract.json`, runner schemas, `planner.md`, and `result.json` job layout under the configured Octa home.
- Added manifest-based skill resolution and `runSkill({ name, input })`. Skills are junction-mounted into the job folder, passed through `--add-dir`, and inlined into Codex prompts.
- Added `jobs:start`, `jobs:cancel`, `jobs:list`, `jobs:get`, `jobs:approve`, and outbound `jobs:events` IPC, the preload bridge, a bilingual Jobs page with a stop-slop demo form, live log, cancel, and approval controls.
- Added the requested recorded fixtures and lifecycle tests under `tests/fixtures/` and `tests/jobs/`.
- Added the configurable `skillsLibraryPath` setting and its bilingual Settings control.

## Copied from reference

No new source files were copied for spec 001. The runner reuses the ChatProvider foundation and `busy-timeout.ts` already brought into this checkout by spec 000. Those existing foundation files were copied from `C:\Users\Admin\Desktop\Projects\tamim-os` at spec-000 reference commit `4311c05b1d1bc4605663891f103d2fec7489bf37`.

The old Octa Code Python implementation was not imported or spawned.

## Commands and results

- `claude -p --output-format stream-json --verbose` on a trivial prompt - invoked for the recorded fixture; the installed Fable account returned a real 403 publisher data-sharing error, which is preserved in `tests/fixtures/claude-stream.jsonl`.
- `codex exec --json --ephemeral --skip-git-repo-check -m gpt-5.6-luna -s read-only -C <workspace>` on a trivial prompt - ran successfully and produced `tests/fixtures/codex-jsonl.jsonl`.
- `npm run typecheck` - passed.
- `npm test` - passed, 9 files / 50 tests.
- `npm run build` - passed: typecheck, 50 tests, electron-vite main/preload/renderer bundles, and build artifact verification.
- `git diff --check` - passed.

## Real acceptance demo

The final real `codex-exec` stop-slop run used a paragraph containing common AI-writing patterns. It ran under `C:\Octa\jobs\d6db4177-92b0-4a8a-90aa-0ebd25ae088d`, created `out/revised.txt` and the agent's `out/result.json`, and the runner wrote the root `result.json`. The safe draft correctly ended at `needs_approval`.

```json
{
  "job_id": "d6db4177-92b0-4a8a-90aa-0ebd25ae088d",
  "step_id": "",
  "status": "needs_approval",
  "outputs": [
    {
      "path": "./out/revised.txt",
      "type": "text/plain",
      "title": "Stop-slop rewrite"
    }
  ],
  "sources": "The supplied stop-slop skill and the job brief; no external sources used.",
  "metrics": {
    "source_count": 0,
    "languages": ["en"],
    "tokens_in": 267573,
    "tokens_out": 6699,
    "seconds": 121.101,
    "cost_usd": 0
  },
  "questions": [],
  "notes": "Draft only. No sending, publishing, or payment occurred. Stop-slop review: directness 10/10, rhythm 9/10, trust 9/10, authenticity 9/10, density 10/10 (47/50)."
}
```

## Acceptance checklist

- ✅ `jobs:start` creates a job id, streams events, and writes root `result.json` under the configured Octa home.
- ✅ `claude-skill` stop-slop resolution, `codex-exec`, and the `codex-scout` alias are wired; the real Codex stop-slop demo completed.
- ✅ Cancel kills the process tree with `taskkill /T /F` on Windows; the test completes within two seconds.
- ✅ A time-budget overrun finishes as `needs_input` and includes a partial-output note.
- ✅ Claude and Codex recorded fixtures normalize through the common event stream.
- ✅ `job_runs` CRUD, WAL setup, busy timeout, approval fields, workflows table, and plans table are covered.
- ✅ Bilingual IPC-backed Jobs page provides list, live log, cancel, approve, and stop-slop launch controls.
- ✅ `npm run typecheck`, `npm test`, and `npm run build` are green.

## Open questions and owner requirements

- The installed Claude Code account currently rejects the Fable model with HTTP 403 because publisher data sharing is disabled. Enable that account capability or select an accessible Claude model before using planner/Claude-skill jobs.
- Claude Code and Codex must remain installed and signed in on the target Windows machine. The skills library path can be left empty for the repository default or set in Settings.
- No API keys were added to source or fixtures. Gemini/Vertex settings remain required only for `gemini-inline` jobs that use the real ChatProvider.
