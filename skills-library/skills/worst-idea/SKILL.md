---
name: "worst-idea"
description: "Worst Possible Idea (reverse brainstorming) — deliberately design the most terrible solutions to the problem, name the mechanism that makes each one bad, then invert those mechanisms into strong features. Use when ideas all feel timid and safe, when the team is optimizing instead of imagining, or for \"worst idea\", \"reverse brainstorming\", \"what would make this worse\", \"design the disaster\", \"how would we guarantee failure\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Worst Possible Idea

## What this technique does

Ask for the *worst* solution to the problem, not the best. Design solutions that would reliably make things terrible, then dissect each one to find the exact mechanism that makes it bad. Invert that mechanism, and you have a feature. The move works because "what's the best design?" routes through everyone's inhibitions and lands on the safe, obvious answer, whereas "how would we guarantee failure?" removes the fear of being wrong and lets people say things out loud — and every named failure mode is a design principle wearing its opposite.

Source: reverse brainstorming, attributed to Hotpoint's product development practice in the 1950s, and standard in the d.school/IDEO facilitation toolkit as "Worst Possible Idea."

## Workflow

### Step 1: Confirm the target

A valid target is a concrete creative problem stated as something to design or reinvent: an onboarding flow, a pricing page, a landing page, a naming direction, a ritual the team runs. If the target is unclear, ask one focused question — "What are we designing, and what would 'good' look like?"

Refuse requests to *perform* analytical work — debugging, reviewing code, implementing a change — and suggest an analytical approach instead. Redesigning or ideating about such a process is a valid creative target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Generate genuinely terrible solutions

Produce 5–8 solutions that would make the problem *worse*. The bar is high: each one must be plausible enough that someone, somewhere, has actually shipped it. Cartoon evil ("delete the user's files!") is too easy and teaches nothing. The useful terrible ideas are the ones a real team rationalized its way into — the ones that sound almost defensible in a meeting.

Show them plainly. Do not soften them, and do not pre-apologize for them.

### Step 3: Isolate the mechanism of badness

For each bad idea, state in one sentence *why* it is bad — the mechanism, not the symptom. Not "it's annoying" but the structural reason it fails.

> Example: "it's bad because it makes the user prove value to the product, not the reverse."

The mechanism is the whole technique. A bad idea with no articulated mechanism is just a bad idea.

### Step 4: Invert the mechanism, not the idea

Flip the *mechanism* into its opposite. This is not "don't do the bad thing" — that only gets you back to neutral. Inverting the mechanism produces a positive design principle.

> Bad idea's mechanism: "it makes the user prove value to the product."
> Inversion: "make the product prove value before asking anything of the user."

Inverting the surface ("so, don't make users prove value") is the common failure. Invert the underlying force.

### Step 5: Develop the inversions

Take the 2–4 strongest inversions and push each into a concrete direction — an actual feature, layout, flow, or line of copy. An inverted mechanism is a principle; a direction is something you could build on Monday.

### Step 6: Meta-pattern scan

The mechanisms of badness cluster. Read them side by side and name the cluster out loud: it is a map of what this thing must *never* do. Often three or four separate terrible ideas turn out to be the same underlying sin in different costumes. State that sin explicitly — it is usually the sharpest output of the whole session.

### Step 7: Honest ranking, no closure pressure

Rank the surviving directions. Say which are strong, which are thin, and why. Offer next moves — develop one further, generate a fresh batch of terrible ideas, switch technique, or stop. Never push the user to commit.

## Honesty mechanics

**The secretly-clever disqualification.** Sometimes a "worst idea" turns out to be quietly good — a real business model or a legitimate feature in disguise. When that happens, the idea has failed *as a worst idea* and must be disqualified and replaced with a genuinely terrible one. Say so out loud:

> "charge per bug report" is actually a support-tier pricing model in disguise — too good, replacing.

This keeps the batch honest. If nothing in the batch makes you wince, the batch is fake.

**Dead mechanisms.** Not every mechanism inverts into something useful. Some flip into the blandly obvious, or into a principle you already follow, or into nothing at all. Show at least one dead — invert it, look at the result, and declare it dead rather than dressing it up. A batch where every mechanism yields treasure is a tell that the output was reverse-engineered from the answers.

**When the batch itself fails.** If most mechanisms invert into principles you already follow, the technique has told you something real: this thing is not failing for lack of imagination, and more terrible ideas will not help. Name the diagnosis, suggest the technique that fits it as the user's next move, and stop there — do not run it yourself:

- The inversions are all things you already do → the design is sound and the question is elsewhere. Suggest `concept-fan` to check you are solving the right problem.
- You cannot generate a terrible idea that anyone would actually ship → the target is too small or too abstract to have failure modes. Suggest `random-stimulus` for generative range.

## What NOT to do

