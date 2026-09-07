# Design rules — measured, not felt

Every rule here exists because eyeballing failed on a real deliverable.

## Contrast

Score text against the **worst pixel** behind it, not the average. A scrim that
averages dark still has bright leaks where the photo shines through, and that's
where the client's eye lands.

- Large text (≥ ~40px display type): **≥ 3.0 : 1** (WCAG AA large)
- Small text (body, contact lines): **≥ 4.5 : 1**
- Measure on **real element rects** (`?rects=1`), never on hardcoded y-offsets —
  the layout you remember is not the layout on screen. We once measured to y=844
  while the block ended at ~650: every number was fiction.
- Semi-transparent cards must be **composited mathematically** before measuring:
  `shown = card·α + bg·(1−α)`, then take the contrast against that.

## Hierarchy without losing contrast

Dimming secondary text below ~80% lightness fails contrast on photos (a tier at
78% L scored 1.45:1). Keep **all** text tiers above ~90% lightness and build
hierarchy with **size and weight** instead:

```
--text-1: oklch(97% 0.010 85)   /* primary   */
--text-2: oklch(93% 0.011 85)   /* secondary */
--text-3: oklch(90% 0.011 85)   /* tertiary  */
```

## Scrims and adaptive panels

A blurred dark panel behind the text block should size itself **from the measured
text rect**, not from constants. And blur *spreads*: a 172px blur pushes the
effective edge ±172px, so the covered area is much smaller than the box. Always:

```js
const pad = basePadding + blurRadius;
```

When the user asks to "lighten the gradient", lighten the *overall* scrim but keep
the local panel behind the text — global darkness is taste, local contrast is
legibility.

## Instagram story geometry (1080×1920)

- Top ~13% (≈250px) and bottom ~13% are covered by UI — nothing essential there.
- Keep all content above y ≈ 1670.
- Side margins: nothing closer than ~80px to the edge.

## Working with the client's reference

- Match the reference's **proportions** (relative text size, placement rhythm),
  not its literal pixel values.
- Placeholder data in references (fake phone numbers like `+966 55 123 4567`) must
  be replaced with the client's real data — copy the layout, never the content.
- When a hand-tuned design needs a fix, fix it **without flattening the depth** —
  removing layering/shadows to "clean it up" reads as breaking the design.

## Copy

- Gulf/Saudi clients: MSA, not Egyptian dialect (اللي/بيتبني → التي/يُبنى).
- Accent one word per hook (`*word*` → gold). More than one accent = no accent.
- Superscript characters (²) tofu in most Arabic fonts — write م2, or accept the
  substitution the tooling does automatically.
