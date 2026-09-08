# Spec 007 report — Voice: Gemini Live, wake word, push-to-talk

## Built

- Added `electron/cloud/gemini-live.ts`: Gemini Live WebSocket transport, startup model discovery, manual model override, bidirectional 16 kHz PCM framing, audio output, input/output transcripts, setup/error/interruption/turn events, barge-in, and the bilingual Octa persona/system instruction.
- Added `electron/cloud/gemini-tts.ts` and extended `electron/cloud/gemini.ts` with the `gemini-3.5-flash` native-audio TTS fallback plus the existing Gemini STT path.
- Reworked `electron/core/dictation.ts` into the main-process `VoiceController`: wake/PTT activation, local-first PCM routing, greeting, Live session lifecycle, fallback capture, interruption, transcript persistence, language callbacks, read-back, and voice approval.
- Added `electron/core/wake-word.ts`: offline openWakeWord-compatible ONNX mel → embedding → custom-classifier pipeline, injectable runtime/engine seams, sensitivity/cooldown handling, fail-closed behavior, and the wake/session state machine.
- Added `electron/core/voice/language.ts`, `conversation.ts`, `readback.ts`, and `workflow-gate.ts` for script-ratio language mirroring, SQLite conversation language/turn storage, exact-payload 60-second read-back approvals, and `channel: 'voice'` gate approval.
- Wired the main process, preload bridge, global keyboard/mouse trigger, microphone PCM capture, PCM/audio playback, settings persistence, planner/job read-backs, and hidden-window overlay behavior.
- Added `src/components/VoiceBar.tsx`, `VoiceInputBridge.tsx`, `VoiceAudioPlayback.tsx`, and the adapted `src/overlay/Overlay.tsx`; mounted the VoiceBar and audio/microphone bridges in the app shell.
- Added bilingual settings and UI strings for Live model selection, wake-word model path/sensitivity, wake greeting, keyboard/mouse PTT, and wake/PTT toggles.
- Added `onnxruntime-node` and Electron rebuild coverage for the local detector. No model or secret is bundled.

## Copied/adapted reference files

Copied from the read-only reference app `C:\Users\Admin\Desktop\Projects\tamim-os`:

- `electron/input/trigger.ts`
- `electron/input/mouse-hook.ts`
- `src/overlay/Overlay.tsx` (used as the voice indicator base)
- `tests/trigger.test.ts`

The reference `electron/core/dictation.ts` and `tests/dictation.test.ts` were used as the source seam, then reimplemented for Octa's Gemini Live, SQLite, and preload contracts because the Tamim SessionRepository/SpeechRouter APIs are not present in this repository. Source path: `C:\Users\Admin\Desktop\Projects\tamim-os`.

The build-pipeline reference was consulted from `C:\Users\Admin\Documents\Codex\2026-08-15\c-users-admin-appdata-local-programs\work\octa-code-backend-final-20260830`; no Python code was imported or spawned.

## Acceptance checklist

- ✅ Gemini Live WebSocket with newest matching native-audio/live model discovery, SQLite selection, manual override, PCM input/output, transcripts, barge-in, and persona/language-mirror instruction.
- ✅ Offline openWakeWord-compatible Arabic custom-model path; wake greeting is configurable; PTT reuses the copied trigger manager; wake word and PTT remain independently switchable.
- ✅ Final user-turn language detection uses Arabic/Latin script ratio plus Gemini language hint, stores the result on the conversation, and planner requests resolve language from that conversation.
- ✅ Exact read-back payload approval expires after 60 seconds, requires an approval phrase, and routes only after read-back through `workflows:gate:approve` with `channel: 'voice'`; otherwise the user is told to request read-back first.
- ✅ Gemini TTS/STT fallback is used when Live is unavailable.
- ✅ VoiceBar and hidden-window overlay show idle/listening/thinking/speaking/error state, transcript/messages, and interruption controls.
- ✅ Automated language, read-back, wake state/ONNX stages, Live framing/fixtures, settings, trigger, dictation, and Gemini TTS tests are included.
- ❌ Manual acoustic latency and false-wake verification could not run: `C:\Octa\models` and all three required ONNX assets were absent on this machine. No acoustic samples or fabricated rates are reported.

## Commands and results

- `npm run typecheck` — ✅ passed.
- `npm test` — ✅ 26 files, 127 tests passed.
- `npm run build` — ✅ typecheck, tests, electron-vite main/preload/renderer build, and build-artifact verification passed.
- `npm run rebuild:electron` — ✅ Electron native-module rebuild completed after adding `onnxruntime-node`.
- `npm rebuild better-sqlite3` — ✅ rebuilt the test-runner ABI after the Electron rebuild.
- `git diff --check` — ✅ passed.

## Manual verification record (2026-09-08)

- Required model assets present: `0/3` (`octa.onnx`, `melspectrogram.onnx`, `embedding_model.onnx`).
- Live sessions tested acoustically: `0`.
- First-audio latency: `N/A` — no configured model/key/session.
- False-wake run duration: `0 hours`; false wakes: `N/A`; false-wake rate: `N/A`.
- Deterministic local ONNX-stage and 80 ms frame tests pass, but they are not a substitute for microphone measurements.

## Owner follow-up

- Train/export one openWakeWord custom classifier containing positive Egyptian-Arabic variants for `أوكتا` and `يا أوكتا`, then place it with the matching feature models at `C:\Octa\models\` as documented in `SETUP.md`.
- Enter an AI Studio key in Octa Settings, grant microphone permission, choose a sensitivity, and run the acoustic latency/false-wake protocol on the target machine.
- Use the documented Electron rebuild command after dependency installation when packaging/running the desktop app.
