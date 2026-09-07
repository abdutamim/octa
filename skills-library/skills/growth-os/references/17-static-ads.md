# 17 — Static Ads

Statics are scalable cold-traffic creative, not a support act. The right
single static has transformed whole ad accounts — and businesses.

---

## Kill these three myths

| Myth | Truth |
|---|---|
| "Statics are for retargeting / bottom of funnel only" | Nail the awareness level and speak the persona's own social vocabulary and statics reach and convert **cold** audiences — genuinely scalable creative |
| "Only video works for my brand" | A scale problem in disguise: the brand thinks in format, not in messaging that waves a flag at the cold persona |
| "Statics are just for fast message testing before video" | Format-swap winning angles into video, yes — but treating images as a throwaway test bench misses what a great static does on its own |

---

## Layer 1 — strategy (before one line of copy)

Four calls, in order:

1. **One goal per ad.** Offer ad, education ad, or problem-aware targeting —
   pick one. The most common static failure is one ad doing two jobs for too
   many people.
2. **One persona, sharpened.** Not "small business owners" — which type, at
   what **stage**, with what **objection**. Persona dictates the vocabulary,
   the proof required, and the objections the ad must answer. Multi-persona is
   a retargeting luxury; top-of-funnel killers pick one.
3. **Format.** Format decides which copy survives, what the image must carry,
   and which copywriting frameworks are even viable.
4. **Level of marketing awareness.** The bridge that connects persona + goal
   to the framework (`03` owns the levels).

---

## Layer 2 — design

Visual hierarchy: **headline → product / key visual → supporting elements.**
The headline does the targeting.

- One focal point — where the eye lands first. Nine times out of ten make it
  the headline text; sometimes the visual stops the scroll and hands the eye
  up to the copy. Never two focal points, never zero.
- **The one-second comprehension test:** a stranger must know what you sell
  and what you claim within a second, or the ad dies. Clarity beats
  creativity, every time.
- Too many elements = no focal point = scrap it, don't polish it.

---

## Layer 3 — copy (the layer that matters most)

Every winning static does at least one of these:

1. **Be specific.** Exact numbers that carry time, effort, or cost:
   "5 minutes," "under $5," "in one use." Generic always loses. Name the
   demographic, lead with the real outcome.
2. **Call the audience out by name.** Self-selection is a copy mechanic that
   doubles as targeting.
3. **Lean into taboo.** Say what competitors are too polite to say — it stops
   the scroll and bonds with the persona at a deeper level.
4. **Primal desire as the headline.** Status, sex, belonging, safety,
   approval. The product is only the mechanism; the desire is the headline.
5. **Open a curiosity loop.** Show the setup, hide the payoff behind the
   click — and when a loop ad wins, satisfy the curiosity on the landing page
   or the funnel leaks at the next step.
6. **Negative marketing.** Frame the negative; name what the audience is
   afraid of.
7. **Mine golden-nugget testimonials.** Don't write — borrow. Feed the full
   review export to an LLM:

```
Here is a CSV of every review we have. Find the golden-nugget
testimonials that would work hardest in advertising.
```

   Repeat winner-producer.
8. **Show the transformation.** Before/after shown, not described. Before/after
   ads are legal (still, in 2026) — expect tighter platform restrictions only
   around cosmetic procedures and weight-loss products.

---

## Production levels

```
graphic-style    — designed, brand-system led
high-fi          — studio product / lifestyle photography
low-fi creator   — phone-shot, native-feeling  ← chronically forgotten for statics;
                                                  currently moving the needle in accounts
```

Pick the level per concept, then branch into format.

---

## The 7 formats — always in the test rotation

| # | Format | Notes |
|---|---|---|
| 1 | Educational infographic | Masquerades as organic, doesn't feel like an ad; build it as upfront value any persona benefits from — educate, entertain, or narrow choices. Strong top-of-funnel |
| 2 | Headliner | The message IS the ad; the format for taboo angles; Ogilvy print-era lineage — one big headline front and center |
| 3 | Benefits callout | Labeled product shot; test the headline slot with a primal desire or a golden-nugget testimonial |
| 4 | Comparison / us-vs-them | Infamous, still cranking |
| 5 | Transformation | The biggest gap in most ad accounts and the biggest unlock for problem/solution-aware buyers — they just want proof |
| 6 | Grid (multi-SKU) | Apparel and multi-SKU brands; keep on deck for sale periods |
| 7 | Text-only / founder letter | Borrowed from what works organically; clients get nervous, the results don't |

Winning message → re-render across the other formats. Cheapest route to
volume and real creative diversity.

---

## Workflow

```
1 RESEARCH    audit your own ad library + competitor ad libraries
              → creative gap analysis: which awareness levels, which personas,
                which of the 7 formats are missing from rotation?
              → market sophistication check: which mechanisms and identity
                claims are already worn out in this category
2 GENERATE    3 variations per concept — 3 is the sweet spot for quality
3 EDIT LOOP   surgical, specific edits ("remove the em dash", "fix the spelling",
              "beige background, shrink the shirt") until launch-ready
```

- Research first, always — it feeds the generator context and it teaches you
  the gap before you spend.
- Multiply proven ads: take a winner (yours **or a competitor's**) →
  "make 5 variations of this for 3 personas, problem-aware" / "5 variations
  for a solution-aware audience."
- In this stack, generation runs on Gemini image gen + HTML render (`20`) —
  no third-party ad tools.

---

## Use with

- `06` — hooks: the headline is a hook that has to survive standing still
- `07` — the copywriting frameworks the copy layer draws on
- `18` — runs alongside this ref in the ads-creative layer
- `20` — the Gemini + HTML render pipeline that produces these ads
