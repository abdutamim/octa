# Task: spec 000 — New repository

Read `docs/00-OCTA-ASSISTANT.md`, `docs/01-RUNTIME-CONTRACT.md`, `docs/05-ENVIRONMENT.md`, then `docs/06-SPECS.md` section "000 · New repository". Implement it in this repo (the current directory is the new, empty `octa` repo).

Concrete steps:
1. Scaffold: `package.json` (name `octa`, version 0.1.0), electron-vite config, `tsconfig*.json`, Tailwind 4 via `@tailwindcss/vite`, vitest config, `src/index.html`, `src/main.tsx`, `src/App.tsx` with a Sidebar shell (Settings page only for now), `electron/main.ts`, `electron/preload.ts`. Mirror the reference app's structure (`electron/`, `src/`, `tests/`, `scripts/`) so later copies fit. Use the same dependency versions as the reference `package.json` unless a newer one is required.
2. Copy from the reference app with their tests where tests exist: `electron/cloud/chat.ts`, `gemini.ts`, `gemini-chat.ts`, `vertex.ts`, `codex-chat.ts`, `fallback-chat.ts`, `electron/db/busy-timeout.ts`, the settings persistence (`app_settings` table code and `AppSettings` type — extract from `electron/db/sessions.ts` / `electron/types.ts` only what settings need), `electron/core/notify.ts`, theme tokens/colors from the reference `src/styles.css` (burgundy/plum/cream, dark+light). Adjust imports; do not drag dictation, tasks, invoices, etc. — they come in later specs.
3. Settings page: Gemini API key, Vertex project id + service-account JSON path, Groq key (optional), ntfy topic, Octa home path (default `C:\Octa`), vault path, Photoshop path, Brave Search key (optional). Saved to SQLite in `C:\Octa\octa.db` (create dir). Include an "AI test" button that calls the copied Gemini client.
4. i18n: `src/i18n/ar.ts`, `en.ts`, `t()` helper, RTL when Arabic.
5. `.env.example` listing every key above with a one-line how-to (keys are NOT read from .env at runtime; the file documents them for SETUP.md). `SETUP.md` first draft (Windows: Node 22, Claude Code, Codex CLI, uv + Python 3.12 outside AppData, Playwright, optional Photoshop). `LICENSE` MIT + `NOTICE.md` naming Auto-Claude (AGPL) as the design reference for the build pipeline prompts.
6. CI: `.github/workflows/ci.yml` running typecheck + test on windows-latest, plus a secret scan step (gitleaks action).
7. `npm install`, `npm run typecheck`, `npm test` green. `npm run dev` must open a window with Settings (verify it builds with `npm run build` at least).
8. Commit and write the report as AGENTS.md says.
