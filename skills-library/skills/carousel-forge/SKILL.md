---
name: carousel-forge
description: >
  Design scroll-stopping carousels, covers, posters and social graphics for any
  brand, any industry, any language. A measured visual system reverse-engineered
  from 94 working slides: grid and margins, type scale, colour, photo direction,
  depth layering, image generation, and an audited HTML→PNG renderer.
  Use for any request about designing a post, carousel, cover, poster, slide
  deck or template — and for "this image looks bad", "the text doesn't stand
  out", "fix the typography", "which photo goes with this line", "when do I cut
  the subject out", "the colours are off", "this post looks generic", "make me
  a carousel", "صمّم كاروسيل", "البوست شكله عادي", "الكلام مش بارز".
  Covers Latin and RTL/non-Latin scripts equally.
---

# Carousel Forge

Every number in this skill was **measured** from 94 published slides across
Latin and Arabic accounts. None of it is preference.

**The job:** you are not putting text on a picture. You are building a **frame**
— the image argues the copy, the copy sits in the one region that can hold it,
and a fixed chassis makes eight different images read as one account.

```text
diagnose → angle → hook → chassis → choose images → probe → typeset → render → look
```

> **Writing the content itself** (hooks, slides, captions) → [references/copy.md](references/copy.md)
> **No idea yet** → [references/ideas.md](references/ideas.md)
> **Arabic, Hebrew, Persian, CJK** → [references/scripts-rtl.md](references/scripts-rtl.md)

---

## The gate — don't open an editor before these are answered

| Question | If you don't know |
|---|---|
| **Focus** | "I help [who] who feels [tension] by showing them [path]" |
| Audience and awareness stage? | Assume problem-aware, and write the assumption down |
| Pain + objection? | This is the hook's raw material and the breaker slide |
| **Which three colours?** | ground / ink / accent — one accent only |
| **Which two typefaces?** | display + utility. A third is a mistake |
| **What is the KIT?** | shell · chrome · ground · eyebrow · accent · anchor → [references/grammar.md](references/grammar.md) |
| **What is the vibe lock?** | Six levers in `vibe.json` + signature + anti-style |
| Funnel stage + the single CTA? | TOF / MOF / BOF — the stage sets the CTA ceiling |

**And the six that decide whether this brand looks like the last one** — these
are architecture, and colours are only paint. → [references/library.md](references/library.md)

| Question | Choose from |
|---|---|
| **Content archetype?** | System · Formula · Teardown · Confession · Template · Vault |
| **Layout family?** | F1–F12. **Which family does the COVER open on?** |
| **Colour strategy?** | restrained · committed · full-palette · **drenched** |
| **Scale register per slide?** | Dossier · Editorial · Chapter · Cover · Specimen · Monument · Ghost |
| **Alignment + density?** | centred · ragged · edge-anchored · and the **% left deliberately empty** |
| **Anti-reference?** | The look this brand must NOT resemble |

The colour/type/kit/vibe rows are decided **once per brand**. The archetype
and the scale register are decided **per post and per slide**.

> **The convergence test.** Put this brand's kit beside the last brand's. If
> the archetype, layout family, colour strategy and scale arc all match, one of
> them has not been designed — it has been rendered. Change one before you
> open an editor.
>
> **And the harder one — the silhouette test.** `shell + chrome + ground` is
> the outline of the post at feed size. Two brands may share an eyebrow; they
> may not share a silhouette. `init.mjs` keeps a roster and refuses to hand you
> a combination another brand already owns — an unspecified kit is **not a
> default**, it is chosen to miss everything in the roster.

**Read the client's identity spec before choosing.** The kit is often
*dictated*, not picked: "the symbol in a fixed corner, never the full lockup"
rules out `chrome:rail` outright; "the accent is for links and guidance only"
means `accent:bar`, not `accent:text`.

---

## The seven laws

### 1. The rule of three
```text
ground   60–92%   one background
ink       6–12%   type colour
accent    1–10%   the hit colour
```
- The accent lands on **one word** or **one shape** per slide. Not two.
- **Pull the accent from the image**, don't invent it (`probe.mjs` prints the palette).
- **Grade the image into the palette** before placing it — duotone or a warm/cool push.
  A raw photo on a brand background looks pasted on, always.
- **Grain on any flat fill** (3–10%). Without it a solid colour reads as a
  default swatch, not a decision.
