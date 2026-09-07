# Task: spec 011 — Launch workflows W1–W5 wired

Read `docs/04-WORKFLOWS.md` in full, `docs/00-OCTA-ASSISTANT.md` §7, and `docs/06-SPECS.md` section 011. Copy from the reference app with tests: `electron/core/pdf.ts`, `document-theme.ts`, `documents.ts`, `electron/db/documents.ts` (brand templates and PDF export), `electron/db/tasks.ts` + `electron/core/task-trigger.ts` (tasks, triggers), `electron/core/time-tracking.ts`, the invoice model (`clients`, `invoices`, `invoice_items`, `invoice_sequences` from `electron/db/sessions.ts` or wherever they live), and `ClientsPage.tsx`, `TasksPage.tsx`, `DocumentEditor.tsx`.

Then:
1. Remove every `"todo": true` from the W1–W5 seeds (spec 006) and implement the missing step handlers: W1 step 2 crawl + screenshots via spec 004's browser; W1 step 9 / W3 step 5 PDF export through the copied `pdf.ts` brand template; W2 step 8 via spec 010; W2 step 10 `prism-store-builder` as `claude-skill`; W3 step 7 carousel render (`carousel-studio` → `carousel-forge` as `claude-skill`; Playwright present); W3 step 10 social queue table (`social_queue`, dry-run handoff file for the existing PHP publisher as in the reference app); W5 invoice steps end to end (draft from time tracking → PDF → approve gate → "sent" record with the prepared message → +7/+14/+21 follow-up recurring jobs).
2. Acceptance checks as code per workflow (the "Acceptance" lines in the doc) run after the last step and stored on the job.
3. Recurring jobs from the doc enabled as `assisted`.
4. Tests: seeds have no `todo`, acceptance checkers with fixtures, invoice flow with a fake runner and real PDF generation, social queue dry-run file format.
5. Real demos, by text (voice is spec 007): W1 on `https://tamim.work` (or the owner's live site URL from settings), W4 on a small decision, W5 draft for a fixture client. Record timings and paste the top of each report.
