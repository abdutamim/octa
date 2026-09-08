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

## Voice setup (spec 007)

Octa uses the Gemini Live WebSocket only after a wake-word hit or push-to-talk
activation. Before activation, microphone PCM is passed to the local detector in
the main process and is never sent to a cloud endpoint. Add the Gemini AI Studio
key in Settings for Live model discovery, Live audio, and the Gemini TTS/STT
fallback. At startup Octa lists the available models, selects the newest model
whose id contains `live` or `native-audio`, and stores it in SQLite. Entering a
model id in **Manual Live model override** takes precedence over discovery.

### Obtain the offline Arabic wake-word model

The detector is openWakeWord-compatible ONNX, which supports shipping a custom
Arabic phrase model without sending microphone audio to a service. The model
bundle has three files in one directory:

```text
C:\Octa\models\octa.onnx
C:\Octa\models\melspectrogram.onnx
C:\Octa\models\embedding_model.onnx
```

1. Use the openWakeWord custom-model notebook/training utility to create one
   classifier with positive phrase variants for both `أوكتا` and `يا أوكتا`.
   Include clean recordings in the target Egyptian-Arabic pronunciation and
   varied negative speech/noise. Export the classifier as `octa.onnx`.
2. Download the matching openWakeWord `melspectrogram.onnx` and
   `embedding_model.onnx` feature models from the project release assets, or
   export the same models using the project’s conversion notebook. Do not put
   the model files in git; they are machine-specific assets under `C:\Octa`.
3. Set the model path in Settings to the classifier file and choose a sensitivity
   after testing. The loader expects the two shared feature models beside it.

Training references:

- https://github.com/dscripka/openWakeWord#training-new-models
- https://github.com/dscripka/openWakeWord/tree/main/examples
- https://github.com/dscripka/openWakeWord/releases

The Node.js app uses `onnxruntime-node` with CPU execution and the development
and rebuild scripts include it alongside `better-sqlite3` for Electron’s ABI.
If no model or feature files are present, wake-word detection fails closed while
push-to-talk remains available.

### Push-to-talk and read-back approvals

The default global shortcut is `CommandOrControl+Alt+Space`; it can be changed
in Settings, or the copied native mouse trigger can be selected. Wake word and
push-to-talk are independent and may both remain enabled. Planner questions and
job results are spoken. A voice approval (`approve` / `موافق`) is accepted only
for the exact payload most recently read back and only for 60 seconds; the
approval is emitted through `workflows:gate:approve` with `channel: 'voice'`.
