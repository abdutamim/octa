# Octa — instructions for every coding agent working in this repo

Octa Assistant is a new Electron + TypeScript desktop app built from scratch. The full plan is in `docs/` (read `00-OCTA-ASSISTANT.md` first, then the file your task names). `docs/06-SPECS.md` defines numbered specs; you are always working on exactly one spec, named in `.octa/tasks/spec-NNN.md`.

## Non-negotiable rules
- Stack: Electron 40 + electron-vite, TypeScript strict, React 19, Tailwind 4, better-sqlite3, vitest. Same as the reference app so modules can be copied unchanged.
- Reference app to COPY from (read-only, never modify): `C:\Users\Admin\Desktop\Projects\tamim-os`. When a spec says "copy", copy the file(s) and their tests and record the source path in your report.
- Reference for the build pipeline design and prompts (read-only): `C:\Users\Admin\Documents\Codex\2026-08-15\c-users-admin-appdata-local-programs\work\octa-code-backend-final-20260830` (`prompts/`, `agents/`, `qa/`, `recovery.py`). Re-implement in TypeScript; never import or spawn the Python.
- Windows only for now. Paths with `path.join`. Never write under `%APPDATA%`; runtime data goes to `C:\Octa\` (configurable).
- No secrets in code or commits. Keys live in the SQLite settings table; `.env.example` documents them.
- Every user-facing string bilingual: `t('key')` with `src/i18n/{ar,en}.ts`.
- Tests: vitest under `tests/`; every spec adds tests for its acceptance criteria. `npm run typecheck` and `npm test` must pass before you finish.
- Do not touch files owned by other specs unless your task says so. If you must change a shared file, keep the change minimal and list it in the report.
- Do not invent APIs. `claude -p` and `codex exec` flags are documented in `docs/01-RUNTIME-CONTRACT.md` and `docs/05-ENVIRONMENT.md`; verify with `--help` if unsure.

## How to finish a task
1. Implement the spec's Scope fully. Meet every Acceptance line.
2. Run `npm run typecheck && npm test`. Fix until green.
3. Commit on the current branch with message `spec-NNN: <summary>`.
4. Write `.octa/reports/spec-NNN.md`: what was built (files), what was copied (from where), commands run and their results, acceptance criteria checklist with ✅/❌, open questions, anything the owner must provide (keys, installs).
