# 07 — Decisions

Answered 2026-09-05 by the owner (Tamim). These are final; the other files in
this folder were updated to match. Open items at the bottom.

| # | Decision | Answer |
|---|---|---|
| D1 | Voice | Gemini Live with the newest native-audio model available at build time, chosen for Egyptian Arabic quality (hear well, speak well). **Wake word** "أوكتا" / "يا أوكتا" always listening; on wake it answers "إيه يا عميل، عايز إيه؟" style. **Push-to-talk** also available, key configurable in Settings. |
| D2 | Claude access | Claude Code subscription (`claude -p`). No API key. |
| D3 | Search | Anything free. Layer 1: Codex built-in search. Layer 2: the **research browser** (a persistent Playwright/Chrome profile) doing Google/Bing/DuckDuckGo searches and reading pages. Layer 3: Brave Search API free tier as a fallback. |
| D4 | Research budget | Default 45 min / job; the scout keeps going past 100 sources until saturation. |
| D5 | Facebook / X | **Login automation accepted.** Octa opens a dedicated browser profile once and asks the owner to log in to Facebook, X (and Reddit if wanted), exactly like the Codex/Claude login step. Sessions persist; automation is read-only, rate-limited, never posts or messages. Risk of account flags acknowledged by the owner. |
| D6 | Paths | `C:\Octa` for jobs/tools; `<vault>\knowledge` for the brain. |
| D7 | Approval channels | In-app, ntfy on phone, and voice after read-back. |
| D8 | Photoshop | Portable install at `C:\Users\Admin\Desktop\Apps\Adobe Photoshop 2024 v25.6.0.433 Portable x64\PhotoshopPortable.exe` (setting `photoshopPath`). |
| D9 | Users and demos | **Two users.** The owner (Tamim): builds websites, markets himself. **Bedo Mousa** (partner): marketing, real-estate marketing, also needs a website. Each runs his own Octa with his own brain; skills and code are shared through the GitHub repo. |
| D10 | Data sharing | Client data may go to Anthropic and OpenAI through the CLIs. Never card numbers, passwords, IDs. |
| D11 | Site stack | Astro + Cloudflare Pages by default; Shopify via PRISM when it is a store. |
| D12 | Models | **Planning = a debate**: Claude **Fable 5.1** (effort `medium`) writes the plan, GPT-6 **Astra** (effort `xhigh`, not ultra) critiques it, Fable answers, repeat until both agree (cap 4 rounds, then Fable's last version with the disagreements listed). **Execution and code = GPT-5.6 Luna** (fast mode, max reasoning) — cheap and good. **Review = GPT-5.6 Sol** on every execution output. Skills that need Claude Code's tool set still run in `claude -p` but with Luna doing the heavy lifting where the runner allows a Codex executor. |
| D13 | Autonomy | Everything human-assisted at launch; the goal is to move toward autonomous quickly once runs are clean. |
| D14 | Report language | Octa's choice: conversation language for the owner; client deliverables in the client's language with an Arabic summary. |
| D15 | Octa Code | **Revised (second message): build from scratch.** Octa is a **new application**, built fresh, that contains both what Tamim OS does and what Octa Code does. Nothing in the old Octa Code is edited; proven Tamim OS modules are copied in where they fit; the Octa Code pipeline (spec → plan → build in a worktree → QA → merge) is re-implemented natively in TypeScript inside Octa using `claude -p` / `codex exec`, so there is no Python backend to ship. The new repo is published **in place of Octa Code** (same GitHub location, renamed Octa), open source, with `.env.example` + `SETUP.md` so Bedo Mousa runs it. Real secrets never committed. |
| D16 | Codex models | Luna writes code (in the native build pipeline). Astra is for the planning debate only. |
| D17 | Research languages | **Always five: Arabic, English, French, German, Russian**, plus any other language the topic lives in. |

## Open items (small, non-blocking)

- Exact Gemini Live model id at build time (check the model list in spec 007; prefer the newest `*-live*` / native-audio model that lists Arabic).
- Whether Reddit login is wanted in the research browser (default: no login, public JSON is enough).
- Repo name on GitHub: `octa` under the owner's account (assumed).