- **Ban the accent entirely on one slide or two.** Its absence signals harder
  than its presence.

→ [references/color.md](references/color.md)

### 2. The chassis is fixed **within** a brand and **chosen** per brand
Both halves matter, and the second one is the half that gets skipped.

**Fixed within a brand:** one chassis that does not move a single pixel across
the deck. That is what makes eight slides read as one document.

```text
chrome          y 5.3–6.5%   ·  side margins 7–10%
headline        optical centre y 27–38%  (mostly 31–32%)
dead zone       last 8–17%   ← feed caption and button bar
```
- **Two independent margins:** chrome at 9.5%, content column at 13–28%.
  Same margin for both = template. Different = designer.
- **Headline locked to the same height** on every interior slide.

**Chosen per brand:** the chassis is a **kit**, not a constant. Six axes,
25,920 silhouettes. A skill that ships one chassis produces one design in N
colourways — fine if you are the only client, fatal the moment you have two.

```text
shell    card · full · frame · panel · passe · band
chrome   rail · foot · corner · spine · index · none
ground   glow · flat · paper · rules · vignette · wash
eyebrow  wobble · caps · rule · chip · numeral · none
accent   text · mark · rule · bar · none
anchor   top · third · mid · base
```

The rail is **one option, not the system.** So is the notched card, and so is
the glow. Set the kit in `window.KIT` at the top of `data.js`; put the brand's
colours, fonts and geometry in **`brand.css`**.

> **Never edit `style.css` to change how a project looks.** It holds the
> grammar and no brand decisions at all. If two brands need the same override,
> that is a *missing variant* — add it to `style.css` as a new named variant so
> the next brand can choose it, never as a changed default. That one rule is
> what stops the template re-forming.

→ [references/grammar.md](references/grammar.md) ·
[references/composition.md](references/composition.md)

### 3. No copy on a face. The CTA is not a portrait.
Two separate rules. Both were broken in real work and rejected.

**(a) Never put copy over a face.** Not a headline, not body, not the keyword.
A face is the highest-attention region in any frame — copy placed on it fights
it and loses, and both end up unreadable. If the image has a face, the copy
sits **somewhere else entirely**, not over it with a shadow.

**(b) The default CTA slide has no image.**
```text
✅ flat dark ground · zero effects · the word, large, centred
❌ a portrait behind it with copy on top
```
The abrupt subtraction is what brakes the swipe. If an image is unavoidable on
a CTA, **the image itself must be the invitation** (an empty chair, an open
hand) and the copy sits in genuine void, far from the subject.

> Reference accounts show a "the face appears once, at the CTA" pattern.
> It is **not** the default here — it was tested and rejected. Only on request.

### 4. Copy never sits on a mid-tone. Ever.
The most-broken rule in bad work.

```text
✅ clean negative space           ✅ the darkest 25–30% of the image
✅ a hard solid bar               ❌ a soft gradient scrim
```
- **Solve with placement, not with a layer.** Every designer in the reference
  set refused the gradient scrim. If no region works, **fix the image**
  (outpaint headroom, push the horizon down) or make the slide a designed
  background.
- Wardrobe and material work as free scrims: a dark jacket, a matte surface.
- **Compose for the gap:** push the horizon to 60–72% and the sky becomes the
  type shelf. "Copy in the sky, objects on the ground" — the horizon is the
  only real grid line.

**Probe before you write a coordinate:**
```powershell
node scripts/probe.mjs image.png
```
Prints a map: where white works, where black works, where it's mid-tone
(forbidden), where it's busy.

### 5. The image argues the copy — it doesn't decorate it
| Copy says | What the image did |
|---|---|
| "cuts your costs" | a hand pressing down, with "costs" directly under the fingers |
| "small type dies" | a figure so small in the frame it is genuinely unreadable |
| "clarity" | a black forest opening into a lit clearing |
| "start at the hardest moment" | a person with a box over their head — no context at all |

**Camera angle is a meaning decision:** top-down flattens a room into a 2D
graphic surface, so copy sits on it without looking pasted · low angle is
authority · very wide with something thrust forward breaks the screen ·
a tiny subject in a vast frame is isolation.

**Gaze:** default to hidden, turned away, or in profile — an anonymous subject
lets the reader stand in, and the copy stays the hero. Objects have a gaze too:
point the spout, the blade, the long axis at the headline.

