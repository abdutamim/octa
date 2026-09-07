# spec-004 — Research engine

## Built

- Added `electron/core/octa/research.ts` with the multilingual prompt assembler, strict `evidence.schema.json` writer, Codex scout wiring, 45-minute default budget, partial-report handling, ledger loading, saturation/budget instructions, and code-enforced gates.
- Added `electron/core/octa/browser.ts` with a persistent Playwright Chromium profile under `<octaHome>\\browser\\research`, browser binaries under `<octaHome>\\browser\\playwright`, headed login confirmation, read-only navigation, per-domain pacing, social page budgets, challenge events, and persisted 24-hour back-off.
- Added `electron/core/octa/mcp-server.ts` (`octa-tools`, stdio) with `search`, `open`, `fetch_markdown`, `scroll_collect`, `youtube_transcript`, `reddit_search`, and optional `brave_search`.
- Added `electron/core/octa/prompts/research-persona.md` and `research-competitor.md` presets.
- Registered the MCP server in the Electron build, generated Claude `--mcp-config` JSON and Codex `mcp_servers.*` `-c` arguments, and exposed research IPC in `electron/main.ts` / `electron/preload.ts`.
- Added the Settings research-browser controls, login/challenge status, and the `SourcesTable` ledger viewer used by Jobs.
- Added gate/parser/MCP/pacing/composer tests and the `research:demo` script.

## Copied and reused code

- Copied from the Tamim OS reference: none. The reference checkout was read-only and was not modified.
- Reused the existing spec-012 `electron/core/octa/sources.ts` parser and citation validator. The research-specific eight-per-domain cap and strict material-language logic live in `research.ts` because the shared validator does not implement that cap.

## Verification

- `npm run typecheck` — PASS.
- `npm test` — PASS: 17 test files, 83 tests.
- `npm run build` — PASS: Electron main, `mcp-server.js`, preload, renderer, and build verifier.
- Playwright headless context smoke test — PASS: persistent profile opened at `C:\Octa\browser\research`.
- `git diff --check` — PASS.
- `npm run research:demo` — completed at the requested 15-minute budget and returned `failed: depth` with a partial report and ledger.

## Real run

Task: `dream buyer persona لعيادة أسنان في القاهرة`

- Job: `5e418e6f-4878-4b56-8a93-590dd030d280`
- Budget: 15 minutes
- Source ledger: `C:\Octa\jobs\5e418e6f-4878-4b56-8a93-590dd030d280\evidence\sources.jsonl`
- Partial report: `C:\Octa\jobs\5e418e6f-4878-4b56-8a93-590dd030d280\evidence\report.md`
- Sources recorded: **100** ledger entries; **99** raw distinct HTTP URLs; **98** counted distinct URLs after the maximum-eight-per-domain rule; **72** domains.
- Current revalidation: `failed: depth` only because the capped URL count is 98; the final metadata-aware script-ratio check accepts the Arabic report.

Language plan returned by the scout:

| Language | Status | Queries | Material sources |
|---|---|---:|---:|
| ar | material | 15 | 25 |
| en | material | 15 | 25 |
| fr | material | 15 | 15 |
| de | material | 15 | 15 |
| ru | material | 15 | 19 |

The run therefore demonstrates the intended shallow-budget behavior: the partial report is kept and the code gate refuses to mark it complete until the capped URL target is met.

## Acceptance checklist

- ✅ Prompt includes the task, full protocol, fixed five-language rule plus extras, ledger schema, budget, saturation instructions, and `--output-schema evidence.schema.json`.
- ✅ Code gates distinct URLs, domain count and eight-page cap, material-language minimums/no-material 15-query records, report citations, and report script ratio.
- ✅ `octa-tools` stdio MCP server and optional Brave fallback are wired for both CLI configuration forms.
- ✅ Persistent research browser, owner-confirmed login flow, read-only tools, pacing, social limits, challenge event, and durable back-off are implemented.
- ✅ Persona and competitor presets are present.
- ✅ Research IPC, Settings browser section, challenge/login controls, and Jobs ledger viewer are present with bilingual renderer strings.
- ✅ Required fixtures and tests cover pass, depth failure, language failure, no-material behavior, bad citations, ledger parsing, MCP schemas, pacing, and composer blocking.
- ✅ The requested real 15-minute demo ended `failed: depth` with a preserved partial report and 100-source ledger.

## Open questions / owner setup

- Facebook, X, and Reddit sessions still require the owner to use the headed Settings login flow; no credentials were added to the repository.
- Brave Search is optional. Add its key through Settings if browser fallback is needed.
- `npx playwright install chromium` completed with an extended timeout and installed the matching Chromium 1243 runtime under `C:\Octa\browser\playwright`. A clean machine should run the same install during setup.
- `npm install` reported 9 dependency advisories (2 moderate, 7 high); review them separately before release.
- The demo environment logged pre-existing Codex cache/agent-role warnings; they did not prevent the final run from producing the partial ledger/report.
