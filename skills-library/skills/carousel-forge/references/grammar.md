# The grammar — six axes that decide the silhouette

**The failure this file exists to stop:** a skill that ships one chassis
produces one design in N colourways. Every brand gets the same notched card,
the same three-part rail, the same badge, the same glow. Change the colours and
the fonts and it is still, visibly, the same account. That is fine if you are
the only client. It is fatal the moment you have two.

**The fix:** the chassis is not a constant. It is a **choice**, made once per
brand, from six axes. Colours are paint; these are architecture.

```text
sh-*  SHELL     how content meets the frame
ch-*  CHROME    the persistent identity marks
gr-*  GROUND    the surface treatment
eb-*  EYEBROW   the kicker form
ac-*  ACCENT    how the accent colour touches type
an-*  ANCHOR    default vertical position of the copy block
```

6 × 6 × 6 × 6 × 5 × 4 = **25,920 silhouettes.**

They live as classes on `.slide`, set from `window.KIT` at the top of `data.js`:

```js
window.KIT = { shell:"passe", chrome:"spine", ground:"flat",
               eyebrow:"caps", accent:"rule", anchor:"third" };
```

Resolution is widest-to-narrowest — `window.KIT` → `post.kit` → `slide.kit` — so
a single slide can break the brand shell for one frame. That is Law 7's *break
the template exactly once, by subtraction*, made structural.

---

## Where each decision lives

| File | Holds | Never holds |
|---|---|---|
| `style.css` | the grammar. Every variant of every axis | any brand's colours, fonts or geometry |
| `brand.css` | this brand's colours, fonts, geometry, overrides | anything a second brand would also want |
| `data.js` | `window.KIT` + the copy | styling |

> **The test that keeps the template from re-forming:** if two brands need the
> *same* override in `brand.css`, it is not an override — it is a grammar
> variant `style.css` is missing. Add it there as a **new named variant** so the
> next brand can *choose* it. Never change a default to suit one project.

---

## 1 · SHELL — how content meets the frame

The strongest axis. It changes the outline of the post at feed size, which is
the only scale at which sameness is visible.

| | Says | Reach for it | Avoid it when |
|---|---|---|---|
| **card** | "this is a system, this is software" | build/teardown, SaaS, process accounts | the brand trades on restraint — the notch is a loud signature |
| **full** | "no container, no apology" | one-word covers, drenched colour, fashion | the copy needs an edge to lean on |
| **frame** | "this is a drawing, and it is finished" | galleries, portfolios, editorial | the frame will fight a busy photograph |
| **panel** | "there are two kinds of information here" | data, comparison, bilingual decks | you have nothing to put in the band |
| **passe** | "the emptiness is the product" | luxury, architecture, minimal studios | you have a lot to say — it eats 25% of the width |
| **band** | "argument above the line, support below" | teaching, method, before/after | the lower zone would sit empty |

`--inset` `--insetTop` `--band` `--radius` `--notch` `--matte` `--panelW`
`--split` `--frameIn` tune whichever shell you picked.

> **passe and panel both shrink the usable column.** Re-measure every `hsize`
> after switching to one — a headline that fit in `card` will clip in `passe`.

---

## 2 · CHROME — the persistent identity marks

The rail is **one option, not the system.** It was the default for every brand
and it is the loudest thing in the frame.

| | What it is | Reach for it | Avoid it when |
|---|---|---|---|
| **rail** | date · handle · discipline + badge + footer band | systems, tech, process | the brand's spec forbids a full lockup per slide |
| **foot** | bottom line only | when the copy should own the upper 88% | you need slide-position feedback |
| **corner** | ONE mark, one fixed corner | institutions with a strict identity spec | the mark alone won't identify the account |
| **spine** | vertical letterspaced label up one edge | galleries, tall empty frames, portfolios | the frame is dense — it needs the gutter |
| **index** | `03/06` + a hairline that grows | launches, sequences, long decks | the deck is 3 slides — the counter reads as a boast |
| **none** | nothing; chrome lives on slide 1 and the CTA only | poster series, art-led accounts | the account is young and needs the handle |

`index` is the quiet performer: telling the reader how much is left is the
cheapest thing that holds a swipe.

Set `mark` and `markPos` (`tl` `tr` `bl` `br`) on the post for `corner`.

---

## 3 · GROUND — the surface treatment

| | Reads as | Reach for it | Avoid it when |
|---|---|---|---|
| **glow** | modern, lit, engineered | tech, software, energy | the brand is warm or handmade |
| **flat** | confident, expensive, plain | minimal studios, luxury | you have nothing else carrying the frame |
| **paper** | printed, warm, readable | long text, education | the accent needs to glow |
| **rules** | ruled stock, a copybook, a ledger | teaching, records, method | the type would fight the lines |
| **vignette** | photographic without a photograph | film, story, mood | the copy sits near the edges |
| **wash** | calm, editorial, single sweep | fashion, launches | the frame needs a focal point |

