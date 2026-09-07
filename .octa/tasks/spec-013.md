# Task: spec 013 — Packaging and environment

Read `docs/05-ENVIRONMENT.md` in full and `docs/06-SPECS.md` section 013. Copy from the reference app: `electron-builder.yml`, `installer/installer.nsh`, `scripts/verify-build.mjs`, `scripts/test-executable.mjs` and adapt names to Octa.

Build:
1. `electron/core/octa/health.ts` — checks with fix hints: Node, Claude Code (`claude --version` + a 5-second `-p` ping), Codex (`codex --version` + ping), uv + Python 3.12 outside AppData (`UV_PYTHON_INSTALL_DIR`, `UV_CACHE_DIR` under octaHome), Playwright browsers under octaHome, ffmpeg (bundled static path), Photoshop path (optional), Brave key (optional), Gemini key + one call, vault path readable, octaHome writable, research browser logins status, wake-word model present. Each returns `{ok, detail, fix}`.
2. `src/components/HealthPage.tsx` and a first-run wizard (`FirstRun.tsx`): keys, paths, run health, optional logins (spec 004 login flow), Photoshop or fallback. Wizard shows on first launch and from Settings.
3. Guided installs: buttons that run the exact commands (uv python install to octaHome, playwright install with the env var) with streamed output.
4. Packaging: electron-builder NSIS config, `npm run dist`, `verify-build` script, app icon placeholder, version shown in Settings.
5. Update `docs/05-ENVIRONMENT.md` to match what the health check actually tests. Tests: each check with mocked commands; wizard state machine.
6. Run the real health check on this machine and paste the table into the report.
