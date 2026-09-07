---
name: "six-hats"
description: "Parallel thinking with six enforced perspectives, based on Edward de Bono's Six Thinking Hats® method - examine one decision through sequential passes for facts, feelings, risks, benefits, alternatives, and synthesis, never blending them. Use when a decision is being made too fast or from one angle, when everyone agrees suspiciously quickly, when the discussion mixes emotions with data, or for \"six hats\", \"thinking hats\", \"look at this from every angle\", \"structured devil's advocate\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Six Thinking Hats

## What this technique does

Take one decision and run it through six deliberately separated perspectives, one at a time. Each pass wears a single "hat": facts, feelings, risks, benefits, alternatives, then synthesis. The power is in the separation — a group that argues all six dimensions at once collapses into whoever talks loudest, but a group that examines facts *only*, then feelings *only*, surfaces things the argument would have buried. It converts a tug-of-war into six clean passes over the same ground.

Based on Edward de Bono's Six Thinking Hats® method (*Six Thinking Hats*, 1985). Six Thinking Hats is a registered trademark of the de Bono Group; this skill is an independent educational implementation.

## Workflow

### Step 1: Confirm the target

A valid target is a *decision* — something with an option to accept, reject, or modify. "Should we ship X in v1?", "Do we adopt this dependency?", "Which of these two rollout plans?" all qualify. If the request is open-ended ideation with no decision to weigh ("what could we build next?"), this is the wrong technique — point them to a generative technique such as the `random-stimulus` skill instead. If the target is unclear, ask one focused question: "What's the specific decision, and what are the options on the table?"

Refuse requests to *perform* analytical work — "debug this", "review this code", "implement this change" — and suggest an analytical approach instead. Redesigning or ideating about such a process is a valid target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Run the six passes in fixed order

Run all six, each under its own clear heading, never blending. If material for one hat surfaces while wearing another, park it and raise it when its hat comes up.

- **White — facts only.** State only what is verifiable. Name the missing data explicitly rather than guessing at it. No opinions, no interpretation.
- **Red — gut reactions.** One line each, no justification permitted. The instant "this feels wrong" or "I'd be relieved" — recorded, not defended. Justifying a feeling turns it into a Black or Yellow point; don't.
- **Black — risks and failure modes.** Each risk tied to a *mechanism* — how it actually goes wrong — not a vibe. "This could fail" is not a Black-hat point; "this fails if traffic doubles because the queue is unbounded" is.
- **Yellow — benefits and best-case.** Each benefit tied to a mechanism too. Not "this would be great" but "this cuts onboarding time because the config step disappears."
- **Green — alternatives and modifications.** Minimum three. At least one must abandon the premise of the decision entirely rather than tweak it.
- **Blue — synthesis.** What did the hats disagree about? What piece of information would change the answer? End with a recommendation carrying a *stated confidence level*.

### Step 3: Offer next moves

Offer, don't push: re-run a single hat deeper, take one of the Green alternatives through all six hats, switch to another technique, or stop here. Never pressure the user to commit to the recommendation.

## Honesty mechanics

**The Red hat must bite.** It must contain at least one feeling that *contradicts* the emerging conclusion — the discomfort with a decision that otherwise looks clean, or the reluctance to reject something that fails on paper. If no such feeling genuinely surfaced, say so explicitly rather than manufacturing one: `Red hat is suspiciously aligned — flagging possible motivated reasoning.` A Red hat where every feeling agrees with the answer is a tell.

**The Blue hat must not paper over the split.** Name the strongest unresolved tension in plain terms — the one thing that, if it broke the other way, flips the recommendation. Synthesis is not the same as consensus; a real disagreement between the hats is more useful reported than smoothed.

## What NOT to do

- **Don't blend the hats.** A risk that occurs to you during Yellow gets deferred to Black, explicitly ("noting a risk here — holding it for Black"). Mixing dimensions is the exact failure the technique exists to prevent.
- **Don't let Blue introduce new material.** Blue synthesizes what the other five hats produced. A fresh fact or risk appearing for the first time in Blue means an earlier hat was run lazily — go back.
- **Don't run this on a problem with no decision in it.** No option to accept or reject means no target. Redirect to a generative technique.
- **Don't skip Red because "feelings aren't data."** Surfacing the feelings *is* the hat's job. Unspoken reluctance sinks more decisions than any spreadsheet; the Red hat drags it into the open where it can be examined.

