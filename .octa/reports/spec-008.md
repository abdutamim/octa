# spec-008 - Octa panel UI

## Built

- Added [OctaPage.tsx](../../src/components/OctaPage.tsx) as the home control room with a persistent conversation column, planner handoff, questions and debate view, live execution steps, approval gates, outputs, and the spec-004 source ledger.
- Reused the existing spec-003 [PlanCard.tsx](../../src/components/PlanCard.tsx) and spec-004 [SourcesTable.tsx](../../src/components/SourcesTable.tsx) without modifying their owning files.
- Added a safe VoiceBar slot. It renders a bilingual placeholder until spec-007 supplies its real component.
- Added live job and planner event subscriptions, state hydration, exact gate payload rendering, one-click approve, reject/cancel fallback, comment action, failure recovery context, and output deduplication.
- Markdown outputs open in an in-app document viewer. PDFs, HTML, and other external files use the new `files:open` IPC bridge backed by Electron `shell.openPath`.
- Added the exact sidebar order: Octa, Jobs, Workflows, Skills, Brain, Settings. Added the translated Workflows empty page and active navigation state.
- Added bilingual Octa strings and light/dark burgundy, plum, and cream tokens. The page uses `dir="rtl"` for Arabic, logical spacing, responsive breakpoints, visible focus rings, labelled controls, live regions, and reduced-motion handling.
- Added [octapage.test.ts](../../tests/octapage.test.ts) with mocked IPC render coverage for idle, questions, running, gate, done, failed, and Arabic RTL navigation.

## Copied and reused code

- Copied from `C:\Users\Admin\Desktop\Projects\tamim-os`: none. The reference checkout was not modified.
- Copied from `C:\Users\Admin\Documents\Codex\2026-08-15\c-users-admin-appdata-local-programs\work\octa-code-backend-final-20260830`: none. No Python pipeline was imported or spawned.
- Reused the current repository's spec-003 PlanCard and spec-004 SourcesTable as noted above.

## Frontend UI polisher audit

- Loaded the `ui-forge` and `frontend-ui-polisher` instructions and applied their product-register, spacing, accessibility, responsive, and anti-pattern rules directly to the page.
- `npx impeccable audit ...` was attempted, but the installed Impeccable 2.1.9 CLI has no `audit` command and returned `Warning: cannot access audit`.
- Ran the available equivalent detector: `npx impeccable detect src/components/OctaPage.tsx src/components/Sidebar.tsx src/components/WorkflowsPage.tsx src/App.tsx src/styles.css`. It initially flagged the inherited root `Inter` font declaration; that was changed to the Windows-native Segoe stack. The final detector run returned no findings.
- Manual polisher score: accessibility 4/4, craft 4/4, responsive behavior 4/4, theme contrast 4/4, polish 4/4. No remaining P0 or P1 issues.

## Screenshots

Generated with a temporary Playwright harness and inspected after capture:

- [idle-dark.png](./spec-008/idle-dark.png)
- [questions-dark.png](./spec-008/questions-dark.png)
- [running-dark.png](./spec-008/running-dark.png)
- [gate-dark.png](./spec-008/gate-dark.png)
- [done-light.png](./spec-008/done-light.png)
- [failed-rtl.png](./spec-008/failed-rtl.png)

## Verification

- `npm run typecheck` - PASS.
- `npm test` - PASS: 21 test files, 112 tests.
- `npm run build` - PASS: typecheck, tests, Electron main/preload/renderer bundles, and `Octa build artifacts verified.`
- `npx impeccable detect ...` - PASS with no findings after the font fix.
- `git diff --check` - PASS.
- `npx playwright install chromium` - PASS. The browser was installed in the user Playwright cache to generate the required PNGs.

## Acceptance checklist

- ✅ Conversation, plan, questions, debate, jobs, live events, gates, outputs, failure state, and sources are visible on the Octa home page without opening a separate file.
- ✅ Gate payload is shown as the exact JSON/string held by the job, with one-click approve plus reject and comment controls.
- ✅ Markdown outputs use the in-app viewer; PDFs and HTML use the OS file opener through Electron.
- ✅ Sidebar contains Octa, Jobs, Workflows, Skills, Brain, Settings in the requested order.
- ✅ Dark/light burgundy-plum-cream tokens, Arabic RTL layout, keyboard labels/focus treatment, and responsive layout are implemented.
- ✅ Render tests cover every requested state with mocked IPC.
- ✅ Screenshots are saved under `.octa/reports/spec-008/`.

## Open questions / owner setup

- Spec-007 does not currently expose a VoiceBar component in this checkout, so the home page intentionally renders its placeholder slot until that component is available.
- The runtime contract exposes `jobs:cancel` but not a dedicated gate-reject or comment persistence IPC. The default Reject action uses the supported cancel path and updates the local panel; an owner can provide `onRejectGate` and `onCommentGate` callbacks when the workflow runner adds dedicated semantics.
- Output file reads and opens are constrained to the configured Octa home path, defaulting to `C:\Octa`.