**Tag every slide before generating:** mood + energy + shot type, and **never
repeat a shot type twice in a row**. Energy runs low → building → high →
**zero at the CTA**.

→ [references/photo-direction.md](references/photo-direction.md)

### 6. Depth: the gap before the occlusion
Three ways to interlock copy and subject, best first:

**1. The gap in the sentence** — split the line in two on the same Y and leave
an engineered hole for the subject to stand in. Full depth, **zero occluded
letters**.

**2. Cut-out over the copy** — only under four conditions:
- Occlusion touches **counters and stem bottoms only**, never the mark that
  distinguishes the letter.
- **First and last letter stay whole** — they set the word's shape.
- **Hard colour separation** between subject and letter, or the brain reads one
  muddy layer.
- A **heavy** weight, so the skeleton survives.

**3. Clean space** — the default for explainer slides.

> **Depth is a cover tool.** In every reference, explainer slides are completely
> flat. Spend interlock on the cover or the CTA, nowhere else.

**And let one large object bleed off an edge** in every frame. Nothing fully
contained.

### 7. Rhythm
**Identical energy on every slide reads as one long slide.** People leave.

- **Change the background treatment every slide** — photo → designed → flat
  colour → mono → paper. Never the same treatment twice in a row.
- **Flip the luminance hard at least twice** across ten slides.
- **Break the template exactly once**, at the emotional slide, **by subtraction**:
  drop the number, the image, the accent, and invert which typeface is large.
- **The comparison device must argue the point.** "Six numbered rules" → six
  numbered discs. "Before and after" → two overlapping cards. Decoration
  without an argument is failure.

### Rhythm **between** posts — the form
Law 7 governs one carousel. This governs the account, and it is the law most
often skipped: **a palette swap is not a design.** Six posts in one layout with
six accent colours are one design shown six times.

**Lock:** chassis, palette, type scale, margins.
**Vary:** the *structure*.

Eight forms came out of the teardown — `frame` · `bleed` · `poster` · `doc` ·
`spec` · `compare` · `tile` · `sculpt`. They differ in where the chassis sits,
whether there is a card at all, and what carries the argument. Pick one per
post and **rotate across the grid**.
→ **[references/archetypes.md](references/archetypes.md)**

And the image itself is a second axis: **photoreal is one option out of eight.**
`char3d` · `cartoon` · `collage` · `riso` · `soft3d` · `render` · `neon` all
carry a hook, and a 3D caricature or an illustration gives you a character with
**no likeness risk at all**.
```powershell
node $K\gen.mjs --style=char3d --out=... --prompt="..."
```

> **Cover-collision test:** put the last three or four covers side by side.
> **If two could be mistaken for the same design with different words, redo one.**
> `COVERS.png` catches "off-brand". It does not catch "all the same".

### Law 8 — the story is told three ways, and most people only write one

> **"Every carousel that gets saved tells its story three ways at once: what you
> say, how it's built, and how it looks. Most people only write the words.
> That's why they flop."**

**SAY** = archetype + hook + copy · **BUILT** = beat structure + slide arc ·
**LOOKS** = layout family + colour strategy + scale register.

Decide all three explicitly, per brand and per post. When two brands share a
layer, deliberately break it on one of them. The failure mode this law exists to
stop is not ugliness — it is **sameness**, and sameness is invisible from inside
a single post. It only shows on the grid.

**The spine test, for the deck:** cover any slide. If the next one still makes
sense without it, the spine is broken.
**The register test, for the scale:** write out the register of each slide. If
it reads `7 · 7 · 6 · 7 · 6`, there is no arc — there is a template.

→ [references/library.md](references/library.md) · [references/scale.md](references/scale.md)

Run the test, don't imagine it:
```powershell
node $K\sheet.mjs --glob="./0*" --cell=250    # one row per post, whole grid
```
**Every post must open on a different form.** The lead slide is what the feed
shows, so six posts that all open `promise` are six identical posts however
different the interiors are. Six worked spines, all different:

| brand | spine |
|---|---|
| clinic (AR, light) | `promise` → `doc` → `spec` → `grid` → `cta` |
| language school (EN, paper) | `compare` → `poster` → `teach` → `doc` → `cta` |
| reminders (AR, dark) | `spec` → `poster` → `teach` → `spec` → `cta` |
| ceramics (EN, light) | `cover` → `compare` → `spec` → `tile` → `cta` |
| security (EN, black) | `poster` → `doc` → `grid` → `compare` → `cta` |
| gym (AR, dark) | `bleed` → `bleed` → `grid` → `poster` → `cta` |

