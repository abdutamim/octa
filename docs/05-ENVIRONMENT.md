# 05 — Environment matrix

Checked on this machine 2026-09-05. Spec 013 turns this into a health check.

## 1. Runtimes and CLIs

| Item | Status | Needed by | Note |
|---|---|---|---|
| Node 22.21 / npm 10.9 | present | Electron, carousel-forge renderer, docx/pptx/xlsx scripts (node parts) | — |
| Claude Code 2.1.257 (`claude`) | present, logged in | planner, every claude-skill run | `-p`, `--output-format stream-json`, `--add-dir`, `--append-system-prompt-file`, `--allowedTools`, `--mcp-config` verified |
| Codex CLI 0.147.0 (`codex`) | present, logged in | scout, Octa Code Codex adapter | config: model `gpt-6-astra`, effort `xhigh`, sandbox `danger-full-access`; scout uses `gpt-5.6-luna` per step config; web search feature flag to verify in spec 004 |
| uv 0.12 | present | Octa Code, Python skills | — |
| Python 3.12.13 (uv-managed) | present at `AppData\Roaming\uv\python\...` | docx/pptx/xlsx/pdf/photoshop skill scripts only (the build pipeline is native TypeScript now) | **inside virtualized AppData**: install a copy outside (`uv python install --install-dir C:\Octa\python 3.12`) and set `UV_PYTHON_INSTALL_DIR` + `UV_CACHE_DIR` there |
| System Python | 3.9.2 only | — | do not use |
| Playwright 1.56 + Chromium builds | present (`AppData\Local\ms-playwright`) | carousel-forge / carousel-studio render, W1 crawl screenshots, web-perf | move browsers path outside AppData too (`PLAYWRIGHT_BROWSERS_PATH`) |
| ffmpeg | `ffmpeg-static` in deps, not on PATH | media transcode, video skill | pass the static binary path to jobs via env |
| git 2.51, gh 2.92 | present | Octa Code worktrees, PRs | — |
| Photoshop 2024 portable | present: `C:\Users\Admin\Desktop\Apps\Adobe Photoshop 2024 v25.6.0.433 Portable x64\PhotoshopPortable.exe` | photoshop-driver, photoshop-posts | path stored in setting `photoshopPath`; `psdwriter.py` fallback when absent (Bedo Mousa's machine) |
| Research browser profile | to create at `C:\Octa\browser\research` | research engine layer 2 | owner logs in to Facebook / X once (D5); read-only tools only |
| Chrome DevTools MCP | not configured | web-perf | add to `--mcp-config` for W1/W2 QA steps |
| Remotion | not installed here (growth-os expects it) | growth-os reels | install in a tools folder when W3 video steps go live |

## 2. Keys and accounts (stored in `app_settings`, never in files)

| Key | Status | Needed by |
|---|---|---|
| Gemini (AI Studio) `geminiApiKey` | present | conversation, STT, TTS, vision, Live API (D1) |
| Vertex `vertexProjectId` + SA key | present, location `global` | same, fallback transport |
| Claude | Claude Code login (subscription) | planner/executor; no API key needed unless D2 says API |
| OpenAI | Codex login (ChatGPT sub) | scout; no API key |
| Groq | `groqApiKey` present | STT fallback |
| Brave Search API (free tier) | **missing**, sign up during spec 004 | research engine layer 3 (D3) |
| Facebook / X logins | done by the owner in the research browser, not stored by Octa | research engine layer 2 (D5) |
| ntfy topic | present (`notify.ts`) | approvals on phone |
| Notion token | present | mirror |
| Meta (publisher PHP) | existing pipeline | social queue |
| Firecrawl / DataForSEO | missing | competitor-profiling, seo-audit optional data; skills fall back to fetch + search |

## 3. Per-skill requirements (core + keep set)

| Skill | Runtime | External |
|---|---|---|
| docx, pptx, xlsx, pdf | Python 3.12 + node (docx-js, pptxgenjs), LibreOffice optional for rendering checks | — |
| carousel-forge, carousel-studio, tamim-carousel | node + Playwright | Gemini image gen (key present) |
| photoshop-driver, photoshop-posts | Python 3.12 (psd-tools) + Photoshop ExtendScript | Photoshop (D8) |
| growth-os | node, Remotion, Playwright | Gemini images + TTS, Meta publisher |
| frontend-ui-polisher, web-ui-designer, ui-forge | node | — |
| web-perf | Chrome DevTools MCP | — |
| competitor-profiling, prospecting, customer-research, ai-seo, seo-audit | search + fetch (octa-tools MCP) | Firecrawl/DataForSEO optional |
| video, image | reference only unless keys for Veo/Sora/Flux are added | optional |
| skill-creator | node + Python for evals viewer | — |
| speckit-*, mcp-server-builder | node/Python | — |
| everything else (marketing, sales, thinking) | text only | — |

## 4. Paths (decision D6 defaults)

```
C:\Octa\                 Octa home (jobs, knowledge mirror, python, browsers, tools)
<vaultPath>\knowledge\   company brain source of truth (vaultPath from settings)
tamim-os\skills-library  skills (read-only for jobs)
```

Nothing that a job writes goes under `AppData` (MSIX virtualization would
hide it from the real app and from Bedo).
