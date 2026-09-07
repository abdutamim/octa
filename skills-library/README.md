# Skills Library

Every skill and agent definition found on this machine, gathered into one place
so Tamim OS can load them as the job library of its agent workforce.

```
skills-library/
  MANIFEST.json     machine-readable index (name, folder, source, department, verdict, autonomy, use, size, hash)
  CATALOG.md        generated catalog grouped by department
  REVIEW.md         generated from scripts/skills-review.mjs: verdict + autonomy + where each skill plugs in
  MERGE-LOG.md      hand-written: what was diffed, what was kept, why
  skills/<name>/    one folder per skill, each with SKILL.md (+ references, scripts, assets)
  agents/claude/    Claude Code subagents (.md with frontmatter)
  agents/codex/     Codex agent personas (.toml)
```

## Rules

- Byte-identical copies found in several places are stored once.
- Two skills with the same name but different content were diffed by hand
  (see `MERGE-LOG.md`). The verified newest version keeps the name; the rest
  are dropped at build time via `ALIAS` / `PREFER` / `KEEP_AS` in
  `scripts/collect-skills.mjs`, and listed under `duplicates` in the manifest.
  The two genuinely different `sales-operator` skills live as `sales-operator`
  and `sales-operator-controlled`.
- All text files are normalized to LF so diffs show real changes only.
- `REVIEW.md` grades every folder (core / keep / reference / client / drop)
  with an autonomy level and where it plugs into Tamim OS.

## Regenerate

```powershell
node scripts/collect-skills.mjs
node scripts/skills-review.mjs
```

The first script rebuilds `skills/` and `agents/` from the source paths listed
at the top of it (README, MERGE-LOG and REVIEW are kept). Add a new source
there when you put skills somewhere new. The second stamps verdicts into the
manifest and regenerates `REVIEW.md`; it fails if a folder is unreviewed.

## Sources scanned (2026-09-05)

| id | path | what it is |
|---|---|---|
| claude-app | `%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\...\skills` | skills uploaded to the Claude desktop app |
| claude-code | `~\.claude\skills` | Claude Code user skills |
| marketing-os | `Documents\marketing-os\skills` | own Marketing OS plugin, the canonical source for shared names |
| portfolio | `Desktop\Tamim Portfolio\.claude\skills` | own carousel skills |
| outfred | `Desktop\Projects\Outfred\skill` | project copy with speckit, stop-slop (older marketing copies dropped) |
| codex | `~\.codex\skills` | Codex skills (Cloudflare mirrors, pdf) |
| agents | `~\.claude\agents`, `~\.codex\agents` | subagents and personas |

Two folders are large because they ship image corpora: `ui-forge` (15 MB) and
`carousel-forge` (17 MB). Everything else is text.
