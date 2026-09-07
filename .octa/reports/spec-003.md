# spec-003 report - Planner protocol (Fable + Astra debate)

## Built

- Added `electron/core/octa/planner.ts` with UTF-8 brief compilation (last 40 turns, attachment paths, CompanyBrain injection), schema validation, Fable/Astra orchestration, one validation retry, merged/deduplicated questions, the three-round answer loop, approval state, debate transcript generation, source-number rejection, and `plans` persistence.
- Added `electron/core/octa/schemas/plan.schema.json` and `critique.schema.json` from the runtime contract. Planner steps require a registry skill, with the documented `codex-exec` free-form prompt exception.
- Added Fable, Astra, and Fable-reply prompts under `electron/core/octa/prompts/`. Each prompt enforces language mirroring, the must-ask rule, brain fidelity, JSON-only output, and approval gates.
- Added plan CRUD/migration fields to `electron/db/jobs.ts` (`question_round` and `status`) and wired planner IPC (`planner:plan|answer|approve|get`) plus `planner:questions` and `planner:round` events through the secure preload bridge.
- Added `src/components/PlanCard.tsx` and integrated it into Jobs with a brief launcher, summary, steps table, questions form, debate viewer, and explicit approval control. Added matching English and Egyptian Arabic translations and styles.
- Added five ambiguous fixtures, one complete fixture, a weak-plan debate fixture, invalid JSON retry coverage, four-round cap coverage, schema tests, and an Arabic demo fake-runner case.

## Copied from reference

No files were copied for spec-003. The planner is a TypeScript re-implementation. The read-only references were `C:\Users\Admin\Desktop\Projects\tamim-os` and `C:\Users\Admin\Documents\Codex\2026-08-15\c-users-admin-appdata-local-programs\work\octa-code-backend-final-20260830`; no Python implementation was imported or spawned.

## Commands and results

- `npm run typecheck` - passed.
- `npm test` - passed, 15 test files / 79 tests.
- `npm test -- --run tests/planner.test.ts` - passed, 10 tests.
- `npm run build` - passed: typecheck, tests, Electron bundles, and `Octa build artifacts verified.`
- `git diff --check` - passed.
- Installed CLIs: `claude 2.1.257`; `codex-cli 0.147.0`.

## Real E2E attempt

The requested brief was sent once to the real Fable command from the runtime contract:

`اعمل ماركتنج لمشروع جديد`

The Claude process returned exit code 1 with HTTP 403: Anthropic publisher data sharing is not enabled for `anthropic`. No login, setting change, or retry was attempted. Because Fable did not produce a draft, the paired E2E could not proceed. A corrected direct Astra smoke invocation was also attempted once; Codex returned exit code 1 because this installed CLI reports that `gpt-6-astra` requires a newer Codex version. The first Astra invocation only reported that `C:\Octa` was not trusted; the corrected invocation included `--skip-git-repo-check`.

No real questions were emitted before the Fable failure. The fake-runner fallback for the same Arabic demo brief asked these six blocking questions, which are the questions to verify again when the owner reruns the real E2E:

1. المشروع الجديد عبارة عن إيه بالضبط، وإيه المنتج أو الخدمة اللي بنسوّق لها؟
2. مين الجمهور المستهدف أو العميل المثالي؟
3. إيه الهدف الأساسي من التسويق في المرحلة دي؟
4. هنشتغل في أنهي سوق أو بلد، وبأي لغة؟
5. الميزانية والمدة الزمنية المتاحة قد إيه؟
6. إيه القنوات المسموح نستخدمها، ومين صاحب الموافقة النهائية قبل النشر؟

## Acceptance checklist

- ✅ `compileBrief` persists a UTF-8 `brief.md` with the last 40 turns, attachment paths, and spec-005 `loadBrain` output.
- ✅ Fable and Astra use the documented models, effort levels, JSON modes, workspace, read-only mode, and schemas through the existing JobRunner.
- ✅ Debate rounds stop on `agree` or at four Astra rounds; replies, issue winners/reasons, final plan, and merged questions are persisted in `debate.md` and `plans`.
- ✅ Blocking questions stop at `needs_input`; answers are appended to the brief and rerun; after three question rounds unresolved items become assumptions and `needs_approval`.
- ✅ Invalid structured output is retried exactly once with the validation error appended; skill registry and `rejectUnsourced` validators run before accepting a plan.
- ✅ Planner IPC, live round/questions events, PlanCard, Jobs integration, bilingual strings, and explicit approval are wired.
- ✅ Fake-runner acceptance coverage passes for five ambiguous briefs, a complete brief, Astra changing a weak plan, invalid JSON, the four-round cap, schema validation, and the Arabic six-question demo.
- ❌ Real paired E2E is blocked by the installed Claude publisher permission and Codex model-version errors; it remains a documented manual step.

## Open questions and owner requirements

- Enable Anthropic publisher data sharing/access for `claude-fable-5-1`, or provide an accessible Fable model, then rerun the paired demo. No login was attempted by this task.
- Upgrade Codex to a version supporting `gpt-6-astra`, or update the runtime contract/model configuration in the owning spec, then rerun Astra.
- Configure the CompanyBrain vault, Octa home, and skills registry in the target installation before production planning.
- Spec 006 is not present yet; `planner:approve` records explicit approval and leaves execution handoff to the future workflow runner.
