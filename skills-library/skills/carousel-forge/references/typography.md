# Typography

---

## The scale

Every number is a percentage of canvas height (1350 or 1440).

```text
display        15–29%   200–400px    the hero word
deck / subhead  3.5–4%   48–58px      the line under the headline
body            2.5–3%   34–46px      running text
micro / rail    1.1–1.6%  15–26px      the fixed chassis
```

**A 1.6× modular scale** held up across the reference set:
`23 → 38 → 58 → 100 → 155 → 185px`

### Ratios — they change with the slide's job

| Slide type | display : body |
|---|---|
| cover | **10:1 – 11:1** |
| teach / explain | **4:1 – 7:1** |
| reference / data / list | **~3.5:1** — deliberately flat hierarchy |
| weight-led scripts (see `scripts-rtl.md`) | **1.1:1 – 1.9:1** |

> A reference slide **must** have a flat hierarchy. Put a 10× headline over a
> table of numbers and the table dies — and the table is the reason anyone
> saves the post.

### Other measured numbers

```text
display size           200–400px  (15–29% of height)
hero word width        74–79% of canvas width
leading (display)      0.78–0.92em   ← lines touch
leading (body)         1.25–1.8em
tracking (display)     −1% to −3%
tracking (micro caps)  +6% to +18%
body grid              fixed 100px pitch
illustration row       fixed 180px
```

**Tight leading is not a detail.** 0.78–0.92em interlocks the lines so they
read as **one shape**, not two sentences. That is what produces the editorial
feel.

---

## Pairing — two typefaces, no more

```text
grotesk / geometric sans  →  instructions · structure · numbers · chassis
high-contrast display serif  →  the name · the emotional word · the quotable line
```

**Never swap those roles.** The rule's name goes in the grotesk; the word that
stings goes in the serif. Reverse them and the result reads "decorated"
instead of "intentional".

**A third typeface is a mistake.** The only exception: a handwritten script
face, for one word in the entire carousel (a signature, or "Tips" in the
footer).

**Styles per slide: 3–5 maximum.** Past that, the slide is carrying two ideas.

---

## Emphasis tools — one per line

| Tool | How |
|---|---|
| **Weight jump** | The meaning-bearing fragment takes Black, the rest Bold or Light. Strongest tool and the cleanest. |
| **Accent color** | One word. Not a line. |
| **Size jump** | The hero word runs 1.7–1.9× the words around it |
| **Case** | Title Case for the qualifier + lowercase for the hero word |
| **Square brackets** `[like this]` | Works in any script, and works without color |
| **Quotation marks** | Carry the full emphasis load with no weight change at all |
| **Italic** | Tone only. Twice per slide, maximum. |
| **Highlight** | A rectangle behind the word at only **12%** luminance difference — so the text stays at 15:1 |

**Never stack two tools on the same word**, unless that word is the whole
slide.

### Weight jump — worked example
```text
Use strong visuals  that support your message.
   ↑ Black              ↑ Bold
```
The black fragment is the argument. The rest is a sentence. That difference
lands before anyone reads.

### Case as hierarchy
```text
Master Carousel      ← Title Case, qualifier, small
covers               ← lowercase, hero, huge
```
Lowercase lets the word grow larger without a crowd of ascenders.

---

## Choosing typefaces

Pick by **category and role**, not by name. The categories below cover almost
every brief; the examples are widely available and span multiple scripts.

| Role | Category | Examples |
|---|---|---|
| display | grotesk | Inter · Helvetica Now Display · Neue Haas Grotesk · Geist |
| display | high-contrast serif (Didone-adjacent) | Instrument Serif · PP Editorial New · Ogg · Canela |
| display | condensed | Anton · Archivo Condensed · Oswald · Barlow Condensed |
| body / chassis | geometric sans | IBM Plex Sans · Alexandria · Work Sans |
| one word only | script / calligraphic | signatures and names — never running text |

For a display face, the deciding question is whether it survives at
`0.78–0.92em` leading in ExtraBold or Black. Many text faces do not: the
counters fill in and the lines smear together instead of interlocking.

For a body face, the deciding question is the opposite — does it stay legible
at 34–46px on a 350px thumbnail with no accent color helping it.

Script-specific recommendations (Arabic and other RTL systems) live in
`scripts-rtl.md`.

**Before committing to a typeface:** render a **comparison sheet** — the same
real sentence, in the language you are actually shipping, set in every
candidate — and compare visually. Never choose from the typeface's name or
its specimen.

---

## The thumbnail test

Carousels are seen at **~350px** in the feed. That is a 3× reduction.

**Before you ship:** downscale the PNG to 350px wide and look.
- Is the headline still readable?
- Is the accent still visible?
- Has the body turned into gray mush? (Expected — just don't put decisive
  information there.)

If the headline is not readable at 350px, **it does not exist**.
