# 08 — Design & Carousels

## The 7 laws

```
1. One idea per slide
2. Clear visual hierarchy — the eye must know where to start
3. One accent per slide, never two
4. White space is focus, not waste
5. A fixed chassis across every slide
6. Legible at thumbnail size
7. Tension-to-release rhythm ≈ 2:1
```

---

## The chassis (6–8 slides)

```
cover → mirror → objection → mechanism → grid → proof → offer → CTA
```

- **cover** — the hook, nothing else
- **mirror** — describe their situation in their words: "this is you"
- **objection** — say the thing they're thinking right now
- **mechanism** — why the solution works
- **grid** — the steps, or the comparison
- **proof / offer / CTA** — selected by 3C stage

---

## The 8 forms

| Form | Description |
|---|---|
| `frame` | Bordered card, centered text — safest default |
| `bleed` | Full-bleed image with text over it |
| `poster` | One enormous word |
| `doc` | Document-like structured text |
| `spec` | Numbers, specs, data |
| `compare` | Before/after, this vs that |
| `tile` | Grid of items |
| `sculpt` | Type shaped around negative space |

**Pick one form for the whole carousel.** Mixing forms breaks recognition.

---

## Exact numbers

```
Sizes            1080 × 1350 (feed) · 1080 × 1920 (story / reel)
Margins          7–10% of width
Header rail y    5.3–6.5%
Headline optical centre   27–38% of height
Dead zone        last 8–17% (UI overlays cover it — keep it empty)
Display size     15–29% of canvas height
Hero word width  74–79% of column width
Leading          0.78–0.92em for headlines
Tracking         −1% to −3% for Latin · 0% for Arabic
Color split      ground 60–92% · ink 6–12% · accent 1–10%
Contrast         ≥ 4.5:1 for any text
```

---

## Arabic / RTL rules (critical)

```
✓ Lock the right reading edge — identical on every slide
✓ Build hierarchy with WEIGHT, not size (size ratio 1.1:1 → 1.9:1 max)
✓ Justify with kashida, never with word-spacing
✓ One numeral system throughout (Arabic-Indic or Western — pick one)
✗ Never split a word into per-character spans (breaks letter joining)
✗ Never mix scripts inside one word ("الdashboard") — all Arabic or all Latin
✗ Never apply positive tracking to Arabic
```

---

## Production

### Path A — HTML → PNG (preferred)
One HTML/CSS template driven by `vibe.json`, rendered headless to PNG at the
sizes above. Exact numbers, free repetition, version controlled.

### Path B — spec sheet for Canva/Figma
When the user designs manually, hand them a table:
```
slide # · form · literal text · font size · color (hex) ·
element position (% of height) · image needed · note
```

---

## Photo direction

Lighting, framing, background, mood, and grade all come from `vibe.json` and
stay fixed. A real phone photo beats a fake stock photo every time. Banned:
handshake stock, generic "team meeting", anything with a watermark.

---

## Pre-publish review

```
☐ Cover readable at thumbnail size
☐ No slide carries two ideas
☐ One accent per slide
☐ Dead zone empty
☐ Last slide has exactly one action
☐ Caption adds, does not repeat the slides
☐ RTL rules respected (if Arabic)
```
