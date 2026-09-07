---
name: "concept-fan"
description: "Edward de Bono's Concept Fan — climb from the current solution to the concept it serves by asking \"what is this a way of doing?\", then fan out alternative concepts and concrete implementations for each. Use when the current solution might be answering the wrong question, when all options look like variations of one idea, or to widen a decision before committing. Triggers include \"concept fan\", \"zoom out\", \"what is this a way of doing\", \"wrong problem\", \"widen the options\", \"abstraction ladder\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Concept Fan

## What this technique does

Take the current solution and climb one rung up the ladder of abstraction by asking "what is this a way of doing?" The answer is the *direction* — the broader purpose the solution was only ever one route toward. From that vantage, fan out alternative concepts that serve the same direction, then drop each promising concept back down into concrete implementations. The move that unlocks everything is the climb: once you name the direction, the current solution stops looking inevitable and becomes just one branch among several.

Source: Edward de Bono, *Serious Creativity* (1992).

## Workflow

### Step 1: Confirm the target

A valid target is a *current solution or approach* — something already on the table, not a blank page. "We send onboarding emails, is that the right move?" is a target. "Give me onboarding ideas" is not; there is nothing to climb from. If the target is a blank page, ask one focused question: "What's the current approach you'd be climbing up from?"

Refuse requests to *perform* analytical work — debugging, reviewing code, implementing a change — and suggest an analytical approach instead. Redesigning or ideating about such a process is a valid creative target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Climb

Ask "what is this a way of doing?" The answer names the *direction* the current solution was serving. Then ask the same question of that answer, to climb one more rung.

Two climbs maximum. A third almost always lands on something so broad ("deliver value", "help users") that nothing meaningful fans from it — you have climbed off the problem entirely. Stop at two and stay in contact with the ground.

### Step 3: Fan out

At each level you climbed to, list 3–4 *alternative* concepts that also serve the level directly above. These are siblings of the original solution — other ways of doing the same thing the direction demands. Fan at both levels if both produced a usable direction; the higher fan is usually the more surprising one.

### Step 4: Drop down

For the 2–3 most promising alternative concepts, list 2–3 concrete implementations each. This is where the fan earns its keep: an abstract alternative is only interesting once you can see what building it would actually look like.

### Step 5: Mark the obvious branches

Some branches will be things anyone would have thought of without the technique. Mark them explicitly. They are not wasted — they *validate* the fan by showing it maps the real space — but they are not the yield. The yield is the branch you would not have reached from the original solution.

### Step 6: Meta-pattern scan

Scan across the branches that landed and name the structural insight out loud. Often the fan reveals that every alternative shares a hidden assumption, or that the original solution was optimizing the wrong variable, or that two distant branches are secretly the same move. State it explicitly — this is frequently the real payoff, more than any single branch.

### Step 7: Honest ranking

Rank the branches you would actually pursue, say which are weak and why, and offer next moves: climb from a different starting solution, fan wider at one level, drop down further on one concept, or stop. Never push the user to commit. The fan widens the options; choosing among them is the user's move, not the technique's.

## Honesty mechanics

**Prune cosmetic variants, visibly.** A fanned concept that circles back to the original solution wearing a new label is not an alternative — it is the same branch. Prune it and show the pruning, for example: `"faster onboarding emails" is the original with a coat of paint — pruned`. A fan where every branch survives is a tell that the branches were never genuinely different.

**Declare a failed fan.** If both climbs land on concepts too abstract to fan — "deliver value", "make users happy", "grow the business" — the fan has failed. Say so plainly rather than fanning limp branches off an empty direction. When the direction is too abstract to generate concrete siblings, suggest the `analogy` technique instead: reasoning from a parallel domain gives traction where climbing lost it.

## What NOT to do

- **Don't climb more than twice.** A third rung loses contact with the problem and lands on platitudes.
- **Don't fan more than 4 concepts per level.** Breadth kills depth — five thin branches are worth less than three you actually drop down into.
- **Don't treat the fan as a decision tool.** It widens options; the user narrows them. Ranking is honesty about the branches, not a recommendation to commit.

## References

- See the Worked example appendix below — a real session showing the full shape: two climbs, fans at each level, a pruned cosmetic branch, and the meta-pattern.

## Appendix: Worked example

# Worked Example: What Is a README a Way of Doing?

A real session. The target was a current solution someone wanted to widen before committing more work to it:

> "A README is a way of doing... what? Fan out alternatives for making this repo's value graspable in 10 seconds."

Context: the repo is a free, MIT-licensed collection of eight lateral-thinking technique skills plus a router, built for AI coding agents, installable via `npx skills add`. The current solution is "write a good README." The brief already suspects the README might be answering the wrong question — which is exactly the case the fan is for.

---

## Step 1: Confirm the target

Valid. There is a concrete current solution ("a README") to climb from, and the ten-second constraint is real. Not a blank page, not analytical work. Proceed.

---

## Step 2: Climb

**Climb 1 — "A README is a way of doing... what?"**

A README is a way of *orienting someone who just arrived and doesn't yet know what they're looking at*. It answers "where am I, what is this, is it for me." So the direction one rung up is: **orient a newcomer at the moment of arrival.**

**Climb 2 — "Orienting a newcomer is a way of doing... what?"**

You only orient people you want to keep. The ten-second grasp isn't the goal; it's the gate. What it really does is get a stranger to spend the *next* two minutes. So the direction two rungs up is: **convert borrowed attention into a decision to try.**