`flat` is the hardest to make look designed and the most expensive when it
works — there is nothing to hide behind.

---

## 4 · EYEBROW — the kicker form

| | Reads as | Note |
|---|---|---|
| **wobble** | hand-drawn, warm, personal | wrong for any brand whose spec bans informal ornament |
| **caps** | editorial, restrained | letterspaced caps on a hairline; no container |
| **rule** | structural | a short accent rule, then the word |
| **chip** | UI, software | use when the brand *is* software, and almost never otherwise |
| **numeral** | documentation | only if the kicker is genuinely a number |
| **none** | — | the copy carries it alone |

`eb-caps` also restyles grid labels — a pill would fight letterspaced caps.

---

## 5 · ACCENT — how the accent colour touches type

| | What happens | Reach for it |
|---|---|---|
| **text** | the accent word changes colour | the default; needs the accent to pass 4.5:1 at that size |
| **mark** | a solid block behind the word, word stays ink | when the accent **fails** contrast as type — gold on burgundy, yellow on white |
| **rule** | word stays ink, a rule sits beneath | the quietest; the only one that survives on light stock |
| **bar** | a bar in the margin, never touching the word | when the spec says the accent is for guidance only |
| **none** | the accent never touches type at all | Law 1's *ban the accent* made structural |

> `mark` and `rule` size themselves to the **ink**, not the line box. `.ln` is a
> block, so its box is the full column — without `width:max-content` the rule
> spans the whole line and reads as a divider. Same trap as the hand-drawn
> marks: measure the glyphs.

---

## 6 · ANCHOR — default vertical position

`top` 190 · `third` 372 · `mid` 500 · `base` 800

Applies only when a slide omits `at`, and only to type-led slides (`promise`,
`teach`, `poster`). Payload slides — `grid`, `doc`, `compare`, `tile` — keep
their own high anchor, because the payload needs the room whatever the brand's
default is.

`third` is the measured optical centre from the 94 specimens (y 31–32%).

---

## The collision rule

**Only `shell + chrome + ground` constitute a collision.** Two brands may share
an eyebrow. They may not share a silhouette.

`init.mjs` enforces this. It keeps a roster at `<skill>/roster.json`, and an
unspecified kit is **not a default** — it is chosen to miss everything already
in the roster:

```powershell
node $K\init.mjs my-brand                              # picks a free silhouette
node $K\init.mjs my-brand --kit=shell:passe,chrome:spine,ground:flat
```

An explicit kit is always honoured, but a collision is reported loudly. Seeding
is from the project name, so a re-run is reproducible.

---

## Four proven kits

Built as a convergence test — four brands, no shared silhouette, rendered and
inspected. → `brand-proof/`

| | تميم | أوتفريد | أركيدوت | دار الليث |
|---|---|---|---|---|
| **shell** | card | full | passe | band |
| **chrome** | rail | index | spine | corner |
| **ground** | glow | wash | flat | rules |
| **eyebrow** | chip | rule | caps | caps |
| **accent** | text | **mark** | rule | bar |
| **anchor** | top | mid | third | top |
| cover register | 9.5% | 23.7% | 13.6% | 6.8% |
| ground luminance | dark | drenched | dark | **light** |

What each kit is *arguing*:

- **تميم** keeps the loud kit on purpose — a teardown account trades on looking
  like a system. This is the one brand allowed to look like software.
- **أوتفريد** has no card at all: the burgundy IS the surface, and a floating
  card would put a border around the one thing that should be unbroken. `mark`
  because gold type on burgundy fails contrast at every size that matters.
- **أركيدوت** uses `passe` so the shell *enforces* the emptiness rather than
  trusting the designer to leave it. `flat` — nothing to look at but the type
  and the room around it.
- **دار الليث** is the case where the kit is **dictated, not chosen**: the
  identity spec says *the symbol in a fixed corner, never the full lockup on
  every slide*, which rules out `rail` outright; *no more than two visual lines
  in one design*, which points at `band`; and *turquoise for guidance only*,
  which is `ac-bar`. Read the client's spec before you pick.

---

## Adding a variant

1. Add the CSS block to the right section of `style.css`, named `xx-yourname`.
2. Add it to the `AXES` table in `init.mjs`.
3. Add a row to the table above: what it *says*, when to reach for it, and when
   to avoid it. A variant with no "avoid it when" has not been thought through.
4. If it needs markup, add it to the `CHROME` map in `template/index.html`.

Never add a variant by changing a default. The whole point is that the next
brand gets to choose.
