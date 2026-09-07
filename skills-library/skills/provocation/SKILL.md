---
name: "provocation"
description: "Edward de Bono's Provocation (Po) technique — state something deliberately wrong or absurd about the problem, then extract useful \"movement\" from it instead of judging it. Use when a constraint feels unbreakable, when every design converges on the same shape, or to escape \"the way it's always done\". Triggers include \"provocation\", \"po\", \"absurd statement\", \"deliberately break the rule\", \"the constraint feels unbreakable\", \"sacred cow\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Provocation (Po)

## What this technique does

State something deliberately wrong, impossible, or absurd about the problem — then refuse to judge it. Instead, ask what *useful movement* the statement creates: the principle hiding inside it, what would happen moment-to-moment if it were true, what that makes different from today. The absurd statement is not a proposal; it is a stepping stone you stand on only long enough to reach somewhere you could not have walked to directly. It works because judgment and movement are opposite mental motions, and every honest constraint you carry is also a wall you have stopped seeing.

Source: Edward de Bono, *Po: Beyond Yes and No* (1972) and *Serious Creativity* (1992).

## Workflow

### Step 1: Confirm the target

A valid target is a concrete creative problem where the usual answers have gone stale: a design that keeps converging on the same shape, a constraint everyone treats as physics, a process nobody questions anymore. Good phrasings: "reinvent how we onboard new users", "our pricing page always ends up looking identical to competitors", "the approval step feels untouchable — challenge it". If the target is unclear, ask one focused question — "What's the problem, and which constraint or convention feels most fixed?"

Refuse requests to *perform* analytical work — debugging, reviewing code, implementing a change — and suggest an analytical approach instead. Redesigning or ideating *about* such a process is a valid creative target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Surface the rules

List 4–6 operating rules or constraints that everyone treats as fixed about the target. Write them as flat declaratives, not questions — the things so obvious nobody says them out loud. These are the walls. Each one is a candidate to break, invert, or exaggerate in the next step. If you cannot name at least four, the target is probably too vague; go back to Step 1.

### Step 3: Generate 4–6 provocations

Draw across the five classical operations. Prefix each with `Po:` and keep it to one line. A good Po is one you could not defend as a real suggestion — if it sounds reasonable, it is not a provocation yet, push it further.

- **Escape** — drop a rule entirely. Take a rule from Step 2 and state its absence as fact. `Po: the checkout has no prices.`
- **Reversal** — invert a relationship. Flip who does what to whom, or which direction something flows. `Po: the user reviews the software's work.`
- **Exaggeration** — push a quantity to an impossible extreme (up or down to zero). `Po: onboarding takes three seconds.`
- **Distortion** — scramble the normal sequence or swap the roles in it. `Po: you pay the invoice before the work is scoped.`
- **Wishful thinking** — state a fantasy as accomplished fact. `Po: the page reads the visitor's mind.`

Cover at least three of the five operations across the batch. Do not run more than eight in one batch.

### Step 4: Movement, per provocation

Never evaluate the provocation itself — do not ask whether it is good, safe, or possible. That is judgment, the wrong motion. Instead extract movement three ways:

- **(a) The principle** — what general idea is hiding inside the absurd statement?
- **(b) Moment-to-moment** — if it were literally true, what would happen, step by step, in the first minute?
- **(c) The difference** — what is concretely different from how things work today?

Then shape any live thread into a real idea. Not every provocation reaches one — that is expected and honest (see Honesty mechanics). Show the movement work, not just the idea it produced.

### Step 5: Meta-pattern scan

Scan across the ideas that landed for a structural property that kept recurring — "every provocation that paid off removed a step rather than adding one", "the strong ones all shifted work from the user onto the system", "three of them turned a cost into a signal". State the structural insight explicitly. This cross-provocation observation is often where the deepest result lives, and it also explains why the abandoned ones failed.

### Step 6: Honest ranking

Pick the 2–4 sharpest directions and rank them. Say which feel weak, and why. Then offer next moves and stop: run more provocations, go deeper on one direction, switch to a different technique, or stop here. Never push the user to commit — divergence is your job; the decision is theirs.

## Honesty mechanics

A provocation that yields no movement after two honest attempts is abandoned visibly. Show it, for example:

`Po: customers pay us to leave — no movement found. Moving on.`

Roughly 1 in 3 provocations will not pay off. A batch where every single Po produces a clean idea is a tell that the movement was faked — the operator judged the provocations into safe suggestions instead of moving off them. Show the failures; they are what proves the rest are real.

