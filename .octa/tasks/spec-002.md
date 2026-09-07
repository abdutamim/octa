# Task: spec 002 — Skill registry

Read `docs/06-SPECS.md` section 002, `docs/01-RUNTIME-CONTRACT.md` §1 (which runner a skill uses), `skills-library/README.md`, `skills-library/REVIEW.md`, and `skills-library/MANIFEST.json` (fields: name, folder, department, verdict, autonomy, use, description).

Build:
1. `electron/core/skills/registry.ts` — load the manifest at startup (path from settings, default `<repo>/skills-library`), watch for changes, expose `listSkills({department?, query?, includeReference?})` (hides `verdict` merge/drop, hides `reference` unless asked), `getSkill(name)`, `resolveSkillDir(name)`, `runnerFor(name)`: `claude-skill` for skills whose folder is in the set {web-perf, frontend-ui-polisher, skill-creator, photoshop-driver, photoshop-posts, carousel-forge, carousel-studio, tamim-carousel, growth-os, turnstile-spin, mcp-server-builder} or whose SKILL.md frontmatter has `runner: claude`; otherwise `codex-exec`. Add a `runner` column to the manifest entries in memory only (do not rewrite the file).
2. Frontmatter parser for SKILL.md (name, description, allowed-tools, argument-hint) shared with the runner.
3. Assistant tools `list_skills` and `run_skill` (ToolDefinition shape from the copied `electron/cloud/chat.ts`), where `run_skill` calls spec 001's `runSkill` (import the interface; if 001 is not merged yet in your branch, code against `electron/core/jobs/runner.ts` exports `runSkill(name, input, opts)` and add a thin adapter).
4. IPC `skills:list|get` and a `src/components/SkillsPage.tsx` (department filter, search, verdict/autonomy badges, "run" button that opens a JSON input box and starts a job).
5. Tests: manifest loading yields 87 visible skills (31 core + 55 keep + 1 client), 15 reference hidden by default, dropped never listed; runner mapping; missing folder error; frontmatter parser against 5 real SKILL.md files.
