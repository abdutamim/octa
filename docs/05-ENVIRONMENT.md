# 05 - Environment matrix

Checked on this machine 2026-09-08. Spec 013 implements the checks below in
electron/core/octa/health.ts. The check page reports { ok, detail, fix } for
every row and keeps optional rows green with an explanatory detail.

## 1. Runtimes and CLIs

| Item | Current machine | Health check | Guided fix |
|---|---|---|---|
| Node.js | 22.21.0 | Runs node --version; requires major version 22 or newer. | Install Node.js 22.x and restart Octa. |
| Claude Code | 2.1.257 | Runs claude --version, then a five-second claude -p --no-session-persistence --output-format text ping with a stdin prompt. | Install Claude Code, sign in, and retry. |
| Codex CLI | 0.153.4 | Runs codex --version, then a five-second codex exec --json --skip-git-repo-check -s read-only ping with a stdin prompt. | Install Codex CLI, sign in, and retry. |
| uv | 0.12.0 | Runs uv --version with the Octa-managed environment. | Install uv and retry. |
| Python | AppData copy only at check time | Runs uv python find 3.12 --no-project, rejects AppData paths, then runs the reported interpreter with --version and requires Python 3.12. | The guided installer runs uv python install --install-dir "<octaHome>\python" 3.12. |
| Playwright / Chromium | Chromium builds present under C:\Octa\browser\playwright | Runs npx playwright install --list with PLAYWRIGHT_BROWSERS_PATH=<octaHome>\browser\playwright; requires a Chromium directory and a listed path under Octa home. | The guided installer runs npx playwright install chromium. |
| ffmpeg | ffmpeg-static dependency | Checks the bundled static binary and runs it with -version; PATH is not used. | Reinstall/build the Octa package so ffmpeg-static is bundled. |
| Photoshop | Optional configured executable | If photoshopPath is empty, the check is green and the PSD fallback remains available. If configured, the path must be a file. | Set a valid Photoshop.exe path or leave it empty. |

The Python guided install sets both UV_PYTHON_INSTALL_DIR=<octaHome>\python
and UV_CACHE_DIR=<octaHome>\cache\uv. The Playwright guided install sets
PLAYWRIGHT_BROWSERS_PATH=<octaHome>\browser\playwright. Runtime data and
these managed assets must stay outside AppData.

## 2. Keys and accounts

Keys are stored in the SQLite settings table and never in source files or
environment files.

| Key or account | Health behavior | Optional |
|---|---|---|
| Gemini AI Studio geminiApiKey | Missing key fails. When present, Octa calls the Gemini connection test once and reports the response or a fix hint. | No |
| Brave Search braveSearchApiKey | Reports whether a key is configured. Fetch/search fallbacks remain available when it is missing. | Yes |
| Claude Code | The CLI ping confirms the installed CLI can answer while authenticated. | No |
| Codex | The CLI ping confirms the installed CLI can answer while authenticated. | No |
| Facebook, X, Reddit | The research browser status reports each saved login. Missing site sessions are shown as optional and can be completed through the existing spec 004 login flow. | Yes |
| ntfy topic/server | Stored and editable in Setup; not part of the external health calls. | Yes |

## 3. Files and paths

| Item | Health behavior | Default or required location |
|---|---|---|
| Octa home | Creates the folder if needed, writes a unique temporary marker, and removes it. | C:\Octa (configurable) |
| Vault | Requires a configured readable directory. | User-selected Obsidian vault |
| Research browser | Reports the profile and per-site login status. | <octaHome>\browser\research |
| Playwright browsers | Requires Chromium under the configured Octa home. | <octaHome>\browser\playwright |
| Wake word | When enabled, requires the configured classifier plus melspectrogram.onnx and embedding_model.onnx beside it. When disabled, push-to-talk remains available. | Default classifier: C:\Octa\models\octa.onnx |

No job or health-check write goes under AppData. The SQLite database is
placed under the startup Octa home (C:\Octa by default, or OCTA_HOME).

## 4. Per-skill requirements

| Skill area | Runtime | External |
|---|---|---|
| docx, pptx, xlsx, pdf | Managed Python 3.12 plus Node scripts | LibreOffice is optional for rendering checks |
| carousel-forge, carousel-studio | Node plus Octa-managed Playwright | Gemini key for image generation |
| Photoshop skills | Managed Python 3.12 and optional Photoshop | PSD writer fallback works without Photoshop |
| growth-os | Node, Remotion, Playwright | Gemini images, TTS, and Meta publisher as configured |
| research and SEO skills | Search and fetch through the Octa tools | Brave, Firecrawl, and DataForSEO are optional fallbacks |
| web-perf | Chrome DevTools MCP | MCP configuration is optional until that workflow is enabled |

## 5. Setup behavior

The first-run wizard collects Gemini, Groq, Brave, and ntfy settings; the
Octa home, vault, Photoshop, and wake-word paths; and the optional research
browser logins. Its final page embeds the health check. Settings can reopen
the wizard or the standalone health page at any time. Failed checks display
the fix hint and the Python/Chromium rows expose the guided installers with
streamed stdout/stderr.