Stopping here. A third climb would land on "grow adoption" or "deliver value" — true, but nothing concrete fans off it. Two rungs keeps contact with the ground.

The two directions:
- **Level 1:** orient a newcomer at arrival.
- **Level 2:** convert borrowed attention into a decision to try.

---

## Step 3: Fan out

### Fan at Level 1 — other ways to *orient a newcomer at arrival*

Alternative concepts that also orient, besides "a document that explains":

- **A1. Show, don't tell** — a demo the newcomer watches instead of reads.
- **A2. Let them touch it** — orientation by doing one real thing immediately.
- **A3. Orient by resemblance** — anchor to something they already understand ("it's `npx create-*`, but for thinking moves").
- **A4. A better README** — write a tighter, clearer README. *(Marked obvious — see Step 5.)*

### Fan at Level 2 — other ways to *convert borrowed attention into a decision to try*

Alternative concepts that also convert, besides "orient them first":

- **B1. Borrow trust from someone they already trust** — the decision is made by proxy before they read anything.
- **B2. Remove the decision entirely** — make trying cost so little there is nothing to decide.
- **B3. Convert on outcome, not on pitch** — let a result they can see do the persuading.
- **B4. "Faster, punchier README copy"** — sharper hero line, better tagline. *(Pruned — see below.)*

**Pruning B4:** "faster, punchier README copy" is the original solution with a coat of paint — it is still a README doing README things, just louder. It does not serve Level 2 by a *different* mechanism; it is Level-1 A4 wearing a marketing hat. Pruned.

---

## Step 4: Drop down

Concrete implementations for the promising concepts.

**A2 — Let them touch it (orientation by doing):**
- Ship a single copy-paste line that runs one technique on a toy problem right in the terminal, output and all, before any install.
- A `try` command that picks a random skill and runs it on a prompt the user types — orientation *is* the first use.

**A3 — Orient by resemblance:**
- Lead with one line that maps the unfamiliar onto the familiar: "eight thinking moves your coding agent can pull off the shelf, installed like any other package."
- A one-row comparison table: "linter is to code style as this is to idea generation."

**B1 — Borrow trust from someone they already trust:**
- Each skill names its source method and its originator up front, so the newcomer trusts the *method's* pedigree, not the repo's.
- Show the router deciding which technique fits a situation — trust transfers from "this thing reasons about when to use itself" rather than from a claim.

**B3 — Convert on outcome, not on pitch:**
- A ten-second before/after: the same prompt answered flatly, then answered after a technique ran. The gap is the entire pitch.
- A gallery of real yields (a reframed metric, a pruned assumption) with zero prose selling them.

---

## Step 5: Mark the obvious branches

- **A4 ("a better README")** is what anyone would have said without the technique. It is the original solution, refined. Marked obvious. It validates the fan — a tighter README genuinely is one real branch — but it is not the yield.
- **A1 ("show, don't tell" / a demo)** is half-obvious: everybody reaches for "add a GIF." Marked partially obvious; it only becomes interesting when it merges with A2 (touch it) into "the demo is something you *run*, not watch."

The yield is the branches you would not have reached from "a README": **B1** (trust by proxy, before reading) and **B3** (convert on a visible outcome, not on copy).

---

## The meta-pattern

Scanning the branches that landed — A2, A3, B1, B3 — one structure recurs:

**Every strong branch moves the persuasion off the README and onto something the newcomer does or sees for themselves.** A2 makes them run it. B1 makes a trusted source vouch. B3 makes an outcome argue. The README, the original solution, is the *one* branch where the repo has to talk about itself — and it was the weakest surviving branch at both levels.

So the structural insight: **the ten-second constraint is not a writing problem, it is a "don't make them read" problem.** The brief asked how to make the README graspable in ten seconds; the fan says the ten-second grasp happens fastest when there is no README to grasp — when the first contact is a run, a borrowed trust signal, or a visible result. That is exactly what climbing to Level 2 exposed and what staying at "a README" concealed.

It also explains the pruned branch: B4 ("punchier copy") failed because it kept the persuasion *on* the README, which is the assumption every strong branch discarded.

---

## Step 7: Honest ranking

Branches worth pursuing, in order:

1. **A2 + B3 merged — a runnable ten-second outcome.** One copy-paste line that shows a flat answer, then the answer after a technique ran. It orients (Level 1) and converts on outcome (Level 2) in the same motion. Strongest branch; it is the only one that satisfies both directions at once.
2. **B1 — borrow trust from the named methods and their originators.** Cheap, honest, and it works before the reader evaluates the repo at all. Lower ceiling than #1 but almost free.
3. **A3 — orient by resemblance** (`npx create-*`, but for thinking). A strong opening *line*, not a strategy; it makes any of the above land faster rather than standing alone.

Weakest that survived: **A4, the better README itself** — kept only because pretending a clear README has no value would be dishonest, but it is the branch the meta-pattern argues *against* leaning on.

Failed nothing: both climbs produced fannable directions, so the fan did not collapse. If Level 2 had landed on "grow adoption" and refused to fan, the honest move would have been to declare the fan failed and reach for the `analogy` technique instead.

Next moves, your call: drop down further on the runnable-outcome branch, re-climb starting from a *different* current solution (say, "the landing page" instead of "the README"), fan wider at Level 2, or stop here.

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed.*
