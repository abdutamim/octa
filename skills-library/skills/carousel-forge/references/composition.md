# Composition — grid, margins, and depth

Every number here was measured off the reference set (94 slides). All values are
ratios of the canvas, so they hold at any output size.

---

## Format

| Ratio | Pixels | When |
|---|---|---|
| **4:5** | 1080×1350 | Default for Instagram. Tallest area the feed allows. |
| **3:4** | 1080×1440 | More room for copy. Gets cropped in feed — leave a bigger safe margin. |
| 1:1 | 1080×1080 | LinkedIn, or when the grid matters more than the single post. |
| 3:1 | 3240×1080 | Panorama sliced into 3 grid squares. **Publish in reverse: 3 → 2 → 1**. |

**Only two sizes exist:** the output, and the thumbnail inside it. If you show
work as a mockup inside a slide — a photographer's print layout, a SaaS
dashboard — **keep the thumbnail at the same ratio as the parent canvas**. A
scaled-down copy of the same ratio reads as *evidence*. A rectangle at the wrong
ratio reads as *decoration*.

---

## Vertical bands

```text
 0%  ┌──────────────────────────────┐
     │  fixed rail       5.3–6.5%   │  ← date · handle · discipline
     │                              │
 15% │  kicker / badge   13–17%     │
     │                              │
 21% │  ▓▓▓ HEADLINE ▓▓▓            │  ← optical centre 27–38%
 38% │                              │
     │  deck / subhead   32–41%     │
     │                              │
 45% │  ═══ horizon / split line ══ │
     │                              │
     │       image / proof          │  39–86%
 86% │                              │
     │  dead zone        88–100%    │  ← feed caption + button bar
100% └──────────────────────────────┘
```

**The numbers that repeated across every reference:**

| Element | Value |
|---|---|
| Fixed rail | y **5.3–6.5%** · side margins **7–10%** |
| Headline top | y **15–21%** — **locked** on every interior slide |
| Headline optical centre | y **27–38%** (mostly 31–32%) |
| Content column | inset **13–28%** — **not the same as the rail margin** |
| Bottom dead zone | **8–17%** — always empty |
| Reading-edge margin | locked at **5–11%**; the opposite edge floats → see `references/scripts-rtl.md` |

### The two independent margins
> Rail at 9.5% · content column at 13–28%.

Same margin for both = template. Two different margins = designer. It is the
cheapest thing you can do and the fastest one that shows.

### The reading edge
The reading edge is locked to a fixed `x` (**5–11%**) and never moves between
slides; the opposite edge floats with line length. Which edge is which — and
which way comparisons run (before → after) — depends on script direction
→ see `references/scripts-rtl.md`.

---

## The fixed chassis — the single most important carousel decision

One rail, three columns, **does not move a single pixel**:

```text
JULY ©2026        @yourhandle        CREATIVE STRATEGIST
```

- Utility face, **caps**, tracking **+6% to +18%**, cap height **~1.1%** of the
  canvas.
- **Only the colour changes** (black on light, white on dark).
- **This is what makes 8 completely different images read as one account.**
  That strip alone.

**Alternative if there is no rail:** a 1px hairline frame offset 2–3% from every
side, or a dot/dash grid at 8–10% opacity across the whole canvas. Anything
**100% constant** works as a signature.

> ⚠️ If the chassis carries no handle, no wordmark, no mark of any kind, a
> screenshot of one of your slides **will not lead anyone back to you**. Two of
> the references made this mistake.

---

## Where the copy sits

### The rule: never on a mid-tone. Ever.

```text
✅ quiet + dark region (L* < 35)   → white type
✅ quiet + light region (L* > 72)  → near-black type
❌ mid-tone                        → no type colour will work
❌ busy region (high detail)       → even when the luminance is right
```

Run `probe.mjs` — it gives you that map for real instead of guessing.

### The ladder, when the image will not cooperate

In order. Do not jump to the last one.

**1. Move the copy.** Is there another valid region? Use it.

**2. Fix the image.**
- **Push the horizon to 60–72%** → the sky becomes a clean shelf for type. This
  is the single most repeated move in the whole reference set.
- **Outpaint upward** to widen the headroom.
- **Flip the type to white** and go hunting for the dark region.

**3. Use what the subject is wearing.** A black hoodie, a dark suit, dark hair =
a free type plate, **with no layer at all**. The reference set does this often.

**4. A solid black bar.** If you must — **hard edges**, not a gradient.

**5. Drop the image.** Make the slide a designed background or a flat colour.
This solves the problem at the root, and it is allowed — half the references
have no photography on their interior slides at all.

