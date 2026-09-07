# Post Archetypes — the forms, not the skins

A palette swap is not a design. Six posts in one layout with six accent colours
are one design shown six times.

These are the **distinct forms** found in the 94-slide teardown. They differ in
*structure* — where the chassis sits, whether there is a card, what carries the
argument — not in colour. Pick a form per post, and **never run the same form
twice in a row on the grid**.

Every post still needs the same three jobs filled: **a cover, content pages,
a CTA.** The form is how those jobs get built.

---

## The eight forms

### 1. `frame` — inset card + chassis rail
A rounded card inset 3% from a flat ground, with a folder notch cut in the top
edge and a three-column rail above it. Kicker pill → headline → rule → body.

**Reads as:** editorial, considered, magazine.
**Best for:** teaching series, personal brands, anything long-running.
**Risk:** it is the most template-like of the eight. Used alone it produces
exactly the sameness this file exists to prevent.

### 2. `bleed` — full-bleed image, type in the void
No card, no frame. The photograph runs edge to edge. Display type sits huge in
whatever region the image left empty — usually a sky, a wall, a table. Chrome
drops to a single handle.

**Reads as:** confident, cinematic, expensive.
**Best for:** covers, one-line statements, anything where the image is the argument.
**Requires:** an image with a genuinely empty third. `probe.mjs` decides, not you.

### 3. `poster` — flat field + giant type + hand marks

**Marks bind to words, never to coordinates.** `on:` names the target and the
mark is measured after `document.fonts.ready`, against the **glyph extents**
(a `Range`, not the element box — a line is `display:block`, so its box is the
full column and an underline drawn to it runs way past the word).
```js
lines: [{ text: "Flat field." },
        { text: "Marker marks.", accent: true, in: 1, size: 118, gap: 92 }],
marks: [{ type: "circle", on: "accent", padX: 46, padY: 20, rot: -1.2, sw: 5 },
        { type: "arrow",  on: "accent", w: 150, h: 118, dy: 26 }],
```
- **A ringed line needs its own `size` and `gap`.** The ring has to clear the
  line above it, or the two lines read as one block with a scribble over them.
- **`padX` ≫ `padY`** on a circle: an ellipse is narrowest at its own ends, so
  a uniform pad clips the first and last letter.
- The arrow takes the outside gutter, and drops **below** the word when the
  headline is near full-width. It is clamped to the canvas either way.
No photograph at all. One flat colour, heavy grain, type at 20–29% of canvas
height, and **hand-drawn marks**: a rough circle around one word, a scribbled
underline, an arrow, a bracket. The marks are the whole personality.

**Reads as:** human, urgent, made-not-generated.
**Best for:** the naked-promise slide, hot takes, one-idea posts.
**Rule:** the marks must be genuinely irregular. A perfect ellipse reads as a
shape tool and kills the effect.

### 4. `doc` — light ground, flowchart, connectors
A near-white ground that reads as documentation. Numbered mini-cards connected
by solid strokes with arrowheads, thin hairline borders, small labels. Often
carries miniature versions of the artefact being explained.

**Reads as:** a system, a spec, something you can trust.
**Best for:** process, workflow, "here is the structure", comparisons of steps.
**Rule:** the mini-cards must share the parent's aspect ratio. A miniature at
the right ratio reads as evidence; at the wrong ratio it reads as decoration.


`doc` is **full-bleed paper on any brand** — it swaps the whole slide to
`--paper`, rail and footer included. On a dark deck that ground flip is the
loudest thing one slide can do and it costs nothing.

**Set `docH`.** Cards size to their text, so a short protocol floats in the top
half and leaves 300px of dead ground. `docH: 288` with `docAt.t ≈ 470` fills the
page for two rows.

### 5. `spec` — margin numeral + rotated artefact
Dark ground. A very large step numeral runs up the **left margin**, rotated 90°,
in the accent. The headline sits in a narrow content column beside it. A real
artefact — a screenshot, a page, a photo — is rotated −6° to −9° and bleeds off
the bottom edge with a soft shadow.

**Reads as:** a portfolio, a case study, receipts.
**Best for:** numbered series, "archetype 3 of 6", showing real work.

```js
step: "02", numSize: 240, numOpacity: 0.14, numT: 372,   // the numeral
artefact: "…", artW: 600, artH: 330, artB: 66, artL: 200, artR: -7,
artPos: "50% 92%",                                       // crop to the SUBJECT
```
- `numOpacity` **.12–.16 on a light ground, .26–.32 on a dark one.** The same
  value does not read the same on both — 12% accent on near-black is a smudge,
  and a smudge looks like a rendering fault, not a design element.
