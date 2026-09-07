---
name: "inversion"
description: "Assumption Inversion — list the assumptions behind the current approach and flip each one, then ask where the flipped version could actually be true. Use when requirements encode beliefs nobody has questioned, when a design feels inevitable, or when incumbents all share one blind spot. Triggers include \"invert\", \"flip it\", \"flip the assumption\", \"reverse the premise\", \"what if the opposite were true\", \"challenge the assumption\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Assumption Inversion

## What this technique does

Every approach rests on a stack of unstated beliefs — about who the user is, what they value, how the thing gets delivered, in what order, at what price. List those beliefs, flip each one into its opposite, then ask the sharp question: where is the flipped version *already true*? Most flips are dead ends, and naming them dead is part of the work. The two or three flips that turn out to be true somewhere are where a non-obvious direction hides — the incumbents never looked there because the original belief felt like a law of nature.

Source: the classical dialectic method of arguing a position by its negation; popularized for business by "invert, always invert" (Carl Jacobi, via Charlie Munger) and by Edward de Bono's reversal method in *Lateral Thinking* (1970).

## Workflow

### Step 1: Confirm the target

A valid target is a design, plan, or approach whose assumptions you can list: a product strategy, a go-to-market plan, a pricing model, a workflow you are about to build, an onboarding sequence. If the target is unclear, ask one focused question — "What's the current approach, and what feels locked-in about it?"

Refuse requests to *perform* analytical work — debugging, reviewing code, implementing a change — and suggest an analytical approach instead. Redesigning or ideating about such a process is a valid creative target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Extract the assumptions

List 5–8 assumptions behind the current approach. Aim for the load-bearing ones, not decorations. These prompt categories help you cover the space rather than list five versions of the same belief:

- **The user** — who they are, what they already know, what they can be trusted to do.
- **The value** — what the thing is actually worth, and to whom.
- **The channel** — where it reaches people and where they meet it.
- **The sequence** — what has to happen first, second, last.
- **The price** — who pays, how much, and when.
- **The effort split** — who does the work, the provider or the user.

### Step 3: Flip each assumption

Turn each assumption into its strongest *plausible opposite* — not a strawman. "Users want it fast" flips to "users want it slow and deliberate," not "users want it broken." A good flip is one a reasonable person could defend. If the flip is obviously stupid, you flipped it lazily; find the version a competitor could actually build a business on.

### Step 4: Hunt for where the flip is true

For each flip, ask the load-bearing question: **"In what market, segment, or era is this flip TRUE? Who profits from it today?"** Name a real place it holds — a customer type, an industry, a historical moment, an existing product. If you cannot name one honestly, the flip is dead. Say so and move on. Do not manufacture a fake "where."

### Step 5: Develop the survivors

Take the 2–3 flips that had a live answer in Step 4 and develop them into concrete directions. What would the approach look like if you built it around the flipped belief? Where the flip already works for someone else, borrow the mechanism.

### Step 6: Meta-pattern scan

Scan across the flips that survived. Is there a structural insight — one belief that several assumptions all secretly depended on, one axis where the whole approach is fragile? State it explicitly. This cross-flip observation is often the real finding, larger than any single flipped assumption.

### Step 7: Honest ranking

Rank the surviving directions, weakest called out as weak and why. Mark the dead flips as dead so the user sees the whole map. Then offer the next move — extract more assumptions, go deeper on one direction, switch technique, or stop — and never push the user to commit. The technique is divergent; convergence belongs to the user.

## Honesty mechanics

**Dead flips stay visible.** A flip with no honest answer to "where is this true?" is marked dead explicitly, not quietly dropped. The dead flips are evidence the exercise was genuine.

**Something usually survives inversion unscathed.** At least one assumption, when flipped, has no live answer anywhere — the original belief really is close to a law for this problem. Say so. That is a finding too: it tells you where *not* to waste effort.

**Every flip working is a red flag.** An inversion session where every flip "turns out to be true somewhere" is a sign the flips were strawmen or the "wheres" were manufactured. Expect one or two flips to die.

## What NOT to do