**When the batch itself fails.** If almost nothing moves, the problem is upstream of the provocations. Do not write more of them. Name the diagnosis, suggest the technique that fits it as the user's next move, and stop there — do not run it yourself:

- Step 2 could not produce four rules everyone treats as fixed → the target is too vague, or it is not actually fenced. Suggest `random-stimulus`, which needs no constraint to push against.
- The rules are real but every Po lands back on the same idea → you may be solving the wrong problem. Suggest `concept-fan`, which climbs to the concept the target serves.

## What NOT to do

- **Don't defend or attack the provocation.** It is not a proposal. Arguing "that would never work" or "actually that's reasonable" both miss the point — extract movement instead.
- **Don't generate polite, plausible provocations.** If a Po could pass as a genuine suggestion, it is not a provocation. Push it until it is clearly absurd.
- **Don't skip the movement structure.** Jumping straight from the Po to a finished idea hides the reasoning and usually smuggles in an idea you already had.
- **Don't run more than 8 provocations per batch.** Quality drops and the movement work gets rushed.

## References

- Provocation templates — the five operations, with fill-in templates and worked one-line examples: see Appendix A below.
- Worked example — a real session showing the full shape, abandonment included: see Appendix B below.

---

## Appendix A: Provocation templates

# Provocation Templates: The Five Operations

Each operation is a different way to manufacture an absurd statement from an ordinary one. Start from a rule you listed in Step 2, apply the operation, and write the result as a flat declarative fact prefixed `Po:`. The statement should be something you could not defend as a real suggestion — that is the signal it is a provocation and not a proposal.

Use the fill-in templates as scaffolding, then break the scaffolding. Fifteen worked examples follow, all from software and product contexts.

---

## 1. Escape

**Definition.** Take a rule everyone treats as necessary and simply state its absence as fact. Do not soften it into "less of X" — remove X entirely. Escape attacks the rules you did not even notice you were obeying.

**Template.** `Po: [system] has no [assumed component].`

**Examples.**
- `Po: the app has no login.`
- `Po: the search box returns no results, ever.`
- `Po: the settings screen has no save button.`

---

## 2. Reversal

**Definition.** Find a relationship with a direction — who serves whom, what flows from where to where, who has authority over what — and run it backwards. Reversal is not "do the opposite thing"; it is "swap the two ends of one specific relationship".

**Template.** `Po: the [normally passive party] now [acts on] the [normally active party].`

**Examples.**
- `Po: the customer sets the price and the company decides whether to accept.`
- `Po: the database asks the application what it should store.`
- `Po: the reader edits the article while writing it themselves.`

---

## 3. Exaggeration

**Definition.** Take any quantity — time, count, size, cost, distance — and push it far past the possible, either toward infinity or down to exactly zero. The extreme strips away the assumptions that only held at normal magnitudes.

**Template.** `Po: [quantity] is [zero / a billion / instantaneous].`

**Examples.**
- `Po: the report takes zero seconds to generate and arrives before you ask.`
- `Po: every user has exactly one million teammates.`
- `Po: the form has ten thousand fields.`

---

## 4. Distortion

**Definition.** Keep all the pieces of a process but scramble their order, or swap the roles the pieces play. The sequence we use feels inevitable; distortion asks what the pieces would mean in a different arrangement.

**Template.** `Po: [later step] happens before [earlier step].` — or — `Po: the [thing] plays the role of the [other thing].`

**Examples.**
- `Po: you ship the feature first and design it afterward.`
- `Po: the error message writes the code that caused it.`
- `Po: onboarding happens on the last day of use, not the first.`

---

## 5. Wishful thinking

**Definition.** State a pure fantasy as if it had already been achieved. Not "wouldn't it be nice if" — a flat present-tense claim that the impossible is done. Wishful thinking names the outcome you would want if physics and budgets did not apply, then movement asks what fraction is actually reachable.

**Template.** `Po: [impossible desired outcome] already happens, automatically.`

**Examples.**
- `Po: the product knows what the user wants before they open it.`
- `Po: bugs fix themselves the moment they are written.`
- `Po: the invoice pays itself the instant value is delivered.`

---

## Quick reference

| Operation | Move | One-line test |
|---|---|---|
| Escape | Remove a rule entirely | "What if this component just isn't there?" |
| Reversal | Swap the two ends of one relationship | "What if it ran backwards?" |
| Exaggeration | Push a quantity to zero or infinity | "What at a million? What at zero?" |
| Distortion | Reorder or re-role the steps | "What if step 5 came first?" |
| Wishful thinking | State the fantasy as done | "What if the impossible were already true?" |

---

## Appendix B: Worked example

# Worked Example: Making a README Demo Section Impossible to Scroll Past

