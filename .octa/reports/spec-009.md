# spec-009 — Map page

## Built

- Added `src/components/MapPage.tsx` with the map page UI, sidebar route, plain SVG rendering, skill run modal, autonomy badges, status legend, hover output cards, and `jobs:events` refresh handling.
- Added `src/components/map.ts` with the JSX-free deterministic radial layout and map data helpers. It keeps the 13 requested departments as branches from `Octa brain`, filters to the 87 visible registry skills, selects the latest `job_runs` row per skill, maps status colors, extracts the latest three output files, and generates run-form metadata.
- Extended the public registry `Skill` shape in `electron/core/skills/registry.ts` to expose the already-parsed frontmatter `argument-hint` to the renderer.
- Added bilingual map labels and department names in `src/i18n/en.ts` and `src/i18n/ar.ts`.
- Added the Map navigation entry and route in `src/components/Sidebar.tsx` and `src/App.tsx`, plus map styling in `src/styles.css`.
- Added `tests/map.test.ts` covering the real 87-skill layout, deterministic coordinates, five visual status colors/latest-run selection, output extraction, and form generation from `frontend-ui-polisher`, `speckit-specify`, and `speckit-checklist`.

## Copied

Nothing was copied from the read-only reference app. Its `docs/AGENT-OS-PLAN.md` §2 was consulted only for the department mapping requested by this spec.

## Verification

- `npm run typecheck` — passed.
- `npm test` — passed: 21 files, 109 tests.
- `npm run build` — passed; Octa build artifacts verified. Rollup emitted only existing third-party annotation warnings for `zod`.
- `git diff --check` — passed.

## Acceptance criteria

- ✅ Plain SVG radial map with center `Octa brain` and the 13 requested department branches.
- ✅ One node per visible registry skill; the real manifest test verifies 87 skill nodes and 13 department nodes.
- ✅ Deterministic layout and sub-second layout assertion for all 87 skills; no graph library added.
- ✅ Skill node color follows the latest `job_runs` status for that skill: never run, ok, failed, needs approval, or running.
- ✅ Autonomy badge is rendered on every skill node.
- ✅ Hover/focus shows up to the latest three output files for the skill.
- ✅ Clicking a skill opens a form populated from its description and `argument-hint`; submission calls `jobs.start` with the registry runner/skill metadata.
- ✅ Map refreshes from `jobs:events`, including running and completed job states.
- ✅ Required typecheck and test suite are green.

## Open questions / owner actions

None. No new keys, installs, or external setup are required.
