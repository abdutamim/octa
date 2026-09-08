# Spec 013 - Packaging and environment

## What was built

- Added electron/core/octa/health.ts with injectable command/filesystem/network seams and 13 checks:
  Node.js, Claude Code version plus five-second ping, Codex version plus five-second ping, uv/Python 3.12 outside AppData, Playwright Chromium under Octa home, bundled ffmpeg-static, optional Photoshop, optional Brave key, Gemini key plus one connection call, readable vault, writable Octa home, research-browser login status, and wake-word model files.
- Added bilingual HealthPage and FirstRun wizard UI. First launch is gated by the internal firstRunCompleted setting; Settings can reopen the wizard; the health page is also available in the sidebar.
- Added guided Python and Chromium installs with exact displayed commands, Octa-home environment variables, native no-shell Windows npx launching, and streamed stdout/stderr.
- Added packaging scripts and configuration: electron-builder.yml, NSIS branding, installer/icon.ico placeholder, build artifact verification, executable PE/smoke verification, version propagation into Settings, and host better-sqlite3 restoration after Electron packaging.
- Updated docs/05-ENVIRONMENT.md to describe the checks and exact paths that the health service actually uses.
- Added mocked health coverage and first-run reducer/render coverage.

## Files changed

New:

- electron/core/octa/health.ts
- src/components/HealthPage.tsx
- src/components/FirstRun.tsx
- tests/health.test.ts
- tests/first-run.test.ts
- electron-builder.yml
- installer/installer.nsh
- installer/icon.ico
- scripts/test-executable.mjs

Updated:

- electron/main.ts
- electron/preload.ts
- electron/types.ts
- package.json
- scripts/verify-build.mjs
- src/App.tsx
- src/components/SettingsPage.tsx
- src/components/Sidebar.tsx
- src/i18n/en.ts
- src/i18n/ar.ts
- src/styles.css
- docs/05-ENVIRONMENT.md

The shared Electron/renderer files above were changed only to wire spec 013 health, first-run, Settings, and packaging behavior. No secrets were added.

## Copied reference files

Copied read-only from C:\Users\Admin\Desktop\Projects\tamim-os:

| Destination | Source |
|---|---|
| electron-builder.yml | C:\Users\Admin\Desktop\Projects\tamim-os\electron-builder.yml |
| installer/installer.nsh | C:\Users\Admin\Desktop\Projects\tamim-os\installer\installer.nsh |
| scripts/verify-build.mjs | C:\Users\Admin\Desktop\Projects\tamim-os\scripts\verify-build.mjs |
| scripts/test-executable.mjs | C:\Users\Admin\Desktop\Projects\tamim-os\scripts\test-executable.mjs |
| installer/icon.ico | C:\Users\Admin\Desktop\Projects\tamim-os\installer\icon.ico |

The product name, app ID, artifact name, installer copy, executable name, and verification labels were adapted to Octa. The icon remains an explicitly documented placeholder pending final Octa artwork.

## Verification

| Command | Result |
|---|---|
| npm run typecheck | PASS |
| npm test | PASS - 31 test files, 159 tests |
| node C:\Users\Admin\.agents\skills\impeccable\scripts\detect.mjs --json ... | PASS - no findings |
| npm run dist | PASS - typecheck, 159 tests, electron-vite build, artifact verifier, Electron native rebuild, PE validation, packaged smoke test |
| git diff --check | PASS |

Final package verification:

- Product: Octa Assistant 0.1.0
- Executable: release/win-unpacked/Octa Assistant.exe
- PE header: MZ
- Packaged files: 197
- Packaged bytes: 735663436
- Smoke result: ok=true, failures=[]
- SHA-256: 97e84cdfce600ee1b6dcab7d173321b49309bc386ad16361d71eccab98b179ee

The build emitted non-fatal upstream Rollup annotation warnings and electron-builder dependency-discovery diagnostics; the produced package and smoke verification passed.

## Real health check

Command used against C:\Octa\octa.db:

node --import tsx -e "import SettingsRepository, ResearchBrowser, and runHealthChecks; run the report with the live C:\Octa settings and browser status"