A real session. The target was a design problem with a stale convention baked into it:

> "How do we make this repo's README demo section impossible to scroll past?"

Six provocations were generated across four of the five operations (Escape, Reversal, Exaggeration, Distortion, Wishful thinking). Four produced movement; one was abandoned after two honest attempts; one was a half-hit. The abandonment is shown, because it is the point.

---

## Opening framing

State briefly why the technique works, once, before the first provocation:

> The phrase "demo section" already contains every assumption that makes README demos forgettable: a block of markdown, below the intro, that the reader scrolls at their own pace and past at their own pace. Staying inside that frame only produces "make the GIF nicer". A provocation breaks the frame by asserting something false about it — no demo, reader-runs-it, ten thousand demos — and the useful part is never the false statement itself. It is the movement the statement forces: the principle underneath, what would happen moment to moment, and what that makes different from the README we have.

---

## Surfacing the rules

The things so obvious nobody writes them down:

1. The demo is static — markdown rendered on a page, a GIF or a code block.
2. It sits in reading order: intro, then badges, then demo, then install.
3. It shows the tool working — one representative example.
4. The reader controls the pace and can scroll past at any moment.
5. It is generic — the same demo for every visitor.
6. The reader is skimming, deciding in seconds whether to keep going.

Each of these is a wall to break in the next step.

---

## The provocations, with movement

### Po: the README has no demo section. (Escape)

Drops rule 1 and 3 entirely.

- **Principle:** if there is no demo *block*, then the demonstration has to live somewhere else — either everywhere or nowhere. "Everywhere" is the interesting branch.
- **Moment-to-moment:** the reader lands on the README and there is no GIF to scroll to. Instead the first code fence *is already the tool doing something real* — the very first thing under the title is output, not prose.
- **Difference:** today the demo is a destination you scroll to and can therefore scroll past. With no section, the demonstration is dissolved into the intro itself — the reader is inside the demo before they know one was coming.

**Idea: dissolve the demo into the first screen.** No "## Demo" heading at all. The headline is replaced by a single line of real output — the most striking thing the tool produces — rendered before any description of what the tool is. You cannot scroll past a demo that occupies the position of the title. Strong: it removes the scroll-past problem by removing the thing that gets scrolled past.

### Po: the reader performs the demo and the README watches. (Reversal)

Inverts rule 4 — the reader is normally the passive audience.

- **Principle:** engagement that the reader *produces* cannot be skimmed the way engagement that is *served* can. If the reader's own action is the demo, there is nothing to passively scroll past.
- **Moment-to-moment:** the reader reaches the demo and it asks them for one input — paste your own file, your own URL, your own snippet — and the README section shows the tool's result *on their thing*, not on a canned example.
- **Difference:** today every visitor sees the same generic example and correctly assumes it was cherry-picked. A demo run on the reader's own input is not cherry-picked, and the reader has now spent effort, which is the strongest anti-scroll force there is.

**Idea: a "paste yours" line.** A README cannot execute code, but it can carry a single copy-paste one-liner positioned exactly where the demo GIF would be: "Run this on *your* repo: `<one command>`". The demo the reader can't scroll past is the one they run in their own terminal ten seconds later. Strong, and it reframes the whole section from "watch ours" to "try yours".

### Po: the demo takes zero screen space. (Exaggeration → zero)

Pushes rule 1's footprint to nothing.

- **Principle:** a demo with zero height cannot be scrolled past because there is no scrolling involved — it has to communicate in the glance the reader already gives the top of the page.
- **Moment-to-moment:** in the half-second before the reader decides to scroll, they have already seen the entire demo, because it is one line wide and zero paragraphs tall.
- **Difference:** today the demo asks for a scroll and a play. A zero-space demo asks for nothing and lands in the pre-scroll glance.

**Idea: the one-line before/after.** A single line: `input → output`, the most dramatic transformation the tool makes, rendered as one code line at the very top. It costs no scroll. Lands, but it is really the same insight as the Escape idea — dissolve the demo up into the glance — arriving from a different direction. Kept, noted as convergent.

### Po: the reader sees the demo's result before the demo runs. (Distortion)

Scrambles the order in rule 2 — result normally comes after setup.

- **Principle:** leading with the outcome and withholding the mechanism creates a gap the reader wants closed, and a reader who wants something cannot skim past it.
- **Moment-to-moment:** first thing on the page is a surprising finished result with no explanation. The reader's next thought is "wait, how" — and the *how* is the rest of the README.
- **Difference:** today the README explains, then demonstrates, so by the demo the curiosity is already spent. Reversing it spends nothing up front and makes the demo the hook rather than the reward.