Note what carries the variety when a brand has **no photography at all**: three
of those six have zero images. The form is doing the work, not the art
direction. → `stress-test/SPINES.png`

---

## Typography — the numbers

```text
typefaces          2 maximum   (display + utility)
hero word width    74–79% of canvas width
leading            0.78–0.92em  ← lines touch and read as one shape
tracking           −1% to −3% on display
```

**Display size is not one number — it is a register, chosen per slide.**
The 94 specimens span **2.2% → 47%** of frame height. A deck that never leaves
one band reads as one long slide, whatever the colours are.
→ **[references/scale.md](references/scale.md)**

| Register | % of height | px @1350 | sizes/slide |
|---|---|---|---|
| Dossier | 2.2–3.5 | 30–47 | 4–6 |
| Editorial | 4–5 | 54–68 | 5–7 |
| Chapter | 6–8 | 81–108 | 4–6 |
| **Cover** | **9–13** | **121–176** | 3–5 |
| Specimen | 15–24 | 202–324 | 2–3 |
| Monument | 28–47 | 378–635 | 1–2 |
| Ghost | 16–31 @ 6–10% opacity | 216–420 | — |

**121px is the floor for anything that opens a deck.** Below it the cover reads
as a paragraph at feed size. Scale up → drop the number of sizes → increase the
empty fraction. Big type in a full frame is loud; big type in an empty frame is
expensive.

**Arabic:** above Chapter register, build the step with **weight and colour, not
size** — keep the ratio between levels inside 1.1–1.9:1. A Monument Arabic
slide is one line at one size.

**Display-to-body ratio changes with the slide's job:**

| Slide type | Ratio |
|---|---|
| cover | 10:1 – 11:1 |
| explainer | 4:1 – 7:1 |
| reference / data | ~3.5:1 — deliberately flat |
| weight-led scripts | 1.1:1 – 1.9:1 |

- **Grotesk** carries instruction and structure. **Serif** carries the emotional
  word and anything meant to be quoted. Never swap those roles.
- **A weight jump inside one headline** is the cleanest emphasis tool: the
  meaning-bearing fragment takes Black, the rest Bold or Light.
- **Case as hierarchy:** Title Case qualifier + lowercase hero word.

→ [references/typography.md](references/typography.md) ·
[references/scripts-rtl.md](references/scripts-rtl.md)

---

## Production

The skill is global. `$K = "$HOME\.claude\skills\carousel-forge\scripts"`

```powershell
# 0) new project — grammar, fonts, brand.css, starter data.js, dep check
#    With no --kit it picks a silhouette no brand in the roster owns.
node $K\init.mjs my-brand
node $K\init.mjs my-brand --kit=shell:passe,chrome:spine,ground:flat

# 1) write vibe.json FIRST — six levers. Without it every image drifts.
#    Check the assembled prompt before spending anything:
node $K\gen.mjs --out=assets/gen/a.png --ref=you.png --preset=face-lock-back --prompt="..." --dry

# 2) generate. Covers first, approve them, then build interior slides.
node $K\gen.mjs --out=assets/gen/a.png --ref=you.png --preset=face-lock-back --prompt="..."
node $K\probe.mjs --set assets/gen/*.png    # did they come from one shoot?

# 3) grade into the palette
node $K\grade.mjs assets/gen/a.png --out=assets/gen/a.png --preset=filmic

# 4) read the image before typesetting
node $K\probe.mjs assets/gen/a.png

# 5) cut the subject out (only if you need depth)
py $K\cutout.py assets/gen/a.png --keep-largest --feather=1.5

# 6) render
node $K\render.mjs --post=01 --slide=3      # fast iteration
node $K\render.mjs
```

`render.mjs` runs an **automatic audit**: copy outside the card, clipped lines,
collisions with the chassis, stale slides left over from a longer draft, and —
by sampling the rendered pixels behind every text block — **low contrast and
busy backgrounds**. That last one catches "the copy is invisible against the
photo".

**But the audit measures geometry and contrast, not taste.** It cannot see a
ring that misses its word, a numeral that reads as a smudge, or 300px of dead
ground under a short slide. **Look at the PNG.** Every defect in this paragraph
shipped past a clean audit at least once.

