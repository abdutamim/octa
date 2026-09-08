# Task: spec 016 — Octa Code visual identity + a home that is not empty

The owner opened the app and saw an empty burgundy screen. Two fixes, both in this task.

## 1. Retheme to the Octa Code identity (replace the burgundy/plum/cream theme entirely)

Source of truth:  — the owner's Octa Code visual system, which OVERRIDES the app's bundled tokens (it loads last). Use ITS values, not the bundled olive ones. Logo:  (lavender octopus on #241832 rounded square); app icon  (already copied). Tokens (from the brand CSS):

\
Do:
- Rewrite the token layer in `src/styles.css` to these variables (dark is the default theme; light available). Remove every burgundy/plum/cream value. Keep all component class names so pages keep working; adjust component colors to use the tokens (primary = lavender, surfaces deep violet-black (dark) / soft lilac-white (light), 14px radius, Octa Code's shadow scale). Follow `assets/brand/octa-code.css` for any extra rules it defines (fonts, scrollbars, focus).
- Put the mark SVG in the sidebar header with the word "Octa" and in the window title; set `productName` / window title to "Octa"; `electron-builder.yml` icon already points at `installer/icon.ico` (verify).
- Typography per the brand CSS; if it names a font that is not installed, use the closest system stack and note it.
- Run `npx impeccable detect` (or the equivalent) on the changed files; no findings.

## 2. Home page that shows what Octa can do before setup

`src/components/OctaPage.tsx` idle state must not be empty. Add, above the conversation column, a welcome block:
- Greeting in the conversation language ("أهلاً، أنا أوكتا" / "Hi, I'm Octa") with one line of what it does.
- Setup banner when health is not green (read `health` IPC): "Octa needs setup" with a button that opens the first-run wizard (spec 013/015 `FirstRun`) and a short list of what is missing (keys, vault, logins).
- Six workflow cards from the workflows registry (W1–W6) with their bilingual titles, a one-line description, and a "Start" button that focuses the conversation input with a prefilled Arabic prompt (e.g. "راجع الموقع ده: ").
- Recent jobs (last 5) and recent plans if any; otherwise a friendly empty line, not a blank area.
- The voice bar stays where it is.

Also make sure the first-run wizard actually opens on first launch: `firstRunCompleted` must be false on a fresh `C:\Octa\octa.db`, and the wizard must be reachable from Settings and from the setup banner.

## 3. Verify
- `npm run typecheck`, `npm test` green; update the OctaPage render tests for the new idle content; add a test that the token file contains no burgundy hex values (`#5b1a2a`-style maroons: grep for the old values and assert none remain).
- Save screenshots of dark and light home under `.octa/reports/spec-016/` using the same Playwright harness approach as spec 008.
- Commit and write `.octa/reports/spec-016.md`.