- **Don't sanitize the terrible ideas.** The wince is the signal. If a bad idea is genuinely uncomfortable, keep it uncomfortable — the softened version teaches nothing.
- **Don't invert the surface.** "Don't do X" is not an inversion of X; it is the absence of X. Invert the *mechanism* underneath X into a positive force.
- **Don't skip the mechanism step.** Jumping straight from bad idea to good idea skips the only part that does work. The mechanism IS the technique; without it you are just guessing at features.
- **Don't force every mechanism to pay off.** Show the dead ones dead.
- **Don't push the user toward a decision.** The technique is divergent; convergence belongs to the user.

## References

- See the Worked example appendix below — a real session showing the full shape, including a dead mechanism and a disqualified idea.

## Appendix: Worked example

# Worked Example: The Worst Possible README

A real session. The target was a design problem stated in reverse:

> "Design the worst possible README for this repo, then invert."

Context: the repo is a free, MIT-licensed collection of lateral-thinking technique skills plus a router skill, aimed at AI coding agents, installable with `npx skills add`. Its README has to make the value graspable fast and show real worked examples — including the ideas that were abandoned, since honest abandonment is part of the pitch.

Nine terrible READMEs were designed. One turned out to be secretly sensible and was disqualified and replaced. One mechanism refused to invert into anything useful and is shown dead. The rest produced the directions at the end.

---

## Opening framing

State briefly why the technique works, once, before the first bad idea:

> Asking "what's the best README?" routes straight through everyone's good taste and lands on the same competent, forgettable answer. Asking "how would we guarantee this README fails?" removes the fear of being wrong — people will cheerfully describe disasters they'd never propose as improvements. Each disaster names a failure mode, and every failure mode is a design principle wearing its opposite. The work is not the bad idea; it's the mechanism underneath it.

---

## The terrible READMEs

### 1. The badge wall

Fourteen CI, coverage, license, downloads, and "built with" badges fill the space above the fold. The first actual sentence is below the screen.

**Mechanism of badness:** it leads with signals of *maintainer* legitimacy instead of answering the visitor's only question — what is this and why should I care.

**Inversion of the mechanism:** the first screen must spend every pixel answering the reader's question, not the maintainer's insecurity.

**Direction:** open with a one-line "what this is" and one concrete before/after, and demote all badges to a single quiet row or the bottom.

### 2. The autobiography

Opens with three paragraphs of origin story — "I kept getting stuck on creative problems, and one evening in a coffee shop…" — before ever saying what the repo does.

**Mechanism of badness:** it orders the content by the *author's* chronology instead of the *reader's* need.

**Inversion of the mechanism:** order every section by what the reader needs next, front to back — value, then proof, then how, then backstory (if ever).

**Direction:** cut the origin story entirely, or move a two-line version to the very bottom under "Why this exists."

### 3. The install-first README

Line one is `npx skills add …`. You are asked to run a command before you know what a skill is or what it will do to your setup.

**Mechanism of badness:** it demands an action from the reader before delivering any of the value that would motivate the action — it makes the reader invest before the product has proven anything.

**Inversion of the mechanism:** the product proves its value before asking the reader to do anything at all.

**Direction:** show a real worked example first (stimulus → idea, or bad idea → inverted feature) so the reader *wants* the tool, and only then give the one-line install. The command lands after the payoff, not before it.

### 4. The exhaustive parameter dump

The README is an auto-generated list of every skill and every one of its parameters — complete, accurate, and impossible to learn from because there is not a single example.

**Mechanism of badness:** it optimizes for completeness over comprehension, assuming the reader wants a reference before they have any mental model to hang it on.

**Inversion of the mechanism:** teach one thing concretely first; make reference material reachable but never the entry point.

**Direction:** one fully worked example up top; a short table of the skills with a one-line "use when" each; full reference behind a link.

### 5. The aspirational README

Describes what the repo *will become* — "a complete operating system for creative cognition" — and documents several techniques that are not actually built yet.

**Mechanism of badness:** it sells the vision instead of the shipped thing, which quietly destroys trust in *every* claim on the page, including the true ones.

**Inversion of the mechanism:** describe only what exists and works right now, so every sentence is verifiable and the whole page earns trust.

**Direction:** document exactly the skills that ship, mark anything planned as explicitly "not built yet" in a separate list, and let the honesty become part of the pitch.

### 6. The highlight-reel README

Shows three worked examples, each a clean triumph where every idea lands and nothing is ever abandoned or disqualified.

**Mechanism of badness:** it hides the failure and abandonment that are the actual product — presenting a fake highlight reel of a method whose whole credibility rests on showing its misses.

**Inversion of the mechanism:** put the misses on stage; the visible failures are the proof the method is real rather than retrofitted.

**Direction:** the featured example must include at least one abandoned idea and one disqualified one, framed as *the* differentiator — "unlike a demo, this shows the ideas that didn't survive."