## References

- Appendix A below (hats guide) — what belongs in each hat, what is banned, examples, and the leakage patterns between neighbouring hats
- Appendix B below (worked example) — a real run of all six hats on one decision, disagreement and confidence level included

---

## Appendix A: Hats guide

# The Six Hats: What Belongs, What Is Banned, Where They Leak

One hat per pass. The discipline is not in filling each hat — it is in keeping out the material that belongs to a different one. Each section below lists what belongs, what is banned, three example lines (software-flavored), and the leakage patterns that pull this hat toward its neighbours.

---

## White — Facts

**Belongs here:** verifiable statements, measured numbers, quotes from the spec or the data. And, just as importantly, the *named absence* of data — "we do not know the current p99 latency" is a first-class White-hat entry.

**Banned:** interpretation, opinion, prediction, "obviously". If a sentence could be argued with by a reasonable person looking at the same evidence, it is not White.

Examples:
- "The service handles 4,200 requests per second at peak, per last month's dashboard."
- "The library has had three CVEs in the past year; two are patched, one is open."
- "We do not have data on how many users reach the second onboarding screen. Missing."

**Leakage into Black/Yellow:** "the latency is *too high*" smuggles a judgement into a fact. The fact is the number; "too high" is a Black-hat point. State the number here, judge it later.

**Leakage into Red:** "the data looks worrying" is a feeling wearing a lab coat. Record the datum here; save the worry for Red.

---

## Red — Feelings

**Belongs here:** immediate gut reactions, intuitions, hunches. One line each. Excitement, dread, relief, suspicion, boredom. No reasons attached.

**Banned:** justification. The moment a feeling acquires a "because", it has become a Black or Yellow point and left the Red hat. "I don't trust this" is Red; "I don't trust this because the vendor is small" is Black.

Examples:
- "This feels like scope creep dressed as a quick win."
- "I'd be quietly relieved if we said no."
- "Something about the timing bothers me — can't name it."

**Leakage into Black/Yellow:** adding "because" is the universal tell. Strip the reason; if a real risk hides inside the feeling, it will resurface when Black comes around.

**Leakage into White:** "I feel the numbers are solid" is not a fact and not really a feeling either — it is a smuggled endorsement. Keep Red pre-verbal and honest.

---

## Black — Risks

**Belongs here:** failure modes, downsides, what breaks and *how*. Every point tied to a mechanism: the causal chain from decision to bad outcome.

**Banned:** free-floating pessimism ("this seems risky"), and any risk you cannot name a mechanism for. Also banned: solutions — Black identifies the failure, it does not fix it (fixes are Green).

Examples:
- "If the cache warms lazily, the first request after every deploy times out — that is a mechanism, not a maybe."
- "A new required config field breaks every existing install on upgrade, because there is no default."
- "Contention: two teams write this file weekly, so a shared lock here stalls both."

**Leakage into Red:** "this makes me nervous" with no mechanism is a Red-hat point that wandered in. Send it back; in Black, name the mechanism or drop it.

**Leakage into Green:** "...so we should add a default instead" — the moment you propose the fix, you are in Green. State the risk cleanly; the fix is a later hat.

---

## Yellow — Benefits

**Belongs here:** upsides, best-case outcomes, value — each tied to a mechanism, exactly as Black demands for risks. Why does the good thing actually happen?

**Banned:** vague optimism ("this would be great"), and benefits with no mechanism behind them. Yellow is not cheerleading; it is rigorous about upside the way Black is rigorous about downside.

Examples:
- "Onboarding drops from four steps to two because the config step becomes automatic — measured elsewhere at ~30% fewer drop-offs."
- "Native rendering means zero new dependencies to audit, so the security surface does not grow."
- "The change is reversible in one commit, which lowers the cost of being wrong."

**Leakage into Red:** "I'm excited about this" is a Red-hat feeling. In Yellow, convert excitement into a named mechanism or leave it in Red.

