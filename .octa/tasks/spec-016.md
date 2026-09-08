# Task: spec 016 — Octa Code visual identity + a home that is not empty

The owner opened the app and saw an empty burgundy screen. Two fixes, both in this task.

## 1. Retheme to the Octa Code identity (replace the burgundy/plum/cream theme entirely)

Source of truth: `assets/brand/octa-code.css` — the owner's Octa Code visual system. It is a lavender/violet system, NOT the olive one in the bundled Octa Code CSS (the brand file loads last and overrides it). Logo: `assets/brand/octa-code-mark.svg` (lavender octopus on a #241832 rounded square). App icon: `installer/icon.ico` (already copied from Octa Code).

Tokens (copy from the brand CSS; these are the values):

```
font:  --font-sans: "Outfit", "Segoe UI Variable", "Segoe UI", sans-serif
       bundle Outfit locally (npm @fontsource/outfit or a woff2 under assets/fonts); fall back to Segoe UI Variable
light: --background:#f6f3fb --foreground:#21182d --card:#fff --card-foreground:#21182d
       --primary:#9d78d2 --primary-foreground:#fff --secondary:#eee9f5 --secondary-foreground:#2e223d
       --muted:#f0ebf6 --muted-foreground:#746b7f --accent:#eae1f7 --accent-foreground:#7049a6
       --border:#ddd5e7 --input:#d6cce1 --ring:#9d78d2 --sidebar:#fbf9fe --sidebar-foreground:#21182d
       --popover:#fff --popover-foreground:#21182d --radius:14px
dark:  --background:#0d0913 --foreground:#f5f0fb --card:#181120 --card-foreground:#f5f0fb
       --primary:#c8b2f2 --primary-foreground:#21152f --secondary:#1d1626 --secondary-foreground:#eee6f8
       --muted:#191221 --muted-foreground:#9c91a8 --accent:#2a2037 --accent-foreground:#d7c4fa
       --border:#2d2438 --input:#372b44 --ring:#c8b2f2 --sidebar:#110c18 --sidebar-foreground:#f5f0fb
       --popover:#1b1424 --popover-foreground:#f5f0fb
shadows (--shadow-sm/md/lg/xl/focus), ::selection, :focus-visible, the button press transform,
and the .octa-shell radial-gradient background: copy verbatim from assets/brand/octa-code.css.
status colors: success #4ebe96, warning #d2d714, info #479ffa, destructive #d84f68 (light) / #ff5c5c (dark)
```

Do:
- Rewrite the token layer in `src/styles.css` to these variables (dark is the default theme; light available). Remove every burgundy/plum/cream value. Keep all component class names so pages keep working; restyle components to the tokens (primary = lavender, surfaces deep violet-black in dark / soft lilac-white in light, 14px radius, the brand shadow scale). Apply the `.octa-shell` background to the app shell.
- Put the mark SVG in the sidebar header next to the word "Octa" and use it as the window icon; window title and `productName` = "Octa". Verify `electron-builder.yml` points at `installer/icon.ico`.
- Typography per the brand CSS (Outfit). Arabic text: pair with a good Arabic-capable fallback (Segoe UI / "Noto Naskh Arabic" if present) so RTL screens look right.
- Run `npx impeccable detect` on the changed files; no findings.

## 2. Home page that shows what Octa can do before setup

`src/components/OctaPage.tsx` idle state must not be empty. Add, above the conversation column, a welcome block:
- Greeting in the conversation language ("أهلاً، أنا أوكتا" / "Hi, I'm Octa") with one line of what it does.
- Setup banner when health is not green (read the health IPC): "Octa needs setup" with a button that opens the first-run wizard (`FirstRun` from specs 013/015) and a short list of what is missing (keys, vault, logins).
- Six workflow cards (W1–W6) from the workflows registry with their bilingual titles, a one-line description, and a "Start" button that focuses the conversation input with a prefilled Arabic prompt (for example "راجع الموقع ده: ").
- Recent jobs (last 5) and recent plans if any; otherwise a friendly one-line empty state, never a blank area.
- The voice bar stays where it is.

Also make sure the first-run wizard opens on first launch: `firstRunCompleted` must be false on a fresh `C:\Octa\octa.db`, and the wizard must be reachable from Settings and from the setup banner.

## 3. Verify
- `npm run typecheck` and `npm test` green; update the OctaPage render tests for the new idle content; add a test asserting `src/styles.css` contains none of the old theme hex values (grep the current file for the burgundy/plum/cream hexes before you replace them and assert they are gone).
- Save screenshots of dark and light home under `.octa/reports/spec-016/` with the same Playwright harness approach as spec 008.
- Commit and write `.octa/reports/spec-016.md`.