```powershell
# 7) look at the whole thing at once
node $K\sheet.mjs                              # one row per post
node $K\sheet.mjs --glob="./0*" --cell=250     # one row per project
```
`sheet.mjs` is the **form audit**. Slide-by-slide review cannot show you that
two posts share a silhouette — a contact sheet shows it instantly. If two rows
have the same shape, you have one design in two colourways. → below.

**Never ask a model to render text inside an image.** Generate a clean plate and
set the type in code.

→ [references/pipeline.md](references/pipeline.md) · [template/](template/)

---

## Before you call it done

**Architecture — run this FIRST; it is the one that catches sameness**
- [ ] **Kit set in `window.KIT`?** Does `shell/chrome/ground` differ from every
      other brand in `roster.json`?
- [ ] Did you read the client's identity spec *before* choosing the kit?
- [ ] Colours, fonts and geometry in **`brand.css`** — and `style.css` untouched?
- [ ] If you changed a shell: **re-measured every `hsize`?** `passe` and `panel`
      shrink the column, and a headline that fit before will clip.
- [ ] Archetype named, and different from the last post?
- [ ] Layout family named (F1–F12)? Does the cover open on a different family than the last three covers?
- [ ] Colour strategy chosen deliberately — not `restrained` by reflex?
- [ ] **Scale registers written out per slide.** Do they flip at least twice?
- [ ] Any cover below **121px** (9%)? Then it is not a cover.
- [ ] Anti-reference written down?

**Structure**
- [ ] One accent colour, on one word or shape per slide?
- [ ] Chassis identical to the pixel across every slide?
- [ ] Headline at the same height on interior slides?
- [ ] Last 12% empty (feed caption zone)?
- [ ] Two typefaces, 5 styles or fewer per slide?

**Image and copy**
- [ ] Ran `probe.mjs` and placed copy on a valid region? **No mid-tone?**
- [ ] **No copy over a face?**
- [ ] Every image **argues** its copy rather than sitting behind it?
- [ ] All images graded into the palette? Grain on the flat fills?
- [ ] If interlocked: occlusion on counters only, first and last letters whole?

**Rhythm**
- [ ] Background treatment changes every slide? Two luminance flips?
- [ ] **No shot type repeated twice in a row?**
- [ ] Template broken exactly once, by subtraction?
- [ ] **Last 3 covers side by side — could any two be confused?**
- [ ] `probe.mjs --set` — do the images read as one shoot?

**Last**
- [ ] **Did you look at `PREVIEW.png` with your eyes?**
- [ ] Did you look at `COVERS.png`? People follow the grid, not the post.
- [ ] Downscaled to 350px — is the headline still readable? That is feed size.

---

## References
- [references/grammar.md](references/grammar.md) — **the six axes that decide the silhouette.** shell · chrome · ground · eyebrow · accent · anchor, every variant with what it says and when to avoid it, the collision rule, four proven kits, and how to add a variant without re-creating the template. **Read this before `init.mjs`** — it is the difference between designing a brand and recolouring the last one
- [references/library.md](references/library.md) — **the 94 specimens, read one by one.** Content archetypes, the six narrative beats + spine test, hook taxonomy, twelve layout families, the five premium rules, the CTA bank, and the per-brand kit fields. **Read this before starting any brand** — the rest of this skill is the *average* of those 94; this file is the *variance*, and the variance is what stops every brand coming out identical
- [references/scale.md](references/scale.md) — **the seven scale registers**, measured 2.2%→47%. Read before setting a single `hsize`
- [references/archetypes.md](references/archetypes.md) — **the eight post forms** and the image-style axis
- [references/ideas.md](references/ideas.md) — where the idea comes from: story mining, audience gaps, signals, kill-off selection
- [references/composition.md](references/composition.md) — grid, margins, safe zones, depth and cut-outs
- [references/photo-direction.md](references/photo-direction.md) — angles, gaze, the vibe lock, AI faces, faceless brands
- [references/typography.md](references/typography.md) — scale, pairing, hierarchy
- [references/scripts-rtl.md](references/scripts-rtl.md) — Arabic and other non-Latin scripts, mixed-script rules, BiDi tooling
- [references/color.md](references/color.md) — the rule of three, grading, grain
- [references/copy.md](references/copy.md) — hooks, slide copy, CTA, caption
- [references/pipeline.md](references/pipeline.md) — the scripts and the template
