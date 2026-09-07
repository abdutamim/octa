# House Grammar — measured from Tamim's own shipped pages

**This file outranks every other reference in this skill.** Where anything else
disagrees with it, this wins — the others are borrowed opinion, this is measured
practice.

**Corpus:** 30 single-file landing pages in `C:\Users\Admin\Desktop\Projects\htmls`
(the same deliverable type this skill is used to produce), plus the three portfolio-
showcased builds: `archidot`, `ecart`, `exoraspark`. Isohere excluded by the author.
Method: mechanical extraction (regex over all inline CSS), then frequency across
files — a value that recurs across many projects is a signature; a value used once
is that project's accident. 247 shadow declarations, 30 files.

Reference frames live in `../corpus/` (arc-*, ecart-*, exora-*).

---

## 1. Depth is the signature. Build it, never flatten it.

Measured across 247 shadow declarations:

| quantity | p25 | median | p75 | range |
|---|---|---|---|---|
| y-offset | 0 | **8px** | 20px | 0 – 50 |
| blur | 30 | **40px** | 60px | 4 – 200 |
| blur ÷ y | 2.0 | **2.4×** | 3.0 | 1.5 – 10 |
| alpha | .22 | **.35** | .52 | .06 – .80 |
| spread | −15 | **−12px** | −12 | −30 – −1 |

Layer counts: 121 single-layer · 41 two-layer · 10 three-layer · 2 four-layer.
So roughly **one shadow in three is multi-layer**.

**The recipes, verbatim from shipped work:**

- Lifted panel on light paper — `0 24px 64px rgba(42,31,22,.22), inset 0 1px 0 rgba(255,255,255,.65)` (archidot)
- Same device, cooler brand — `0 34px 90px rgba(7,22,43,.24), inset 0 1px 0 rgba(255,255,255,.68)` (aurelia)
- Deep card on dark — `0 24px 90px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.16)` (exoflora)
- Pulled-in halo — `0 20px 40px -12px rgba(0,0,0,.3)` (coincompass, 21 uses)
- Wide soft float — `rgba(23,21,18,.35) 0 40px 80px -30px` (aura)
- Accent glow, 3 layers — `0 0 32px rgba(143,188,42,.35), 0 0 80px rgba(143,188,42,.12), inset 0 1px 0 rgba(255,255,255,.18)` (ecart)
- Emphasis ring — `0 0 0 7px rgba(255,255,255,.06)` (nexus) · `0 0 0 3px rgba(143,188,42,.2)` (ecart). 42 ring shadows in the corpus.

**The inset top highlight is a signature device**: `inset 0 1px 0 rgba(255,255,255,α)`
appears 31 times across 5 projects, α from .10 (dark surfaces) to .72 (light).
It reads as a lit top edge and is what makes a panel feel like an object rather
than a rectangle. Pair it with the drop shadow; don't ship one without the other
on a primary panel.

**Negative spread (median −12px) is how the big blur stays soft** without a heavy
dark edge. A 40–90px blur with 0 spread looks muddy; the same blur at −12 to −20
reads as air.

## 2. Radius

Pills dominate: `999px` / `100px` (107 combined uses) for every button and label.
`50%` (141 uses, 11 files) for avatars, icon circles, dots.
Everything else sits on a scale: **8 · 10 · 12 · 14 · 18 · 20 · 26 · 28 · 30px**,
with small components at 8–14 and panels/cards at 18–30.

Buttons are pills. This is not negotiable in this house style — no 8px buttons.

## 3. Type

Weights in use: 300 · 400 · 500 · 600 · 700 · 800 · 900 — **all seven**.
600 and 700 carry the most work (104 and 92 uses); 800 appears in 7 projects and
900 in 4. Heavy display weight is normal here, not an exception.

Letter-spacing splits cleanly in two:
- Display / headings: **−.01 to −.04em** (tighter as size grows)
- Small caps-style labels: **+.08 to +.26em** — the wide end (.16–.26) is used
  freely, wider than most guidance allows.

## 4. Motion

Signature curve: **`cubic-bezier(.16,1,.3,1)`** (expo-out) — 78 uses across 4 projects.
Secondary: `cubic-bezier(.22,1,.36,1)` (quint-out), `cubic-bezier(.2,.8,.2,1)`.

Durations, by job:
- micro / hover / state: **.2s · .25s · .3s** (.3s is the single most common value, 103 uses)
- transitions / reveals: **.35s · .4s · .6s**
- entrances: **.8s · .9s · 1s · 1.2s**
- ambient loops (marquee, drift): **3s · 4s**

