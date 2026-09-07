---
name: photoshop-posts
description: >
  Produce Instagram stories, posts and social graphics as client-editable
  Photoshop files — designed in HTML/CSS (real Arabic shaping, instant
  iteration), exported as layered PSDs with live editable text, cloned into
  variants without destroying hand-tuned masters, and verified by measurement
  instead of eyeballing. This is the production pipeline; the low-level
  Photoshop mechanics live in the photoshop-driver skill.
  Use for: "make the stories/posts as PSD", "the client edits them in
  Photoshop", "build this campaign's variants", "same design, different text",
  "check the text is readable", "اعمل البوستات في فوتوشوب", "استوريات للعميل
  يعدل عليها", "نفس التصميم بكلام مختلف", "كمل باقي المقاسات".
---

# Photoshop Posts

The finished deliverable is a **layered PSD with live Arabic text** the client can
retype — but Photoshop is a terrible place to *design*. So the pipeline splits:

```text
design in HTML/CSS  →  measure & verify  →  export layered PSD  →  live text via JSX
        ↓ (client hand-tunes the master in Photoshop)
clone master into variants (retext)  →  verify structure  →  flatten previews
```

Design where iteration is cheap and Arabic shaping is correct (Chrome/HarfBuzz).
Deliver where the client lives (Photoshop). Never make the client's file a dead end:
once a human touches a PSD, that file becomes the source of truth and every further
variant is **cloned from it**, not regenerated.

**Where you're running matters.** On the user's machine (Claude Code) you run the
whole pipeline yourself. In a sandbox without Photoshop/Chrome (claude.ai): design
the HTML and hand it over as files, `pip install psd-tools` to inspect/verify any
PSD the user uploads, and generate the `.jsx` + jobs specs for the user to run
locally — the measurement and verification loops still work; only rendering and
launching move to the user's side.

`template/` contains the complete working system from a shipped Saudi client job
(1080×1920 Arabic stories, 3 variants, Tabby badge, adaptive contrast). Copy it and
restyle — don't rebuild from nothing.

> **Photoshop mechanics** (jsx, size trap, psd-tools quirks, launching) → **photoshop-driver skill** — load it alongside this one
> **Design measurement rules** → [references/design-rules.md](references/design-rules.md)
> **Layer doctrine** → [references/layering.md](references/layering.md)

---

## Phase 1 — Design in HTML

One `story.html` renders every variant, driven by two JSON files:

- **`layout.json`** — every visual decision as a named knob (positions, sizes, blur,
  gaps, margins). ~45 knobs across 8 groups in the template.
- **`prompts.json`** — per-variant copy: hook (with `*word*` gold-accent markers),
  service, price, kicker, contact block.

`serve.py` serves the folder and accepts PUT **only** for those two JSON files
(403 anything else, validates JSON before writing). `editor.html` is a slider
panel + live iframe so the user tunes knobs visually; every change PUTs
`layout.json` back. Run it when the user wants control — they always do.

Non-negotiables learned the hard way:

- **Chrome renders the Arabic, nothing else.** PIL + arabic_reshaper produces tofu
  with modern Arabic fonts (they lack presentation forms). See photoshop-driver's
  arabic reference.
- **MSA for Gulf clients.** Egyptian dialect in Saudi copy reads as foreign.
- Chrome caches viciously: fresh `--user-data-dir` per run **and** a `cb=` random
  query param, or you will debug a stale file for an hour.

## Phase 2 — Measure, don't squint

`story.html` exposes probe modes that make the page self-reporting:

| URL param | What it does |
|---|---|
| `?notext=1` | hides text via `visibility:hidden` — layout stays valid for background measurement (`display:none` zeroes rects and breaks auto-panels) |
| `?rects=1` | dumps every element's real rect + full text style into `document.title` as `RECTS{json}` — read it with `--dump-dom` |
| `?layer=key` | isolates one layer group on transparency for PSD export |

`check.py` reads real rects and composites alpha mathematically to score every text
element against the **worst (brightest) pixel** behind it. Ship when all checks pass
(≥3:1 large text, ≥4.5:1 small) and content clears Instagram's safe zones. The
numeric rules are in [references/design-rules.md](references/design-rules.md).

## Phase 3 — Export layered PSD

`psd.py` renders each `?layer=` group to a transparent PNG and assembles with
`psdwriter.py` (hand-written writer — pytoshop makes corrupt files). The layer list
follows one doctrine: **one layer per independently-hideable thing, graphics split
from text** — full table and reasoning in
[references/layering.md](references/layering.md). Arabic layer names; they're the
scripting handles later, so keep them stable.

Raster text is deliberate here: the PSD looks perfect on any machine, fonts or not.

## Phase 4 — Live text

`livetext.py` probes `?rects=1` and generates a per-variant `.jsx` that adds live
paragraph-text layers on top and hides only the raster *text* layers (graphics
stay). Real PostScript names read from the font files — never guessed; a wrong
name fails silently into tofu. Colors come from design tokens, **not** from
`getComputedStyle` (returns `oklch()`, which naive regex parsing turns green).
Auto-copy the jsx into Photoshop's `Presets\Scripts` so it appears in File →
Scripts.

Font licensing: check `fsType` before promising anything. `fsType=4` fonts can't
ship to the client and can't make editable PDFs — but PSD only references names, so
live text still works if the client owns the font. Details in photoshop-driver's
fonts reference. **Never send the font file.**

## Phase 5 — The master comes back edited. Clone it.

The client (or the user) opens the PSD, moves things, groups things, scales text
with transform handles. That state exists nowhere in your generator. From now on:

```bash
py <photoshop-driver>/scripts/retext.py jobs.json --run --verify
```

`stories.jobs.json` in template/ is a real spec: master + per-variant image swaps
and text replacements (`*word*` = accent color, read from the master itself).
Everything unnamed travels untouched. `--verify` diffs structure, fonts,
on-canvas sizes and colors against the master — "the script ran" proves nothing;
the compare does.

⚠️ A jobs file that outputs into `export/` **overwrites hand-edited variants** on
re-run. If the user has since edited 02/03 directly, the jobs file is stale —
point `outDir` elsewhere or delete it.

## Phase 6 — Look at it

Flatten previews (`flatten: true` in the jobs spec, or `psinspect.py --preview`)
and actually read the image: overflow, bad wraps, collisions with graphics — none
of that shows in a structural diff. Then send the previews to the user for
approval **per post** before anything publishes.

---

## Starting a new brand

1. Copy `template/` into the project.
2. Restyle `story.html`: swap the logo asset, the design tokens (`--ink`, `--gold`,
   `--text-*`), the fonts, the badge. Keep the probe modes and the `DEF` layer map
   intact — psd.py, livetext.py and check.py depend on that contract.
3. Rewrite `prompts.json` with the brand's copy; adjust `layout.json` knobs via
   the editor.
4. Adapt the marked-adaptable blocks: `LAYERS` in psd.py, `PS_FONT` / `HIDE_FOR`
   in livetext.py.
5. Different brand ⇒ different silhouette, not a palette swap of the last client's
   layout.

Environment notes for this machine: Python is `py` (no `python`), Chrome at
`C:\Program Files\Google\Chrome\Application\chrome.exe`, Photoshop is portable
(find it with `psrun.py --which`), serve.py convention port 8912.