- **Don't flip into absurdity.** Flipping "users want it fast" into "users want it broken" is a different technique's job (that is `provocation`'s territory). Inversion flips into *plausible opposites* a competitor could defend.
- **Don't stop at the flip.** The flip alone is a debating trick. The value is in Step 4 — hunting for where the flipped belief is already true. A flip with no "where" hunt is half the technique.
- **Don't flip more than 8 assumptions.** Depth beats coverage. Better to develop three survivors fully than to list twelve flips and hunt none of them.

## References

- See the Worked example appendix below — a real session showing the full shape, dead flips included.

## Appendix: Worked example

# Worked Example: Launching this repo on Hacker News

A real session. The target was a launch plan, not code:

> "Assumptions behind launching this repo on Hacker News."

Context: the repo is a free, MIT-licensed collection of 8 lateral-thinking technique skills plus a router, aimed at AI coding agents, installable via `npx skills add`. The author is an individual, not a company. "Launching" means a Show HN post.

Seven assumptions were extracted and flipped. Four flips survived the "where is this true?" hunt, two half-survived, one died. Both the dead flip and the assumption that survived inversion unscathed are shown, because they are the point.

---

## Opening framing

State briefly why the technique works, once per session, before the flips:

> A Show HN post feels like the obvious move because every assumption underneath it — that this audience lives on HN, that a launch is an event, that breadth is the pitch — feels like a fact rather than a choice. Inversion pries each one loose. The flip is only a debating trick until you ask the real question: where is the opposite *already true* for somebody? The flips that have an honest answer there are the directions the obvious plan never considered.

---

## The assumptions, flipped and hunted

### 1. Channel — "HN is where this audience is"

Assumption: developers who use AI coding agents congregate on Hacker News, so that is where to reach them.

→ Flip (plausible opposite): they are *not* on a forum at all — they are inside their agent, and they discover tooling from within it.

→ Where is this true? Very true, and increasingly so. People find agent extensions through the agent's own registry, through GitHub trending, and through in-editor suggestions — not by reading a link aggregator and then going to install something. The discovery surface for agent tooling is the agent, not a browser tab.

**Survives, strongly.** The flip points at a whole distribution channel the HN plan ignores: get discovered where the agent already looks, so the tool surfaces at the moment of need rather than the moment of idle browsing.

### 2. Sequence — "a launch is a single event"

Assumption: you finish the repo, then post it once, and the launch is that day.

→ Flip: a launch is *not* an event but a continuous drip — you release one technique at a time and narrate the building.

→ Where is this true? True for build-in-public and content-led growth, where each technique becomes its own post and the repo accretes an audience over weeks. Half true here: a solo author with 8 finished skills has the inventory to drip, but also loses the concentrated attention a single Show HN spike provides.

**Half-survives.** Real as an alternative rhythm, but it trades a known burst for a slow accrual — a genuine choice, not a free win.

### 3. Value — "breadth is the pitch"

Assumption: the value proposition is the *collection* — 8 techniques plus a router — and the breadth is what impresses.

→ Flip: breadth is *not* the pitch; one sharp technique is. Lead with the single most surprising skill and let the rest be depth discovered later.

→ Where is this true? True almost everywhere a tool has broken through. The ones that land lead with one vivid capability, not a feature grid — the router and the other seven become the reason to stay, never the reason to click. A "8 techniques + a router" headline reads as a catalog; one technique doing something unexpected reads as a demo.

**Survives, strongly.** Reframes the entire post: pick the one skill with the best worked example and make *that* the launch, with the collection as the second paragraph.

### 4. User — "they want a tool to install and run"

Assumption: the audience wants an installable tool (`npx skills add`) they wire into their agent.

→ Flip: they do *not* want to install anything — they want to read and learn the techniques, and adopt them by hand.

→ Where is this true? True for the entire genre of curated "awesome" lists and technique write-ups that get starred, bookmarked, and quoted far more than they get installed. A meaningful slice of the audience wants the *ideas*, not a dependency.

**Survives.** Suggests a second front door: the repo as a readable field guide to the techniques, with installation as the optional upgrade rather than the only path in.

### 5. Effort split — "I write the skills, users consume them"

Assumption: the author authors the techniques; the audience is a consumer of them.

→ Flip: the *users* write the skills; the author only provides the frame, the router, and the format.

→ Where is this true? True for every durable plugin, theme, and template ecosystem — the platform ships the shape, the community ships the content. Eight techniques is a seed, not a product; the format that lets anyone add a ninth is the product.

**Survives.** Recasts the launch from "here is my collection" to "here is a format for lateral-thinking skills — the first eight are mine." That is a more defensible and more interesting thing to launch.

### 6. Price — "free and MIT is right"

Assumption: free, MIT-licensed, no money involved — this lowers friction and is correct for adoption.

→ Flip: it should *not* be free; there is a paid version.

→ Where is this true? Hunted honestly and could not find it. For an individual author launching a small collection of thinking-technique skills whose entire goal is adoption and word of mouth, a price is pure friction with nothing on the other side of the ledger — no support obligation anyone would pay to remove, no scarce resource being metered, no enterprise buyer. Paid open-source dev tooling works when there is hosting, a team seat, or a compliance surface to sell; none of those exist here. Every "where" I reached for was a different kind of product.

**Dead flip.** Free is effectively a law for this specific launch. Marked dead and left visible, because pretending it survived would fake the exercise.

### 7. User / framing — "pitch it to the humans reading HN"

Assumption: the post persuades a human, who then decides to install and later invokes the skills.

→ Flip: the audience that matters is *not* the human — it is the agent. The thing that must be persuaded to "adopt" a skill is the agent's own routing, via the skill's description.

→ Where is this true? True the moment the tool is installed: from then on, no human re-reads anything; the agent decides whether to reach for a skill based on how well its description matches the situation. The real adoption event is not the click — it is every later moment the agent does or doesn't invoke the skill. That is won or lost in the trigger phrasing, not in the launch copy.

**Survives, and it was the surprise of the batch.** The flip inverted *who the customer even is*: past the launch, the buyer is the router, and the product's success lives in machine-readable trigger descriptions rather than in human-readable pitch.

---

## The meta-pattern

Four flips survived cleanly (channel, value, user-as-reader, effort-split), two half-survived (sequence), one died (price). Scanning the survivors, they were not seven unrelated flips — they nearly all leaned on a single hidden belief:

**The whole HN plan assumes the human is the customer and the launch day is the decisive moment.**

Flip 1 (discovery happens inside the agent), flip 4 (they want to read, not be sold), and flip 7 (the agent, not the human, decides adoption) are the same crack seen from three sides: the plan optimizes a one-time human decision, when the thing that actually determines whether these skills get used is a *repeated, machine-made* decision that happens long after the post scrolls off the front page.

So the structural insight is: **a Show HN optimizes the wrong moment.** It buys a spike of human attention, but the product's fate is decided later and by a different actor — the agent's router, matching a situation against a description. That reframes the launch from "win the front page" to "win the invocation," and it also explains why the price flip died: money has nothing to do with the moment that actually matters here.

---

## Honest ranking

Strongest surviving directions, in order:

1. **Win the invocation, not the front page (flip 7).** The decisive moment is every later time the agent chooses a skill. Invest the launch energy in trigger descriptions and worked examples that make the router reach correctly. Highest-leverage, lowest-glamour.
2. **Lead with one technique, not the collection (flip 3).** Recast the post around the single most vivid skill; the router and the other seven are the second paragraph. Cheapest to act on today.
3. **Get discovered inside the agent (flip 1).** Distribution through the agent's own registry and GitHub surfaces beats a link-aggregator spike for this audience.

Two that reframe the product itself:

4. **Ship a format, not a collection (flip 5).** "Here is a format for lateral-thinking skills; the first eight are mine" is more defensible than a static catalog — but it is a bigger commitment than a launch.
5. **A readable field guide as a second front door (flip 4).** Serve the read-only audience; installation becomes the optional upgrade.

Half-survivor: **drip the launch (flip 2)** — real, but trades a known attention burst for slow accrual. A rhythm choice, not a clear win.

Dead flip, shown on purpose: **charge for it (flip 6).** No honest "where is this true?" for this specific launch. Free is a law here.

Next moves, your call: extract more assumptions (the license, the naming, the `npx` install step all have unflipped beliefs left in them), go deep on the "win the invocation" direction, switch to a convergent technique to narrow these into an actual plan, or stop here.

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed.*