**Leakage into White:** "the benefit is that it's fast" restates a fact as a benefit without the *so-what*. Yellow needs the consequence: fast *so that* what improves?

---

## Green — Alternatives

**Belongs here:** other options, modifications, creative reframings. Minimum three. At least one must abandon the decision's premise entirely — not "do it differently" but "don't do it, do this other thing instead."

**Banned:** re-litigating the risks and benefits of the *original* option (that was Black and Yellow). Green generates new options; it does not re-judge the old one.

Examples:
- "Modification: ship it behind a flag, off by default, so the risk is opt-in."
- "Alternative: buy the hosted version instead of building it."
- "Abandon the premise: the real problem is discoverability, not this feature at all — solve that and the decision dissolves."

**Leakage into Black/Yellow:** immediately weighing each alternative's pros and cons collapses Green back into the earlier hats. Generate the options here; run a promising one through its own six hats later if the user wants.

**Leakage into Blue:** "and the best alternative is..." — picking a winner is synthesis. Green lists; Blue chooses.

---

## Blue — Synthesis

**Belongs here:** the meta-view. What did the hats disagree about? Which single piece of information would change the answer? A recommendation with an explicit confidence level, and the strongest unresolved tension named out loud.

**Banned:** new material. Every fact, risk, benefit, and option in Blue must trace back to an earlier hat. If something appears here for the first time, an earlier hat was run lazily — go back and rerun it.

Examples:
- "The hats split on one axis: White says the data is thin, Yellow says the upside is large. If we had the drop-off number, that split resolves."
- "Recommendation: defer, medium-low confidence. The Black-hat contention risk is real but the Red hat's reluctance is the louder signal."
- "Strongest unresolved tension: the benefit is large *only if* an assumption we cannot yet verify holds."

**Leakage from every hat:** Blue's characteristic failure is smuggling in a fact or risk nobody raised earlier, to force a tidy conclusion. If it wasn't in White through Green, it doesn't belong in Blue.

**Leakage into false consensus:** the opposite failure — smoothing a genuine disagreement into a bland "on balance." Name the split; do not average it away.

---

## Appendix B: Worked example

# Worked Example: Should v1 Ship a Docs Website?

A real run of all six hats on one decision:

> "Should this repo ship a documentation website in v1?"

Context the hats were given: the repo is a free, MIT-licensed collection of 8 lateral-thinking technique skills plus a router, aimed at AI coding agents, installable via `npx skills add`. It is authored by one person in spare time. The v1 scope *explicitly excludes* a docs site, scripts, an MCP server, and a CLI. Today the entire documentation surface is the README plus one markdown file per skill, and the host renders markdown natively. The project's own spec already says no docs site — the hats were run honestly to see whether they agree, not to rubber-stamp it.

---

## White — Facts

Only what is verifiable, plus what is missing.

- Documentation today: one README plus one markdown file per skill. That is the whole surface.
- The hosting platform renders markdown natively, so every file is already browsable in a formatted view without any site.
- Install path is `npx skills add`; nobody has to visit a website to obtain or use a skill.
- The project has one maintainer working in spare time.
- The v1 scope document lists a docs site, scripts, an MCP server, and a CLI as explicitly excluded.
- License is MIT; the project is free.

Missing data, named rather than guessed:
- No usage or install numbers. We do not know how many people have run the install command.
- No evidence either way that anyone is confused by, or bounced off, the markdown-only presentation.
- No data on whether a docs site would measurably increase adoption. Missing.

---

## Red — Gut reactions

One line each, no justification.

- A docs site feels like a trophy — built to look established, not because anyone asked for it.
- Faint contrary tug: markdown-only reads as slightly under-invested, like the project doesn't take itself seriously yet.
- Relief at the thought of *not* maintaining a website.
- Mild boredom — this feels like the least interesting thing the author could spend the next weekend on.

The second line contradicts where this is heading. Everything else leans toward "no site," but there is a real pull that the bare-markdown look undersells the work. Flagging it rather than burying it — the Red hat is doing its job precisely because it disagrees with the emerging answer.

---

## Black — Risks