Timestamp: 2026-09-08T12:13:57.576Z
Overall: FAIL (the service is reporting real machine prerequisites, not masking them)

| Check | Status | Detail | Fix |
|---|---|---|---|
| Node.js | PASS | Node.js v22.21.0. | - |
| Claude Code | FAIL | Version passed; the five-second ping returned a 403 authentication/provider data-sharing permission error for Anthropic. | Install Claude Code, sign in, then retry the check. / ثبّت Claude Code وسجّل الدخول ثم أعد الفحص. |
| Codex CLI | FAIL | Ping timed out after 5 seconds. | Install Codex CLI, sign in, then retry the check. / ثبّت Codex وسجّل الدخول ثم أعد الفحص. |
| uv + Python 3.12 | FAIL | uv found Python 3.12 at C:\Users\Admin\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe, outside C:\Octa\python. | Run the guided Python 3.12 install below. / شغّل تثبيت Python 3.12 الموجّه بالأسفل. |
| Playwright browsers | PASS | Playwright browsers are installed under C:\Octa\browser\playwright. | - |
| Bundled ffmpeg | PASS | Bundled ffmpeg is ready at the workspace ffmpeg-static binary. | - |
| Photoshop | OPTIONAL | Photoshop is not configured; the PSD fallback remains available. | Set a valid Photoshop.exe path, or leave it empty to use the PSD fallback. / اكتب مسار Photoshop.exe صحيحًا أو اتركه فارغًا لاستخدام البديل. |
| Brave Search key | OPTIONAL | Brave Search key is not configured; fetch/search fallbacks remain available. | Optional: add a Brave Search key in Setup. / اختياري: أضف مفتاح Brave Search في الإعداد. |
| Gemini connection | FAIL | Gemini API key is not configured. | Add a Gemini API key in Setup and retry the connection. / أضف مفتاح Gemini API في الإعداد ثم أعد اختبار الاتصال. |
| Vault path | FAIL | Vault path is not configured. | Choose a readable Obsidian vault folder in Setup. / اختر مجلد Obsidian قابلًا للقراءة في الإعداد. |
| Octa home | PASS | Octa home is writable at C:\Octa. | - |
| Research browser logins | OPTIONAL | Profile is ready; facebook, x, and reddit are not signed in. | Open Setup and sign in to the research sites you need. / افتح الإعداد وسجّل الدخول إلى مواقع البحث التي تحتاجها. |
| Wake-word model | FAIL | The classifier, melspectrogram.onnx, and embedding_model.onnx are missing under C:\Octa\models. | Place the three openWakeWord files under the configured models folder. / ضع ملفات openWakeWord الثلاثة داخل مجلد النماذج المحدد. |

The spec acceptance line requiring a green health check is not yet true on this
machine because the external Claude/Codex account state, Gemini key, vault,
managed Python location, and wake-word model assets are owner/environment
inputs. The red rows all expose a fix hint in the app; Playwright and ffmpeg
are already green.

## Acceptance checklist

- [x] All required health checks return ok/detail/fix and use mocked command/filesystem seams in tests.
- [x] HealthPage and first-run wizard are bilingual, wired into first launch, Settings, and the existing spec 004 research login flow.
- [x] Guided uv/Python and Playwright installs use Octa-home environment variables and stream output.
- [x] Electron-builder/NSIS config, icon placeholder, version display, artifact verifier, and executable verifier are present.
- [x] npm run typecheck and npm test are green.
- [x] npm run dist and packaged executable smoke verification are green.
- [x] docs/05-ENVIRONMENT.md matches the implemented health checks.
- [ ] Real machine health is green; blocked by the owner-provided prerequisites listed above.

## Owner follow-up

- Run the guided Python install from the wizard so the interpreter is under C:\Octa\python.
- Add the Gemini key and select the actual readable Obsidian vault in Setup.
- Resolve Claude provider permission/account configuration and ensure Codex responds within the five-second probe.
- Add the three wake-word ONNX files if wake-word detection is desired.
- Add Brave and research logins only if those optional capabilities are needed.
