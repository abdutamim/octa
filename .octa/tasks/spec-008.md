# Task: spec 008 — Octa panel UI

Read `docs/06-SPECS.md` section 008, `docs/00-OCTA-ASSISTANT.md` §3, and `skills-library/skills/ui-forge/SKILL.md` + `frontend-ui-polisher/SKILL.md` (apply their rules; this is a Claude-runner task, so use the skills directly).

Build `src/components/OctaPage.tsx` as the home of the app: conversation column (text input + VoiceBar from spec 007 if present, else a placeholder slot), plan card (from spec 003's `PlanCard`) with questions form and debate viewer, steps list with live status (from spec 006 events), gates with the exact payload and approve/reject/comment, outputs list (open markdown in an in-app viewer, PDFs/HTML with the OS), sources table (spec 004's `SourcesTable`). Sidebar entries: Octa, Jobs, Workflows, Skills, Brain, Settings. Theme tokens burgundy/plum/cream dark + light (already copied), RTL correct when Arabic, keyboard accessible.

Then run the `frontend-ui-polisher` audit on the page and fix what it flags. Tests: component render tests for every state (idle, questions, running, gate, done, failed) with mocked IPC. Report with screenshots (save PNGs under `.octa/reports/spec-008/`).
