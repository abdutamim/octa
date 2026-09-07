# spec-005 report — Company brain

## Built

- Added `electron/core/octa/brain.ts` with the one-way vault `knowledge/` → `C:\Octa\knowledge` mirror, initial sync, debounced `fs.watch`, safe symlink handling, file listing, injection selection, and an approximate 6,000-token cap with `[truncated]`.
- Added the `brain_proposals` SQLite queue with pending/approved/rejected lifecycle, approval-gated vault writes, and target-path containment below `knowledge/`.
- Added `electron/core/octa/intake.ts` with the exact 20 Arabic questions from the company-brain spec, A–F grouping, English i18n keys, resumable SQLite settings state, company writer output, and per-client writer output.
- Added `src/components/BrainPage.tsx`, sidebar navigation, preload/main IPC for brain and intake operations, and bilingual UI strings/styles.
- Added internal settings value access and a shared SQLite connection accessor so intake state and proposals use the existing local database without exposing internal values in renderer settings.
- Did not touch `electron/core/jobs/*`.

## Copied from the reference app

- `C:\Users\Admin\Desktop\Projects\tamim-os\electron\core\vault.ts` → `electron/core/vault.ts`.
- `C:\Users\Admin\Desktop\Projects\tamim-os\tests\vault.test.ts` → `tests/vault.test.ts`.
- The copied vault keeps relative-path, traversal, and symbolic-link containment checks and the recursive Markdown search behavior.

## Commands and results

- `npm run typecheck` — passed.
- `npm test` — passed, 10 test files / 45 tests.
- `git diff --check` — passed.

## Acceptance checklist

- ✅ `knowledge/` mirrors from the configured vault into the configured Octa home initially and through debounced `fs.watch`, one way.
- ✅ Brain injection always selects company, voice, and ICP; client, sales/invoice, and marketing context are conditional; output is capped and marked when truncated.
- ✅ Brain proposals are persisted, appear pending, reject without writing, and write into the vault only after approval.
- ✅ `brain:proposals|approve|reject|status` and `intake:next|answer|state` are exposed through the secure preload bridge.
- ✅ Intake contains all 20 Arabic prompts grouped A–F, English translations, resumable settings state, expected company files, SOP files, offer/pricing files, and per-client files.
- ✅ BrainPage provides the file list, proposal actions, and text intake flow; voice integration remains for spec 007.
- ✅ Vault containment/search behavior and all requested brain/intake behaviors have tests.

## Open questions / owner requirements

- Configure `vaultPath` and `octaHomePath` in Settings before using a real company brain.
- No additional keys or installs are required for this spec.
