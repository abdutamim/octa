# Task: spec 015 — Release and partner setup

Read `docs/06-SPECS.md` section 015, `docs/07-DECISIONS.md` D9/D15, `SETUP.md`, `.env.example`.

Build:
1. `.github/workflows/release.yml`: on tag `v*`, build the NSIS installer on windows-latest, attach to a GitHub release; CI already runs typecheck/test/gitleaks.
2. In-app update check (`electron/core/octa/update.ts`): read the latest GitHub release for the configured repo, compare versions, show a banner with the download link (no auto-install).
3. First-run wizard (spec 013) final pass: order = language → keys → paths → health → research-browser logins → Photoshop or fallback → done; the last page is the health table.
4. `SETUP.md` final: step-by-step for a second Windows machine (Bedo Mousa): installs, logins (`claude` and `codex` login steps), keys to obtain and where (Gemini AI Studio, optional Vertex, optional Brave, ntfy topic), vault setup, first intake. Keep it under 2 pages, Arabic section + English section.
5. Secret hygiene: `gitleaks` config, pre-commit hook script (`scripts/precommit.mjs`) blocking keys; confirm `git log -p | gitleaks` clean.
6. Tag `v0.1.0` locally (do not push; the owner pushes). Report: exact commands the owner runs to create the GitHub repo in place of Octa Code and push.
