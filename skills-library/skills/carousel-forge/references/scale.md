# Scale — the seven registers

Measured off the 94 specimens in `learn/`. Hero type in that set spans
**2.2% → 47% of frame height**. Anything rendered inside a narrow band of that
range will read as the same design forever, whatever the colours are.

> **The failure this file exists to stop:** every deck shipped at 4.6–7.1%
> hero — one register, used for covers, explainers and statements alike. A
> cover set at explainer scale is not a cover.

`%` = cap height of the largest type ÷ frame height. On 1080×1350 that is
`px = % × 13.5`.

---

## The ladder

| Register | Hero % | px @1350 | Sizes/slide | Body ratio | Empty | Use |
|---|---|---|---|---|---|---|
| **Dossier** | 2.2–3.5 | 30–47 | 4–6 | ~1.5:1 | 10–20% | Contact sheets, wiring diagrams, spec tables, comparison matrices. Density is the message; hierarchy comes from position, not size |
| **Editorial** | 4–5 | 54–68 | 5–7 | 2.5–3.5:1 | 20–30% | Body-led argument, proof grids, insight slides. The paragraph is the payload |
| **Chapter** | 6–8 | 81–108 | 4–6 | 4–7:1 | 30–40% | The workhorse: rule cards, teach slides, numbered plates |
| **Cover** | 9–13 | 121–176 | 3–5 | 8–11:1 | 35–45% | Covers, CTA slides, wordmarks. **Minimum for anything that opens a deck** |
| **Specimen** | 15–24 | 202–324 | 2–3 | none — one or two elements | 45–60% | One word IS the design. Type specimens, single-statement slides |
| **Monument** | 28–47 | 378–635 | 1–2 | none | 50–70% | Rotated ordinals bleeding off an edge; type built as a physical object. One per deck, maximum |
| **Ghost** | 16–31 @ 6–10% opacity | 216–420 | — | — | — | A numeral or letterform *larger than any readable type*, sunk into the ground, cropped by a corner. Texture, not information |

**Sizes-per-slide falls as hero scale rises.** A Monument slide carrying five
type sizes is a Chapter slide with one word blown up — the count has to drop
with it or the scale reads as an accident.

---

## The three laws

**1 · The register is chosen per SLIDE, not per brand.**
A deck that never leaves one register reads as one long slide. The measured
decks move: Cover → Chapter → Editorial → **Specimen** → Cover. The jump to
Specimen in the middle is what makes the swipe feel like it has a spine.

**2 · Scale up, count down.**
```
Dossier   4–6 sizes   ·   Chapter  4–6   ·   Cover  3–5
Specimen  2–3 sizes   ·   Monument 1–2
```

**3 · Scale buys emptiness, it doesn't spend it.**
Every register above Chapter *increases* the empty fraction. Big type in a full
frame is loud; big type in an empty frame is expensive. This is the mechanism
behind *"empty space reads as confidence, and confidence reads as premium."*

---

## Ratio inside one slide

The step between levels, not the absolute sizes, is what reads as considered.

| Slide job | Display : body |
|---|---|
| Cover | 8:1 – 11:1 |
| Explainer | 4:1 – 7:1 |
| Reference / data | ~3.5:1 — deliberately flat |
| Weight-led (Arabic) | 1.1:1 – 1.9:1 — **hierarchy by weight, not size** |

**Arabic caveat:** Arabic loses legibility fast when scaled down and gets noisy
when scaled up, so above Chapter register build the step with **weight and
colour**, and keep the size ratio between levels inside 1.1–1.9:1. A Monument
Arabic slide is one line at one size — the drama is the size itself, not a
contrast between two sizes.

---

## Deck-level scale arc

Assign registers before writing any copy. Two arcs measured off real decks:

```
Statement arc   Cover 11%  → Chapter 7%  → Chapter 7%  → Specimen 18% → Cover 10%
Dossier arc     Cover 10%  → Dossier 3%  → Editorial 4.5% → Chapter 7% → Cover 9%
```

Both flip register at least twice. A deck whose registers read
`7 · 7 · 6 · 7 · 6` has no arc at all — that is a rendered deck, not a designed one.

---

## Calibration — read this before trusting your eye

At 1080×1350 a headline that *feels* big in an editor is usually Chapter, not
Cover. Check the number, not the impression:

```
54px  = 4.0%   editorial body-led
81px  = 6.0%   workhorse
121px = 9.0%   ← the floor for a cover
176px = 13.0%  a confident cover
270px = 20.0%  specimen
400px = 29.6%  monument
```

**Feed test:** downscale to 350px wide. Cover register survives; Chapter
register on a cover does not — it reads as a paragraph.

## Use with
`library.md` (the twelve layout families — each has a native register) ·
`typography.md` · `composition.md`