### 7. The wall of text

One 1,800-word paragraph. No headers, no whitespace, no list. Everything true; nothing findable.

**Mechanism of badness:** zero scannability — it forces linear reading on readers who scan, so the value never surfaces even though it is present.

**Inversion of the mechanism:** structure for the scanner — the value should be reconstructable from headers and first sentences alone.

**Direction:** headers that state conclusions, a bolded first line per section, and a skimmable skills table. (Note: this inversion largely *coincides* with directions already produced by #1 and #2 — it reinforces the cluster rather than adding a new axis.)

### 8. The clever-name README

Every skill is referred to only by an invented brand name with no plain description — the reader must already know the jargon to know what anything does.

**Mechanism of badness:** it assumes shared context the reader doesn't have, so the names gatekeep the content instead of labeling it.

**Inversion of the mechanism:** assume zero prior context; every name is immediately paired with a plain-language "what it does."

**Direction:** whatever a skill is called, the very next words say what it does in ordinary language.

### 9. The no-license README — *disqualified*

Initially filed as terrible: "omit the license entirely so nobody knows if they can use it."

On inspection this is not a *worst-idea* mechanism at all — it's just a missing fact with an obvious fix, and "state the license clearly" is a checklist item, not a design principle. Worse, an omitted license doesn't even reliably make a README *feel* bad; readers skim past it. **It fails as a worst idea because it isn't plausibly something a thoughtful team rationalized into — it's just an oversight. Disqualified and replaced** with a genuinely terrible one that a real team *would* talk itself into:

### 9 (replacement). The tone-policing README

Written in dense, self-serious academic prose — "This repository operationalizes a taxonomy of ideational heuristics" — to signal rigor.

**Mechanism of badness:** it performs seriousness at the expense of the reader, spending the reader's attention on the author's self-image instead of on understanding.

**Inversion of the mechanism:** spend the reader's attention only on their understanding; sound like a competent colleague explaining the thing, not a paper defending it.

**Direction:** plain, direct voice; the sophistication lives in the worked examples, not the vocabulary.

---

## A mechanism that refused to invert (shown dead)

Idea 4's neighbor was a tenth candidate: **the "table of contents as the whole README"** — a bare nested list of anchor links and nothing else.

**Mechanism of badness:** it provides navigation without any content to navigate to on the page itself.

**Inversion attempt:** "provide content, not just navigation." That is true but it's simply the *absence* of the bad idea — it collapses into "have a README at all," which is not a design principle, it's the baseline. There's no positive force hiding underneath the mechanism to flip; the mechanism is a lack, and inverting a lack just gets you back to zero.

**Dead.** Shown here rather than dressed up, because a batch where every mechanism yields treasure is a tell that the output was reverse-engineered from the answers.

---

## The meta-pattern

Line the mechanisms up:

- badge wall → answers the maintainer, not the reader
- autobiography → orders by author's chronology, not reader's need
- install-first → asks the reader to invest before proving anything
- parameter dump → completeness over the reader's comprehension
- aspirational → sells the author's vision over the reader's verifiable reality
- clever-name → assumes the author's context, not the reader's
- tone-policing → performs for the author's self-image over the reader's understanding

**Seven of the terrible READMEs are the same sin in seven costumes: each one serves the author instead of the reader.** That is the cluster, and it is a sharper output than any single fix. The map of what this README must never do reads as one rule: *every element must be justified by what it does for the visitor in their first thirty seconds, not by what it does for us.* The two ideas that fell outside that cluster — the wall of text (#7) and the highlight-reel (#6) — point at the two *other* things the README owes the reader: it must be scannable, and it must be honest about the method's misses.

---

## Honest ranking

Strongest directions, in order:

1. **Prove before you ask** (from install-first) — lead with a real worked example so the reader wants the tool, and put `npx skills add` after the payoff. Reframes the whole document's order.
2. **Show the misses** (from highlight-reel) — the featured example includes an abandoned idea and a disqualified one, framed as the differentiator. This is the pitch no competitor demo makes.
3. **Reader-first ordering** (from autobiography + badge wall) — value, proof, how, backstory-if-ever; badges and origin story demoted to the bottom.

Thinner, kept honestly:

4. **Only-what-ships honesty** (from aspirational) — important for trust, but it's a constraint on the copy more than a headline feature.
5. **Plain voice + name-then-definition** (from tone-policing + clever-name) — real, but table-stakes; they prevent a bad README rather than making a great one.

The meta-pattern outranks all five individually: **serve the reader, not yourself** is the single principle they all descend from.

Next moves, your call: draft the actual README against direction 1, generate a fresh batch of terrible ideas aimed only at the *worked-examples* section, switch to a convergent technique to lock the structure, or stop here.

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed.*
