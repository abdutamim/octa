# spec-016 — Octa Code identity and a useful home

## Built

- Replaced the burgundy/plum/cream renderer theme with the Octa Code lavender/violet token system in [src/styles.css](../../src/styles.css), including dark-default/light themes, Outfit typography, Arabic fallback, status colors, shadows, focus treatment, button press treatment, and the `.octa-shell` radial background.
- Added the Octa Code mark to the sidebar, first-run rail, and loading screen through [src/components/OctaMark.tsx](../../src/components/OctaMark.tsx); configured the BrowserWindow icon, window title, product name, installer name, and executable checks for `Octa`.
- Bundled Outfit through `@fontsource/outfit` and imported weights 400/500/600/700 in [src/main.tsx](../../src/main.tsx).
- Added the non-empty idle home in [src/components/OctaPage.tsx](../../src/components/OctaPage.tsx): localized greeting, health-backed setup banner, six W1–W6 registry-backed workflow cards, Arabic prompt prefill/focus behavior, recent jobs limited to five, and recent plan/empty states.
- Added the `plans:list` preload/main IPC bridge and seeded new SQLite databases with `firstRunCompleted=false`; the existing Settings and Health entry points plus the new home setup banner reach [src/components/FirstRun.tsx](../../src/components/FirstRun.tsx).
- Updated render/settings/style tests for the new idle content, recent activity behavior, fresh first-run state, and removal of the old palette.

## Copied and reused

- Copied `C:\Users\Admin\Desktop\Projects\octa\.octa\worktrees\spec-016\assets\brand\octa-code-mark.svg` to [src/assets/octa-code-mark.svg](../../src/assets/octa-code-mark.svg). SHA-256 matches the source.
- Reused the existing `installer/icon.ico`; [electron-builder.yml](../../electron-builder.yml) continues to point to `installer/icon.ico`, and the BrowserWindow now uses the same icon.
- No files were copied from or modified in `C:\Users\Admin\Desktop\Projects\tamim-os`.
- No Python pipeline files were imported or spawned.

## Screenshots

- [Dark home](./spec-016/home-dark.png)
- [Light home](./spec-016/home-light.png)

The screenshots were generated with a temporary Playwright harness at the existing spec-008 viewport size (1520×1080) and inspected after capture.

## Verification

- `npm run typecheck` — PASS.
- `npm test` — PASS: 40 test files, 220 tests.
- `npm run build` — PASS: typecheck, tests, Electron/Vite bundles, and `Octa build artifacts verified.`
- `npx impeccable detect src/components/OctaPage.tsx src/components/Sidebar.tsx src/components/FirstRun.tsx src/components/OctaMark.tsx src/App.tsx src/styles.css src/components/MapPage.tsx src/components/map.ts src/main.tsx src/index.html` — PASS with no findings.
- `git diff --check` — PASS.

## Acceptance checklist

- ✅ Octa Code lavender/violet token layer replaces the previous burgundy/plum/cream theme; dark is the default and light is available.
- ✅ Outfit is bundled locally, with an Arabic-capable fallback stack.
- ✅ The Octa Code mark is used in the sidebar and window; title/product name are `Octa`; builder icon path is `installer/icon.ico`.
- ✅ Idle home is populated with greeting, setup banner, six workflows, recent jobs, recent plans, and the existing voice bar.
- ✅ Setup banner reads health IPC, lists missing essentials, and opens the first-run wizard.
- ✅ Workflow Start buttons prefill an Arabic prompt and focus the conversation input.
- ✅ Fresh SQLite databases explicitly store `firstRunCompleted=false`; first-run remains reachable from Settings and the setup banner.
- ✅ Render, palette, fresh-database, and recent-activity tests are green.
- ✅ Dark and light home screenshots are saved under `.octa/reports/spec-016/`.

## Open questions / owner setup

- The owner still needs to provide Gemini/Brave keys, an Obsidian vault path, and any desired research-browser logins through the first-run wizard. Optional Photoshop, Python/Playwright, and voice model setup remain guided there.
- No blocking open questions remain.