## 5. Move vocabulary

Class-word frequency across the 30 files — how many projects use each device:

`grid` 30 · `card` 15 · `hero` 12 · `tag` 11 · `logo` 9 · `panel` 9 · `eyebrow` 9 ·
`cta` 9 · `marquee` 8 · `badge` 7 · `toggle` 6 · `step` 6 · `glow` 6 · `stat` 6 ·
`price` 5 · `float` 5 · `faq` 5 · `chip` 5 · `pill` 4 · `plan` 3 · `quote` 3

The label-pill family (`eyebrow` + `tag` + `badge` + `chip` + `pill`) appears in
almost every project. It is the most characteristic device in the corpus.

## 5b. Video hero — a signature move the first extraction pass MISSED

Archidot ships a full-bleed looping video behind the hero, not a still:

```html
<video src="./video/hero-b.opt2.mp4" poster="./img/hero-b-poster.jpg"
       data-aura-video-preset="loop-in-view" autoplay muted playsinline
       preload="auto" loop
       style="position:absolute;inset:0;width:100%;height:100%;
              object-fit:cover;pointer-events:none;z-index:0"></video>
```
`archidot-studio/index.html:195` · same device again on a card at line 337.

Craft details that make it safe: always a `poster` still, always `muted` +
`playsinline` (iOS will not autoplay otherwise), `object-fit:cover`,
`pointer-events:none`, and a `loop-in-view` preset so it only plays while on
screen. Weight is controlled by shipping an optimised cut — `hero-b.mp4` is
9.6 MB, the `opt2` cut actually used is **2.9 MB**.

The older variant (`مواقع ديمو/archidot/index.html:240`) omits `autoplay` and
drives playback from JS instead, so it renders as the poster until scrolled into
view.

**Why this was missed:** the first pass screenshotted that autoplay-less variant
in headless Chromium, which silently showed the poster frame. A still was
recorded where a video actually lives. **Lesson for future extraction: grep the
markup for `<video>`, `<canvas>`, `<svg>` animation and scroll-linked JS — never
trust screenshots alone to tell you what a page does.**

On phone-first pages weigh this against data: a 3 MB autoplay background is real
cost on mobile. Poster-first with `preload="metadata"` and play-in-view is the
compromise his own markup already uses.

## 6. The hero apparatus

Present, in this order, in all three showcased builds despite three completely
different visual identities (archidot warm cream · exora dark cinematic ·
ecart light green):

1. **Eyebrow pill** above the headline — a rounded label, often with a leading dot or rule
2. **Headline with exactly one word in the accent colour** — archidot's highlighted
   word, exora's italic `home.`, ecart's green `Shopify`
3. **Two-line lede**, short
4. **A pair of pill buttons** — one filled, one outlined. Never two filled, never one alone
5. **A stat row** directly under the CTAs — 3–4 figures, large numeral over a small
   tracked label
6. **Floating labelled pills over the visual** — corner tags on photos, scattered
   proof badges, a panel overlaying the image

Silhouettes differ per brand; **this apparatus does not**. It is the constant.

## 7. Corrections to the rest of this skill

These were taken from video transcripts and are contradicted by the measured corpus.
Trust this file, not them.

| Rule elsewhere in this skill | What the corpus actually does |
|---|---|
| "blur = 1.3–2× the y offset" | median **2.4×**, p75 3.0 |
| "shadow opacity 15–20%" | median alpha **.35**, p75 .52 |
| (negative spread never mentioned) | median spread **−12px**, 42 uses |
| (inset highlight never mentioned) | 31 uses across 5 projects — a signature |
| "No card-inside-card" · "fewer containers" · "let whitespace do the grouping" | nested panels are the core craft; archidot nests 3–4 levels deep |
| "glow" listed as an AI-slop tell | `glow` classes in 6 projects; ecart's CTA glow is a 3-layer recipe |
| ticker / marquee treated as a cheap tell | `marquee` in 8 of 30 projects |
| "quart-out `(.25,1,.5,1)` is the default" | signature is expo-out **`(.16,1,.3,1)`** |

The generic prohibitions that **survive** (they are about honesty and access, not
taste): contrast and WCAG minimums, RTL logical properties, real content over
lorem, no invented prices or fake proof, reduced-motion support, focus states.

## 8. What this file does not tell you

It measures *how* things are built, not *what* to build for a given brand. Two
projects can share every number here and look nothing alike — that is the point,
and it is enforced deliberately: identity (palette, typeface, imagery, silhouette)
belongs in a per-brand file, never here. Grammar travels between clients; identity
never does.
