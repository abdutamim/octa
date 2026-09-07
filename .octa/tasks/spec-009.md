# Task: spec 009 — Map page

Read `docs/06-SPECS.md` section 009 and `docs/AGENT-OS-PLAN.md` §2 in the reference app (`C:\Users\Admin\Desktop\Projects\tamim-os\docs\AGENT-OS-PLAN.md`) for the department list.

Build `src/components/MapPage.tsx`: departments (sales, deals, marketing, design, operations, intelligence, customer, backoffice, engineering, thinking, documents, commerce, personal-os) as branches from a center node "Octa brain"; one node per visible skill from the registry (spec 002); node color from the last `job_runs` status for that skill (never run / ok / failed / needs_approval / running), autonomy badge; hover → last 3 outputs; click → run form generated from the skill's description and `argument-hint`, starting a job through spec 001. Render with plain SVG + a simple radial layout (no heavy graph library; 87 nodes must render <1 s). Live updates from `jobs:events`. Tests: layout determinism, color mapping, form generation from 3 real skills.
