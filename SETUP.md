# Octa Assistant setup (Windows draft)

Octa is a Windows-only Electron desktop app. The first repository milestone is
the Settings shell and its local SQLite foundation; later specs add the job,
research, voice, and workflow layers.

## Prerequisites

- Windows 10 or 11.
- Node.js 22.x and npm 10.x.
- Claude Code installed and signed in. The planner and Claude-backed skills use
  the local `claude` CLI; no Claude API key is stored by Octa.
- Codex CLI installed and signed in. The scout and coding pipeline use the
  local `codex` CLI; no OpenAI API key is stored by Octa.
- `uv` and Python 3.12 installed outside virtualized AppData for the later
  document/media skills. A suggested location is:

  ```powershell
  uv python install --install-dir C:\Octa\python 3.12
  $env:UV_PYTHON_INSTALL_DIR = 'C:\Octa\python'
  $env:UV_CACHE_DIR = 'C:\Octa\uv-cache'
  ```

- Playwright Chromium for later browser and rendering skills:

  ```powershell
  $env:PLAYWRIGHT_BROWSERS_PATH = 'C:\Octa\playwright'
  npx playwright install chromium
  ```

- Photoshop is optional. If installed, enter its full `Photoshop.exe` path in
  Octa Settings when the creative workflow specs are enabled.

Install Claude Code and Codex using their current official Windows installers or
package instructions, then verify both with `claude --help` and `codex --help`.

## Clone and verify

From the repository directory:

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

The app creates `C:\Octa\octa.db` and opens directly on Settings. All API keys
are entered through the UI and persisted in the `app_settings` SQLite table.
The `.env.example` file is setup documentation only and is never loaded at
runtime.

## First settings pass

1. Add the Gemini API key, or select Vertex AI and enter the project ID plus
   service-account JSON path.
2. Optionally add Groq, ntfy, Brave Search, vault, and Photoshop values.
3. Choose the language and theme, save, and use **Test AI connection**.

The default Octa home is `C:\Octa`. The current database remains at that home;
the configurable home value is the location later job runners will use.