Each tied to a mechanism.

- **Documentation drift.** A separate site duplicates content that already lives in the skill markdown. The moment a skill changes, the site is stale unless someone remembers to update both — and with one spare-time maintainer, "remembers to" is exactly the thing that fails.
- **Opportunity cost, concretely.** Every hour on a site is an hour not spent on a ninth skill or on sharpening the router. For a solo author this is a zero-sum trade, not an "and also."
- **Implied promise.** A polished site signals a level of ongoing support and completeness the project cannot currently guarantee, which sets up a credibility fall when a link rots or a page lags the code.
- **New failure surface.** A site means a build and a deploy that can break independently of the skills, which work fine on their own today.

---

## Yellow — Benefits

Each tied to a mechanism.

- **Cross-skill browsing.** A site could present all 8 skills and the router on one indexed, searchable page, which the scattered per-folder markdown cannot do — a newcomer sees the whole toolkit at a glance instead of spelunking directories.
- **Explaining the router.** The router concept is the hardest thing to grasp from markdown alone; a single landing page with one diagram could make "how these fit together" click in a way eight separate files do not.
- **Adoption signal.** For a project seeking users, a real homepage lowers the trust barrier — mechanism: people evaluate legitimacy partly by presentation before they will run an install command.
- **Reversibility.** A minimal static page is cheap to remove later, so being wrong here is not expensive.

---

## Green — Alternatives

Minimum three; at least one abandons the premise.

1. **Strengthen the README into an index.** Add a single table listing all 8 skills, one-line descriptions, and trigger phrases, plus a short router explainer. This captures most of the "browse the whole toolkit" benefit with zero new infrastructure and nothing to drift out of sync — it lives beside the code.
2. **Generate the site, don't author it.** If a page is wanted, produce it mechanically from the existing skill markdown at release time, so there is no second copy to maintain by hand. The site becomes a view of the source, not a parallel document. Deferring the *hand-authored* site while allowing a *generated* one splits the difference.
3. **Abandon the premise.** The real question may not be "docs site vs. no docs site" at all — the audience is AI coding agents, and an agent never visits a website; it reads the skill descriptions the router feeds it. If discoverability is the actual goal, the highest-leverage work is sharpening those descriptions and trigger phrases so the right skill fires at the right moment. A human-facing site solves a problem the primary user does not have.

---

## Blue — Synthesis

**Where the hats disagreed.** The split is narrow and specific: Yellow and one Red line say a site buys credibility and a coherent view of the whole toolkit; Black and White say the project has neither the evidence that this is needed nor the maintainer capacity to keep a second surface honest. White is the quiet tiebreaker — there is no data showing anyone is bouncing off the markdown, so the Yellow benefits are hypothetical while the Black costs are concrete.

**What would change the answer.** A single piece of information: evidence that people are actually failing to understand or adopt the toolkit *because* of the markdown-only presentation. If that surfaced (support questions, drop-off, direct feedback), Yellow's case would harden and the recommendation would flip toward at least the generated-page alternative.

**Recommendation, with confidence.** Agree with the spec: **do not ship a hand-authored docs website in v1. Confidence: medium-high.** Instead take Green alternative 1 now (a stronger README index — cheap, no drift, captures most of the upside) and keep alternative 2 (a generated page) in reserve for when there is usage data to justify it. Green 3 is the real long-game: for an agent audience, description quality outranks any website.

**Strongest unresolved tension.** The Black-hat maintenance-and-opportunity-cost case is decisive *today*, but it rests entirely on the project staying small and solo. The one Red-hat feeling that a bare repo undersells the work is not irrational — if the goal shifts from "a tidy personal toolkit" to "a project actively courting a user base," the credibility argument gets stronger and this recommendation should be revisited. The hats agree with the spec, but they agree *conditionally*, and the condition is the project's own ambition.

---

*Next moves, your call: re-run Black or Yellow deeper, take Green alternative 2 (the generated page) through its own six hats, switch to a generative technique if the question is really "what should v1 include," or stop here.*

---

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed. Six Thinking Hats® is a registered trademark of the de Bono Group; this is an independent educational implementation.*
