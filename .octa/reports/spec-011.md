# Spec 011 — Launch workflows W1–W5 wired

Date: 2026-09-08  
Branch: `spec-011`

## What was built

- Wired the seeded W1–W5 workflows to executable launch handlers and removed every `"todo": true` seed marker.
- Added post-run, workflow-specific acceptance checkers. Results are persisted on the workflow run and in the job result after the final step.
- Added the spec-004 browser crawl path: same-origin bounded crawl (maximum 200 pages), page evidence, screenshots, technology detection, and analytics detection.
- Added branded Markdown/PDF report generation for W1 and W3 through the copied `pdf.ts` renderer and document brand template.
- Wired the spec-010 isolated build/preview path for W2, plus `prism-store-builder` as a `claude-skill` step when a store is requested.
- Wired the W3 `carousel-studio` → `carousel-forge` chain with Playwright requested and three initial slides, and added the `social_queue` SQLite table plus the versioned dry-run handoff payload.
- Wired W5 time tracking/task reconciliation, invoice draft/PDF generation, approval-gated send recording, prepared message/attachment payloads, and +7/+14/+21 follow-up tasks and assisted one-shot jobs.
- Added copied task, time-tracking, document, brand, client, invoice, and document-editor UI/API surfaces, including bilingual navigation keys.
- Enabled all recurring workflow seeds in `assisted` mode. Placeholder recurring seeds remain non-destructive until their workflow inputs are supplied.
- No Python code was imported or spawned.

## Files copied or adapted from the reference app

Reference root: `C:\Users\Admin\Desktop\Projects\tamim-os`

Copied/adapted implementation files:

- `electron/core/pdf.ts`
- `electron/core/document-theme.ts`
- `electron/core/documents.ts`
- `electron/db/documents.ts`
- `electron/db/tasks.ts`
- `electron/db/operations.ts` (client/invoice/item/sequence model)
- `electron/core/task-trigger.ts`
- `electron/core/time-tracking.ts`
- `src/components/ClientsPage.tsx`
- `src/components/TasksPage.tsx`
- `src/components/DocumentEditor.tsx`
- `src/components/BrandEditor.tsx` (required UI dependency)

Copied/adapted tests:

- `tests/documents.test.ts`
- `tests/operations.test.ts`
- `tests/tasks.test.ts`
- `tests/task-trigger.test.ts`
- `tests/time-tracking.test.ts`

Copied document assets:

- `assets/documents/Abdullah-Tamim-Signature.png`
- `assets/documents/PingAR-LT-ExtraLight.otf`
- `assets/documents/PingAR-LT-Thin.otf`

The source files above came from the corresponding paths under `C:\Users\Admin\Desktop\Projects\tamim-os`; UI IPC calls were adapted to Octa's `window.octa` API. The launch orchestration, acceptance checks, crawl extensions, social queue, and Octa IPC integration are new Octa code.

## Acceptance checklist

- ✅ W1–W5 seeds contain no `todo` markers.
- ✅ W1 step 2 performs bounded browser crawling with screenshots and technical/analytics evidence.
- ✅ W1 step 9 and W3 step 5 create branded PDF reports through `pdf.ts`.
- ✅ W2 step 8 uses the isolated spec-010 build manager and emits a preview artifact.
- ✅ W2 step 10 calls `prism-store-builder` through the `claude-skill` runner when applicable.
- ✅ W3 step 7 calls `carousel-studio`, then `carousel-forge`, with Playwright and three initial slides.
- ✅ W3 step 10 persists approved posts to `social_queue` and exports the existing PHP-publisher-compatible dry-run JSON shape.
- ✅ W5 creates and reconciles an invoice from tracked time, renders its PDF, blocks sending until approval, records the sent payload, and schedules +7/+14/+21 follow-ups.
- ✅ Acceptance checks run after the last step and are persisted on the job/run result.
- ✅ All recurring jobs described by the workflow document are seeded enabled and `assisted`.
- ✅ Acceptance fixtures, invoice flow with a fake runner and real PDF renderer path, and social queue format tests are included.

## Commands and results

- `npm run typecheck` — passed.
- `npm test` — passed: 36 test files, 204 tests.
- `npm run build` — passed: typecheck, Vitest, electron-vite main/preload/renderer bundles, and artifact verification.
- `npx playwright --version` — `Version 1.63.0`; installed browser binaries were present.
- `git diff --check` — passed.

## Text demo log

### W1 — live site crawl

Target: `https://tamim.work` (no `owner.liveSiteUrl` setting was present in the local `C:\Octa` database). The real browser path ran for 30,884 ms and reached the external navigation boundary, which timed out with `net::ERR_CONNECTION_TIMED_OUT`. No report was produced because the target could not be loaded.

Top of the run report:

```text
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://tamim.work/
Call log: navigating to "https://tamim.work/", waiting until "domcontentloaded"
```

This is an external network/site-state limitation; the crawl handler and its fixtures are covered by the test suite. Set `owner.liveSiteUrl` in settings before rerunning if the owner has a different live URL.

### W4 — small decision, text input

Elapsed: 54 ms.

Top of the memo report:

```text
# Decision memo: small marketing site
Option 1: Astro for the smallest static surface.
Option 2: Next for the broader application path.
Option 3: keep the current stack until demand is validated.
Recommendation: choose Astro because the assumption is that the first release is content-led.
```

The approval artifact began with `{"go":true,"tasks":[...]}` and the acceptance result passed.

### W5 — fixture client invoice draft

Elapsed: 126 ms.

Top of the draft report:

```text
{
  "invoice": {
    "id": "<fixture-invoice-id>",
    "clientName": "Fixture Client",
    "number": "2026-001",
    "currency": "USD",
    "issuedAt": <timestamp>,
```

The generated PDF report began with the invoice number, brand name `ABDULLAH TAMIM`, and accent `#f25b1b`. The sent-record report began with the fixture recipient, prepared message, and PDF attachment. The follow-up report began with the three `+7`, `+14`, and `+21` entries and their recurring job IDs. Approval and acceptance both passed.

## Open questions / owner inputs

- The live W1 demo needs network access to the site or the owner's configured live URL.
- Production execution of generic `claude`, `codex`, `gemini`, and named Claude skills still requires the owner's configured CLI installs/keys and skill library access; tests use injected fakes where appropriate.
- The reference PHP publisher reads `C:\Users\Admin\Desktop\mail\tamim-os-queue.json`. Octa writes the safe runtime handoff at `C:\Octa\integrations\tamim-os-queue.json` to comply with the Windows runtime-data rule; configure the publisher or expose that path through deployment settings before production handoff.
- If packaged Electron builds are introduced, package the copied `assets/documents` files as application resources and keep the runtime output under the configured `C:\Octa` home.

