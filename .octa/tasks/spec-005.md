# Task: spec 005 — Company brain

Read `docs/03-COMPANY-BRAIN.md` fully and `docs/06-SPECS.md` section 005.

Build:
1. `electron/core/octa/brain.ts` — mirror `<vaultPath>/knowledge/` to `<octaHome>/knowledge/` (initial copy + `fs.watch` with debounce; one-way, jobs never write back), `loadBrain({client?, kinds?})` that returns the injection text per §4 (company + voice + icp always; client file when named; offers/pricing for sales and invoice kinds; personas/competitors for marketing kinds), token-capped at ~6k with a "truncated" marker.
2. Proposals queue: `brain_proposals` table (`id, target_file, diff_or_content, source_job, status pending|approved|rejected, created_at`), `proposeBrainEdit()`, `applyProposal()` which writes into the vault file (creates it if new) only after approval. IPC `brain:proposals|approve|reject|status`.
3. Intake interview: `electron/core/octa/intake.ts` with the 20 questions from §2 (Arabic text exactly as written, English translations in i18n) grouped in blocks A–F, resumable state in settings, a writer that maps answers into `company.md`, `offers/*.md`, `icp.md`, `voice.md`, `sops/*.md`, `pricing.md` using the layout in §1. Per-client intake (§3) writing `clients/<slug>.md`. Expose IPC `intake:next|answer|state`, and a simple `src/components/BrainPage.tsx` (file list, proposals with approve/reject, "start intake" text flow; voice comes in spec 007).
4. Copy the reference app's `electron/core/vault.ts` (safe path containment, search) and its tests as the base for vault access; keep the containment checks.
5. Tests: mirror + watch, injection selection rules, proposal lifecycle, intake writer produces the expected files from a fixture of answers, vault path containment.

Do not touch `electron/core/jobs/*` (spec 001 owns it); expose `loadBrain` so spec 003 can prepend it.