> ❌ **The soft gradient scrim.** Every designer in the reference set refused it.
> They solve with placement, not with a layer. A scrim says "the design happened
> after the photo"; placement says "both were thought about together".

### "Copy in the sky, objects on the ground"
On any slide with a photo, the horizon is **the only real grid line**. Copy
above it, objects below it. If there is no horizon, invent one — a colour split,
a building edge, a waterline.

---

## Depth — three methods, ranked

### 1. The gap in the sentence ★ best
Split the line into two pieces on **the same Y** and leave an engineered gap
between them for the subject to stand in.

```text
 ┌────────────────────────────┐
 │  5 Rules        No theory  │   ← deliberate gap in the text
 │        🧍                  │   ← the head sits in it
 └────────────────────────────┘
```

Real depth, real interlock, **and zero occluded letterforms**. Used twice in one
reference and done correctly both times.

### 2. Cut-out over type
```text
z1  full image
z2  type            ← goes here
z3  cut-out subject ← over the type
```

**Four conditions — break one and the word dies:**

| Condition | Why |
|---|---|
| Occlude **counters and stem bottoms** only | The distinguishing mark of the letter is what makes it readable |
| **First and last letter stay whole** | They set the word's length and shape |
| **Hard colour separation** between subject and letter | Without it the brain reads them as one layer = mush |
| A **heavy** weight (Black/ExtraBold) | The skeleton survives even when partly hidden |

**Cursive and connected scripts add constraints** — never break a joining
stroke, never eat the opening letter, never touch a diacritic
→ see `references/scripts-rtl.md`.

**Safety ratio:** occlusion never exceeds **~25% of two letters**; everything
else stays whole.

### 3. Clean space
The default. **Explainer slides in every reference are completely flat — zero
interlock.**

> **Depth is a cover tool.** Spend it on the cover or the CTA only. Put it on
> every slide and it stops being depth and becomes noise.

---

## Alternate the subject's side every slide

```text
cover       centre
explain 1   right   ← copy left
explain 2   left    ← copy right
explain 3   right   ← copy left
grid        centre  ← the subject's silhouette is the gutter
summary     centre  ← symmetrical columns either side
CTA         no image
```

The swipe gains a physical rhythm, and the reader feels movement without
noticing why.

**And on the grid slide:** let **the subject's own silhouette be the gutter**
between the two copy columns. No cutting, no occlusion needed — the body becomes
a layout element. (In the reference the gutter was ~240px, and the chip rows sat
on a constant 193px step.)

---

## The framed card

Instead of letting the image bleed across the entire canvas, put it in an
**inset card** — this is what turns an ordinary phone photo (a restaurant's
plate shot, say) into something that reads as *designed*.

```text
canvas    #000000 solid
card      inset 3.2% left/right · 4.4% top · radius ~30px
strip     bottom 10.6% pure black ← handle and signature
notch     the card's top edge drops 77px at 42% of the width
          ← the arrow sits in that gap
```

The black strip at the bottom solves two problems at once: it gives the handle a
fixed home, and it keeps every piece of copy clear of the feed's caption zone.

---

## Bleed
**Let something large bleed off an edge** in every frame — a person, a jar, a
letterform, a card. Nothing fully contained. A closed frame reads as clip art.

The card/mockup rotates **−6° to −9°**, bleeds off one edge or two, and sits on a
soft shadow (~25px blur, ~35% opacity).

---

## Comparison devices

**One per slide. Three units maximum.**

| Device | When |
|---|---|
| Two cards side by side | Before/after — **change exactly one variable** |
| 3 circles | Three stages or tiers |
| One giant number badge | The quantity is the argument |
| 6 numbered circles | Six steps — the number matches the copy |
| Black knockout bar | A single line worth quoting |

**The device has to argue the point.** "6 numbered rules" → 6 numbered circles.
"Before and after" → two cards. Decoration with no argument = failure.

**And more important:** on explainer slides, **hold the artefact fixed and change
one variable**. Five comparisons on the same base beat five different examples —
a language school showing one sentence corrected five ways lets the reader
attribute the difference to a single cause.

---

## Mistakes seen in the reference set

1. **No handle in the chassis** → the screenshot has no owner.
2. **Duplicated numbering** (`5. 5.`) from automatic plus manual numbering.
3. **Slides out of order** (rule 4 before rule 3) — check the sequence before
   publishing.
4. **Cover in a colour that isn't in the deck's palette** → the first slide
   doesn't match the ones after it.
5. **Uneven spacing** between list items — lock them to a constant step.
6. **A "keep going" arrow on half the slides and missing on the rest** — it is a
   system or it isn't.
7. **Tile colour too close to the frame colour** → the work drowns into the
   background. The frame must be **lighter and less saturated** than the content.