- `numT` puts the numeral **level with the copy block**, not floating above it.
- `artPos` matters more than the crop size: an uncropped product photo is
  mostly empty backdrop, so `object-fit:cover` centred gives you a **blank
  slab**. Point it at the object (`50% 92%` for something sitting low).
- `artB` must stay **positive**. The card clips, so a negative bottom does not
  bleed romantically off the edge — it saws the artefact in half.
- Non-Latin scripts get the numeral **horizontal**; the rotated vertical stack
  is a Latin habit and turns a single Arabic-Indic digit upside down.

### 6. `compare` — two-up, one variable
Two cards side by side, equal size, equal Y, with a pill above each (before /
after, wrong / right, cheap / expensive) and a one-line verdict below each.
Everything else on the slide is held constant.

**Reads as:** rigorous, arguable, honest.
**Best for:** the mechanism slide, any claim of the form "this beats that".
**Rule:** hold one artefact constant and change exactly **one** variable. Five
comparisons on the same subject beat five unrelated examples, because the reader
can attribute the difference to one cause.

**A side can be text instead of an image** — which is what makes this form
available to a brand with no photography at all:
```js
a: { pill: "policy", text: "“We rotate quarterly.”", caption: "A document." },
b: { pill: "drill",  text: "“We rotated one and logged what paged.”",
     caption: "Now the blast radius is a number." },
```
The text panel sizes to its sentence (`--cmpH` floor, `--cmpFs` size). Do **not**
put a sentence in a photo-shaped 4:5 box — it renders 70% empty and reads as a
missing image.

### 7. `tile` — gallery grid on an artboard
A 2×2 or 3×2 grid of work tiles with **zero gutter**, sitting on a coloured
artboard with faint dashed guide lines still visible. One cell is sacrificed to
the caption block.

**Reads as:** a designer's screen, a body of work.
**Best for:** portfolio, roundups, "five things I made", client showcases.
**Watch the bottom:** `tilesAt.b` is dead space, not breathing room. Above ~180
the artboard reads as an unfinished slide.

### 8. `sculpt` — the type IS the object
The headline is built as a physical thing inside the image — neon tubing on a
panel, letters milled from metal, words formed from the product, chalk on a
wall. Then annotated with fine leader lines and small labels.

**Reads as:** crafted, high-budget, memorable.
**Best for:** one hero slide per post, usually the cover. Expensive to produce —
never build a whole carousel out of it.

---

## Choosing a form

| The post is… | Form |
|---|---|
| a statement carried by one image | `bleed` |
| a system or a sequence | `doc` |
| an opinion with no image | `poster` |
| a numbered series with real work to show | `spec` |
| an argument of the shape "X beats Y" | `compare` |
| a body of work | `tile` |
| a long-running teaching series | `frame` |
| a hero cover with budget | `sculpt` |

**Inside one carousel:** two forms, maybe three. The cover may differ from the
interior; the interior should be consistent enough to read as one document. The
CTA always breaks whatever form preceded it.

**Across the grid:** rotate. Four consecutive posts in `frame` is a template.
→ cover-collision test in [SKILL.md](../SKILL.md).

---

## Image style is a separate axis

Form is the layout. **Style is how the image itself is made** — and photoreal is
only one option. The reference set used at least six:

| Style | What it is | Reads as |
|---|---|---|
| `photoreal` | a photograph | credible, grounded |
| `char3d` | a stylised 3D caricature with exaggerated proportions | playful, IP-adjacent, instantly recognisable |
| `soft3d` | soft-body / clay-like 3D objects, subsurface glow | tactile, modern, product-safe |
| `cartoon` | flat 2D vector illustration, bold outlines | approachable, explanatory, safe for sensitive topics |
| `collage` | cut paper, torn edges, tape, photocopy texture | handmade, editorial, zine |
| `riso` | two-colour screenprint misregistration and grain | craft, indie, print-native |
| `render` | clean studio product render on a controlled surface | premium, catalogue |
| `neon` | letters or objects built as light | hero covers only |

```powershell
node scripts/gen.mjs --style=char3d --out=... --prompt="..."
```

The style stacks on top of the `vibe.json` lock — the lock keeps the *world*
consistent, the style decides *what medium that world is rendered in*. Keep one
style per carousel; changing style mid-post reads as a mistake, not as rhythm.

**A 3D caricature or a cartoon carries a face without the AI-likeness problem
entirely** — which makes them the right default for any brand that wants a
character but does not want to generate a real person.