**Idea: result-first framing.** Open with the punchline output and a one-word caption, then "Here's how" as the pivot into everything else. This is a *sequencing* idea, and it composes with the two above rather than competing — it tells you where to put the dissolved demo (first, unexplained), not what the demo is. Lands as a structural rule for the section.

### Po: the demo section is ten thousand demos long. (Exaggeration → infinity)

Pushes rule 3's "one example" to an absurd count. This is the one I tried to make pay and could not.

- **First attempt — principle:** ten thousand demos means the reader always finds one matching their exact case, so... a gallery? But a gallery is *more* to scroll past, not less. That fights the target directly. The exaggeration pushed toward volume, and volume is the enemy here.
- **Second attempt — moment-to-moment:** what if the ten thousand are not shown but *searched*, one surfaced per reader? That is just the Reversal idea ("run it on yours") wearing a bigger number, or a personalization idea that a static README cannot deliver. Every fit either restates a stronger provocation or requires a runtime the README does not have.

`Po: the demo section is ten thousand demos long — no movement found after two attempts. Moving on.`

Honest reason: "impossible to scroll past" is a problem of *compression* — getting the demo into the glance before the scroll. Exaggerating toward *more* pushes the opposite way, and every attempt to rescue it either inverted back into compression (already covered) or leaned on personalization a rendered markdown file cannot do. It did not fail because the operation is weak; it failed because it pointed away from the target.

### Po: the README already knows the exact problem this reader came to solve. (Wishful thinking)

States rule 5's opposite — perfect per-visitor relevance — as accomplished fact.

- **Principle:** the most un-scrollable demo is the one showing the reader's own pain solved. Total personalization is impossible in static markdown, but the *fraction* that is reachable is choosing the single most common arriving pain and demoing exactly that.
- **Moment-to-moment:** the reader arrives carrying one specific frustration; the first line of the README names that frustration back to them and shows it gone.
- **Difference:** today the demo shows what the tool *can* do (broad, impressive, generic). This shows the one thing most readers *came for* (narrow, specific, recognized). Recognition beats impressiveness at stopping a scroll.

**Idea: demo the arriving pain, not the feature set.** Replace the representative demo with the single most common reason people land on this repo, stated as their words, then solved in one line. Half-hit — genuinely useful as a *selection rule* for what the demo should contain, but it produces a criterion rather than a mechanic, and it depends on actually knowing why people arrive. Kept as a weaker, contingent direction.

---

## The meta-pattern

Four landed, one was a half-hit, one was abandoned. Scanning only what landed — dissolve-into-first-screen, paste-yours, one-line before/after, result-first:

**Every direction that paid off made the demo *smaller and earlier*, never bigger.** The section became one line, or the title itself, or a copy-paste the reader runs, or the unexplained opening result. Not one strong idea added content to the section; all of them compressed it upward into the reader's first glance.

So the structural insight: **"impossible to scroll past" is not an attention problem, it is a position problem.** You cannot win a scroll you have already lost by making the thing you scroll to more compelling — you win by moving the demo *above* the scroll, into the half-second before the reader decides. That single reframe explains all four winners at once.

And it explains the abandonment exactly. `Po: ten thousand demos` was the only provocation that pushed toward *more and lower*, and it produced nothing, because it pointed the opposite way from the pattern the target actually rewards. The abandonment was not noise; it was the negative space that confirmed the shape of the answer.

---

## Honest ranking

Strongest, in order:

1. **Dissolve the demo into the first screen** — no "## Demo" heading; the most striking real output *is* the top of the page. Directly dissolves the scroll-past problem by removing the scrollable target. The before/after one-liner and result-first sequencing are really instructions for *how* to do this one, not rivals to it.
2. **Paste-yours** — a copy-paste one-liner where the GIF used to be, so the un-skippable demo is the one the reader runs on their own input. Highest engagement, lowest control over what the reader then sees.
3. **Result-first sequencing** — open with the unexplained punchline, pivot to "here's how". A structural rule that composes with #1 rather than standing alone.

Weaker:

4. **Demo the arriving pain** — a strong *selection rule* for the demo's content, but contingent on knowing why readers arrive, and it yields a criterion rather than a mechanic.

Abandoned: **ten thousand demos**, which pushed toward volume when the target rewards compression — shown rather than hidden, because pretending it worked would have hidden the very insight that makes the winners make sense.

Next moves, your call: run a fresh batch aimed only at the "paste-yours" branch, go deep on how to write the dissolved first line, switch to a convergent technique to pick between #1 and #2, or stop here.

---

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed.*
