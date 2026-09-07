# spec-002 report - Skill registry

## Built

- Added `electron/core/skills/registry.ts` with settings/repository-default library resolution, manifest validation/loading, in-memory runner column, department/query/reference filtering, skill lookup, safe folder resolution, and a debounced manifest watcher.
- Added `electron/core/skills/frontmatter.ts`, a dependency-free SKILL.md YAML subset parser for `name`, `description`, `allowed-tools`, `argument-hint`, and the optional `runner: claude` marker.
- Added `electron/core/skills/policy.ts` with the documented Claude skill folder set and default Codex mapping.
- Added `electron/core/skills/tools.ts` and the `electron/core/assistant-tools.ts` bridge for `list_skills` and `run_skill`. `run_skill` validates the folder, selects the registry runner, and delegates to spec 001's `runSkill` job interface.
- Updated `electron/core/jobs/runner.ts` to consume the shared frontmatter parser, honor frontmatter `allowed-tools` for Claude jobs, map the documented Claude folders/frontmatter marker, and persist skill department/autonomy metadata from `runSkill` requests.
- Added `skills:list|get` IPC handlers and preload methods in `electron/main.ts` and `electron/preload.ts`. The registry is created at startup and reloaded when the configured library path changes.
- Added the bilingual `SkillsPage` with search, department filter, reference toggle, verdict/autonomy badges, JSON run dialog, job launch, and sidebar navigation. Added matching English/Arabic translations and styles.
- Added `tests/skills/registry.test.ts`: manifest counts/filtering, reference/drop visibility, runner mapping, frontmatter parsing across five real SKILL.md files, missing-folder errors, watcher reload, and assistant tool dispatch.

## Copied from reference

No files were copied for spec 002. The implementation uses the spec 001 runner already present in this checkout and the existing `electron/cloud/chat.ts` `ToolDefinition` contract. The read-only reference app at `C:\Users\Admin\Desktop\Projects\tamim-os` was inspected for the assistant-tool shape only.

## Commands and results

- `npm run typecheck` - passed.
- `npm test` - passed, 15 files / 77 tests.
- `npm run build` - passed: typecheck, 77 tests, electron-vite main/preload/renderer bundles, and build artifact verification.
- `git diff --check` - passed before report creation.

## Acceptance checklist

- ✅ Registry loads the manifest and returns 87 visible skills: 31 core, 55 keep, and 1 client.
- ✅ The 15 reference skills are hidden by default and available with `includeReference: true`; drop/merge entries are never listed.
- ✅ `runnerFor` maps the documented Claude folder set to `claude-skill`, honors `runner: claude`, and defaults to `codex-exec`.
- ✅ Missing skill folders produce a clear error naming the skill, expected `SKILL.md`, and resolved directory.
- ✅ `list_skills` and `run_skill` use the `ToolDefinition` contract; `run_skill` delegates to spec 001's `runSkill` and returns the job id/folder.
- ✅ `skills:list|get` IPC and the Skills page are wired with bilingual UI, filters, badges, and JSON job launch.
- ✅ Typecheck, tests, production build, and artifact verification are green.

## Open questions / owner requirements

- The normal Octa runtime still requires Claude Code and Codex installed and signed in for real skill jobs; no credentials were added to source.
- The skills library path may remain empty to use the repository default or be set in Settings to another library root containing `MANIFEST.json` and `skills/<folder>/SKILL.md`.
