# spec-017 report

## Built

- Translated the Tasks, Clients, Document Editor, and Brand Editor surfaces through the shared `t(key, locale)` catalog, including buttons, placeholders, empty states, tooltips, ARIA labels, status text, and locale-aware dates/durations/currency.
- Threaded `locale` from `App.tsx` into Tasks and Clients and through the document/brand editor flows.
- Reworked the copied work-surface styling into Octa lavender tokens, Thmanyah Sans, 14px radii, shared shadows, logical RTL/LTR properties, and the existing Octa card/input/button visual language.
- Polished Workflows with localized six-card home-style workflow cards, RTL-aware layout, localized empty state and gate controls, and consistent spacing.
- Kept the sidebar to one entry per page in the required order and aligned the page icons.
- Added Arabic render coverage for Tasks, Clients, Document Editor, and Brand Editor, including assertions for English literal leaks.

## Files changed

- `src/App.tsx`
- `src/components/BrandEditor.tsx`
- `src/components/ClientsPage.tsx`
- `src/components/DocumentEditor.tsx`
- `src/components/Sidebar.tsx`
- `src/components/TasksPage.tsx`
- `src/components/WorkflowsPage.tsx`
- `src/i18n/ar.ts`
- `src/i18n/en.ts`
- `src/styles.css`
- `tests/pages-i18n.test.ts`

## Copied/reference sources

The four copied surfaces remain based on the read-only reference app at:

`C:\Users\Admin\Desktop\Projects\tamim-os`

The reference app was not modified. No Python build-pipeline code was imported or spawned.

## Verification

- ✅ `npm rebuild better-sqlite3` — passed for host-node Vitest execution.
- ✅ `npm run typecheck` — passed.
- ✅ `npm test` — 41 test files passed, 225 tests passed.
- ✅ `npm run rebuild:electron` — passed for Electron 42.6.0 / x64.
- ✅ `npx impeccable detect src/App.tsx src/components/BrandEditor.tsx src/components/ClientsPage.tsx src/components/DocumentEditor.tsx src/components/Sidebar.tsx src/components/TasksPage.tsx src/components/WorkflowsPage.tsx src/i18n/ar.ts src/i18n/en.ts src/styles.css tests/pages-i18n.test.ts` — passed with no findings.
- ✅ `git diff --check` — passed.
- ✅ Captured and visually inspected dark Arabic screenshots with the spec-008-pattern Playwright harness at 1520×1080:
  - `.octa/reports/spec-017/tasks-dark-ar.png`
  - `.octa/reports/spec-017/clients-dark-ar.png`
  - `.octa/reports/spec-017/workflows-dark-ar.png`

## Acceptance checklist

- ✅ Tasks, Clients, Documents, and Brands are bilingual with no copied English UI literals leaking in Arabic render coverage.
- ✅ Octa token styling, shared component language, 14px radius, RTL/LTR logical layout, and dark-mode surfaces are applied.
- ✅ Workflow cards, spacing, empty state, selected workflow, and review gate are polished and localized.
- ✅ Sidebar has one entry per page in the requested order with consistent icons.
- ✅ Typecheck, tests, visual lint, diff check, and required screenshots are complete.

## Open questions / owner setup

None for this spec. The existing `DEFAULT_BRAND` seed in `electron/types.ts` is runtime seed data outside the page/CSS scope and was intentionally left unchanged; update it in its owning spec if newly seeded documents should use Octa defaults.
