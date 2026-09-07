# Scripts and reading direction

Rules that change with the writing system. Everything in `typography.md`
still applies — this file only covers what is different.

---

## The reading edge

Every slide has one locked edge. Type hangs from it; nothing crosses it.

```text
LTR script (Latin, Cyrillic, Greek)   →  left edge locked
RTL script (Arabic, Hebrew, Farsi)    →  right edge locked
```

**The edge never moves between slides.** A carousel that flips its anchor
mid-sequence reads as a set of unrelated images, not a post. Pick the edge
from the language of the copy, set it once, and hold it for every slide
including the cover and the CTA.

---

## Arabic

### 1. Hierarchy by weight, not size

Arabic has no fixed cap-height the way Latin does, so a size jump lands far
more violently. Two independent reference sets solved this the same way:
**a ratio of only 1.15:1, with the whole difference carried by weight**
(Black against Light from the same family). The usable band across the
reference set is **1.1:1 – 1.9:1**.

Use **ExtraBold–Black for Arabic display**. Light weights in Arabic
disappear on a small screen.

### 2. Justify with kashida, not word spacing

```text
❌  text-align: justify           → ugly rubber-band word gaps
✅  محـ__ركات البحـ__ث حاليـ__ا   → kashida (tatweel) to flush the edges
```

The kashida (ـــ) stretches **the join between two letters** — that is the
correct Arabic solution. Use it to make two lines land at exactly the same
width. It is what makes a block read as "designed" rather than "typed".

### 3. Never split text into per-character spans

```html
<!-- ❌ breaks letter joining: «مش» becomes «م» + «ش» -->
<span>م</span><span>ش</span>

<!-- ✅ for animation, use clip-path on the whole element -->
```

Any per-glyph wrapping — for staggered reveals, per-letter color, character
counters — severs the cursive connections and the word stops being a word.
Reveal with `clip-path` or a mask over the intact element instead.

### 4. Never glue the definite article to a Latin word

`الdashboard`-style constructions are broken text, not a style choice. Either
translate the term, or restructure the phrase so the article attaches to an
Arabic word.

### 5. Numerals — pick one system and hold it

Choose a system and **keep it for the entire carousel**:
- **Western Arabic** (`3`, `2026`) — the default, and clearer for large
  numbers and percentages.
- **Eastern Arabic / Hindi** (`٣`, `٢٠٢٦`) — for a formal or editorial brand
  voice.

Both appear across the reference set. What never works is mixing them inside
one post. The one acceptable exception: Eastern numerals in editorial copy
and Western numerals inside a screenshot or a UI element, so the reader can
match what they see on screen.

### 6. Occlusion

If a subject or object overlaps the type, it may cover **terminals, tails and
ascender flourishes** only. **It must never touch a join between two
letters** — the joining is what makes the word readable at all.

---

## Mixed script

### Don't share a line

```text
✅  استخدام            ← its own line
    Claude             ← its own line
    في بناء الهوية      ← its own line

❌  استخدام Claude في بناء الهوية    (unless it's a short loanword)
```

The exception is a loanword with no equivalent (`DM`, `CTA`, `Alt Text`) —
leave it in Latin inside the Arabic line.

### Size-compensate

When Latin does sit inside an Arabic line, **set it slightly larger**. Latin
cap-height reads smaller than Arabic body height at the same nominal size, so
matching the numbers gives you a visual mismatch.

### Gradient direction

A gradient on type must run **with the reading direction** — first color at
the **right** edge for RTL, at the **left** edge for LTR. A gradient running
against the reading order fights the sentence.

---

## Arabic typefaces

Categories and pairing logic are in `typography.md`. These are the specific
families that held up in the reference set.

| Role | Options |
|---|---|
| display | Milan Display · Lifta Black · Zain · Almarai Black · Tajawal ExtraBold |
| body | Bukra (regular/bold) · Cairo · Almarai |
| geometric | Alexandria · IBM Plex Sans Arabic |
| decorative (names only) | Diwani / Ruqʿah — for names and signatures, never running text |

The comparison-sheet rule from `typography.md` matters more here, not less:
Arabic families differ enormously in x-height, join thickness and how they
behave at Black. Render the same real sentence in every candidate and choose
by eye.

---

## Tooling

**Use a BiDi-correct renderer.** Chromium handles Arabic shaping, joining and
kashida correctly — build in HTML and render there. Several design tools
(including vector editors that lack real BiDi support) silently reverse word
order inside mixed-direction lines. The file looks fine in the editor and
ships broken.

**UTF-8 in shells.** Some shells and HTTP clients mangle non-ASCII on the way
out — text that renders perfectly in the browser arrives at an API as
mojibake. This bites hardest when passing captions or copy as command-line
arguments. Prefer a shell and client pair that you have verified end-to-end
with real non-ASCII text, or pass the text in a UTF-8 file instead of on the
command line. Always read the string back from the destination before
assuming it survived.

**Other scripts.** CJK and Devanagari have their own line-breaking rules and
their own vertical rhythm — CJK breaks between characters with no spaces to
lean on, Devanagari hangs from a headline stroke that changes how leading
reads. The rules above don't transfer directly, but the principle does:
**verify in the actual renderer, never trust a preview.**

---

## Auto-detection

The renderer picks direction from the content. If a post contains Arabic
characters it renders RTL; otherwise it renders LTR.

Override it per post:

```js
{ latin: true, rtl: false }
```
