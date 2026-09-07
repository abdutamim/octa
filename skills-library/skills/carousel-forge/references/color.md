# Color

This file teaches a method for choosing colour, not a palette. Every hex value
below is an **example** of the method's output. The three colours belong to the
brand you are working for — a law firm and a music producer will land in
completely different places running the same procedure.

---

## The rule of three

```text
ground   60–92%   one background
ink       6–12%   type colour
accent    1–10%   the hit colour
```

Three. Not four. The decision is made **once for the brand**, not per post.

**The accent lands on one word or one shape per slide.** Measured off the
reference set: 1–2% (most slides) · 6–10% (when the accent is a badge or a card)
· 15–18% (the ceiling, when the accent is a full block).

**A fourth colour is allowed once in the entire carousel**, and only if it has a
**semantic job**:

| Colour | Job | Use once |
|---|---|---|
| Red | Danger · the wrong state · the number that fell | ✔ |
| Green | Success · the "after" · the right state | ✔ |
| Yellow | Caution · a pin on a map | ✔ |

In one complete 8-slide reference, red appeared **exactly once** — on the losing
card. That is why it read as an alarm and not as decoration.

---

## Role distribution

| Role | What | %  |
|---|---|---|
| **ground** | The background. Flat colour or a graded image. | 60–92 |
| **ink** | The colour of all type. **One value, no mid-grey.** | 6–12 |
| **accent** | The hit word, the badge, the strip | 1–10 |

> **No mid-grey in body copy.** The cleanest reference used only two values —
> for example `#111111` and `#FFFFFF`. Mid-grey makes hierarchy go slack.
> To soften a line, **drop its weight**, not its colour.

---

## Choosing the palette

### 1. Pull from the image, don't invent
```powershell
node scripts/probe.mjs assets/p01.png
```
Returns the top 6 colours with their share and luminance. **Take the accent from
here.**

One reference set the headline in **the colour of the plants in the photo** —
which is why the type read as welded into the frame rather than dropped on top
of it.

### 2. Accent complements the base
```text
navy / blue    →  orange · amber
green          →  orange · coral
purple         →  gold · cyan
cream / paper  →  brick red
black          →  acid lime · fire orange
```

### 3. Tonal spread
```text
spread L*  <45  →  the cover will die at thumbnail size
spread L*  >55  →  good
```
`probe.mjs` tells you. Narrow spread means the image is flat — fix it with
contrast or replace it.

---

## Grading — the step everyone skips

> **A raw photo on a brand background looks pasted on. Always.**

The image arrives carrying colours the palette does not own. It has to be
brought inside the palette.

```powershell
# duotone — strongest. Puts the image in the same colour family
node scripts/grade.mjs p01.png --out=p01.png --duotone=#0C1638,#3B5BFF

# filmic — lifted blacks, reduced saturation, grain
node scripts/grade.mjs p01.png --out=p01.png --preset=filmic

# plate — less saturation + vignette, so type wins over the image
node scripts/grade.mjs p01.png --out=p01.png --preset=plate
```

(The duotone pair above is an example. Substitute the brand's own two values.)

**Degrees of intervention, light to heavy:**

| Level | What | When |
|---|---|---|
| warm/cool grade | A light push toward one cast | The image is already close to the palette |
| desaturate 0.8–0.9 | Take the saturation down | Busy image, and the type has to win |
| duotone | Map all luminance onto two colours | The image has a cast that fights the brand |
| mono + grain | Full greyscale | The "break the rhythm" slide |

**Push the linkage:** put the frame colour **inside the scene** — a laptop
screen, neon, clothing, a wall. The strongest reference in the set put the
frame's terracotta onto the laptop screen in the photo, so frame and image became
one continuous field of colour.

### The alternative: darken, and leave the saturation
If you want neither duotone nor a filter, there is a second route that carried a
complete 8-slide reference:

```text
mean luminance    65–85 of 255   ← dark
mean saturation   0.41–0.57      ← left alone
```

The image ends up dark enough to carry white type almost anywhere while **the
colours stay alive**. This removes the need for a scrim entirely. That carousel
used **no duotone, no desaturation, no blur** — the coherence came from **one
location and one wardrobe**, not from a filter.

---

## Grain

> **Any flat colour without grain reads as "default swatch", not as design.**

```powershell
node scripts/grade.mjs bg.png --out=bg.png --preset=flat   # grain 8
```

- Dose: **3–10%**. The reference set sits at 3–5% on light backgrounds,
  8–12% on dark and filmic ones.
- **Put the grain over the whole composition**, not under it — that is what
  melds screenshots and pasted elements into the page instead of leaving them
  looking cut out and stacked.
- Substitutes that do the same job: paper texture, cloth, plaster, crumpled
  stock, vertical lines.

---

## Accent blackout

**Ban the brand colour completely on one slide or two.** Its absence is a
stronger signal than its presence.

In the reference set the accent was always withheld on:
- **The emotional / confession slide** — where the pitch stops and candour starts
- **The diagnostic slide** — "your problem isn't X, your problem is Y"
- **Sometimes the cover** — so the image carries the entire load

The reader will not notice the absence consciously. They will just feel that
slide is "different".

---

## Colour rhythm

**Identical treatment on every slide = one long slide.**

Flip the luminance hard **at least twice** across 10 slides:

```text
blue photo → blue photo → saturated orange → flat grey → dark → cream paper
                              ↑ flip 1                    ↑ flip 2
```

- **Change the background treatment every slide.** Never repeat the same
  treatment twice in a row.
- **The cover must match the deck's palette.** Mistake seen in the set: a cover
  in a navy lighter than every slide behind it — the first slide looked like it
  came from a different post.
- **The grid test:** people follow the grid, not the single post. Look at
  `COVERS.png` after rendering — the first three rows have to read as one brand.

---

## Contrast

```text
body type            ≥ 4.5:1
large type           ≥ 3:1   (aim for 4.5 anyway)
knockout over image  ≥ 15:1  ← first push the region beneath it to ~#0A0A0A
```

`probe.mjs` computes this per region of the image.

**Colour is never the only signal.** If the accent distinguishes a word, let
weight or size distinguish it too.
