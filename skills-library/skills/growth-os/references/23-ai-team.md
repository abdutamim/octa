# 23 — AI Team & One-Person Business

Use this file when the user wants to run a business alone with AI agents as staff, or
to go from zero to a first high-ticket client solo. File 12 decides WHAT to delegate
($5k/hour rule); this file supplies WHO does it — an AI team — and the business model
on top. File 15 owns the weekly rhythm.

---

## Why this works now (the math)

- **117,000+ businesses with zero employees crossed $1M revenue in 2023** (US Census
  Bureau) — more than double the count two years earlier.
- What changed: **AI collapsed the cost of labor.** Developer, copywriter, designer,
  marketer — one operator + Claude now runs all four.
- Reference case: Pieter Levels, ~**$3M/yr, zero employees**.
- Cost swap: **$100–200K/month** of senior payroll becomes a **$300–500/month** tool
  stack (~$1,000 at scale).

**The positioning gate:** you are one person, not a conglomerate. Commit to **one niche,
one painful problem, one proven outcome** — the whole business hangs on that outcome.
Do not pass this gate until it is written in one sentence. "AI is hot, I'll sell
automations to anyone with a pulse" is trend-chasing, and it is why most fail.

---

## The sub-agent model (your org chart)

Think like a manager, not a worker. The main Claude Code session is the **manager**:
it decomposes the task, delegates each piece to a specialist sub-agent, collects
results, reports back. **You only ever talk to the manager** — workers report to it.

| Each sub-agent has | Meaning |
|---|---|
| Own context window | Its own brain — no cross-contamination between workers |
| Own tools | Only the permissions you grant it |
| Own persona/specialty | Marketer, designer, closer, reviewer — matched to the task |
| Parallel execution | All workers run at once, not in a queue |

**The sequential-vs-parallel math.** Normal flow: prompt → wait → result → next prompt.
Claude Code rarely finishes a real task under ~10 minutes, so **6 tasks × 10 min =
1 hour of babysitting**. Sub-agents fan the same 6 tasks out in one prompt — one
~10-minute window total. A five-persona channel audit that takes 30+ minutes by hand
runs while you watch the agents' colors in the terminal.

**Lifecycle rule:** task-spawned agents die when the task ends. A worker that should
exist permanently becomes a **persistent agent** — project scope (this repo) or
personal scope (every project).

**Agents vs skills:** a skill is one taught capability invoked inside a session; an
agent is a worker with identity, tools, and triggers — and it can carry skills.

---

## Building an agent

| Field | Rule |
|---|---|
| Creation | `/agents` → Create new → **"Generate with Claude" beats manual config.** Manual = hand-filling a ~200-line markdown file; generated = describe the job, then edit the result |
| Scope | Project (this repo) vs personal (every project) — decide before creating |
| `description` | **The most important field.** It alone decides when the manager auto-triggers the agent unprompted. Keep it simple and explicit: what it does + when to use it. Too long or vague = fires constantly or never |
| Frontmatter | An unclosed bracket **silently breaks the agent** — Claude Code can no longer invoke the file. Close every bracket after editing |
| Model | Per agent. Opus is good but expensive — reserve for the manager; reviewers/researchers run Sonnet or Haiku. **Cheap model for cheap tasks** |
| Tools | Grant only what the job needs; deny the rest |
| Color | One per agent, so you can see who is running in the terminal |
| Libraries | Do not build from scratch: **awesome-claude-code-agents** on GitHub has ready specialists (API designer, SQL pro, security/debuggers, ML, per-language pros). Hand Claude Code the repo link; it installs them itself |

Parallel-audit prompt pattern (reconstructed from the demo — five personas roasting a
YouTube channel, scores came back 4–7/10, and that honest spread is the value):

```
Spin up 5 agents in parallel to audit [asset/channel link].
Give each a different persona and background: beginner in the niche,
senior practitioner, small-business owner, enterprise owner,
[platform] growth expert.
Each returns: honest feedback, what needs improvement, score /10.
Judge against competitors in the same niche, not personal taste.
No flattery — ممنوع التسليك، انتقاد بنّاء بس من غير مجاملة.
```

Minimal persistent-agent frontmatter:

```
---
name: content-roaster
description: Use when the user asks for an honest review of their channel or
  content. Compare against competitor channels in the same niche. No flattery.
model: sonnet
tools: WebFetch, Read
---
```

---

## The one-person business blueprint

Run idea and offer in **one pass**: 5 ideas × 2 offers each = 10 candidate businesses.
Never evaluate an idea without its offer attached — investors demand both before money
moves, and so should you.

**Phase 1 — Discovery.** Make Claude interrogate the operator before generating anything:

| Question | Digging for |
|---|---|
| What are you objectively good at? | Skills |
| Where do your 1,000+ hours live? | Deep expertise zones |
| What does a random smart person NOT have? | Unfair advantages: audience, insider network, credentials, media access |
| Where do you already suspect there's money? | Profit hypothesis |
| What can you reach today without ads? | Distribution: past clients, community, following, list — or zero warm reach |
| Hours/week you'll really put in? Revenue that makes it worth it? | Lifestyle envelope |
| Capital available for tools/ads? | Budget ceiling |
| What would a stranger believe? | Proof: results, testimonials |
| What will you not do, no matter what? | Dealbreakers |

**The honesty gate:** the model cross-checks answers. "No warm reach" + "I have an
audience" gets flagged as a contradiction; blanks get flagged as "ideas will be
fiction if I guess." Answer straight — dishonest discovery produces fiction.

**Phase 2 — Ideas + offers.** Require: each idea **verified with real web searches**
(real buyers, real pricing) before it appears; a scorecard per idea — active buyers,
sold deliverable, margin, lifestyle fit — out of **25**; a ranking. The ranking is
advisory; judgment decides. Kill any idea whose proof you don't own — a beginner
cannot claim "fractional advisor across 250 client engagements," whatever it scores.

**Re-niche by judgment (the Pilates move):** the model proposed "AI installs for gyms";
the operator re-niched to **Pilates studios** — a rising sub-market, loud on social,
affluent clientele. Rule: shift the ICP one notch toward where money is newly flowing.

**The MAGIC offer formula** (layer on the value equation in file 02):

| Letter | Component |
|---|---|
| M | Magnetic reason why |
| A | Avatar (who exactly) |
| G | Goal (the one outcome) |
| I | Interval (by when) |
| C | Container (what it's delivered as) |

Output format: **stack, price, guarantee** — nothing less.

**Price benchmarks from the case studies:**

| Offer shape | Price |
|---|---|
| Receptionist/front-desk AI install (low ticket) | $1,500 setup + $300–800/mo |
| Done-for-you full-stack automation install | $3,000–4,500 |
| Workflow template packs (productized) | $29 simple / $299 complex |
| Template buyer → custom-build upsell | +$2,000 |
| Retainer case (one client = 60% of a $10K/mo target) | $6,000/mo × 5 months |

Templates are not the business — they are the top of a high-ticket funnel. Target:
$10K/month; first high-ticket client is realistic inside 30 days (fastest case: 20 days;
largest cited deals: $30–31K).

---

## Website that converts (anti-slop)

Everyone prompts the same front-end skill, so every one-person AI site looks identical —
and identical reads as untrustworthy. You lose $5,000 deals without knowing it. Build
these in, in order down the page:

1. **3D element (three.js)** near the hero — an authority signal competitors don't have.
2. **VSL placeholder above the fold** — a video sales letter breaking down the offer;
   low production is fine (one client's VSL landed a $1,000 client 8 days after adding it).
3. **Bold claim with concrete numbers** — name the pain in dollars ("your missed calls
   last month were $2,400") and the promise with an interval ("one install, five
   systems live in 21 days").
4. **Full offer stack with the price ON the page** — every component, total first-year
   value, one price stated plainly. Price appears twice.
5. **Guarantee / risk reversal** — people do not buy without one.
6. **"Built by one person on purpose"** — your face; solo framed as the advantage.
7. **Pilot pricing** — 3 pilot slots, same pattern: honest scarcity.
8. **Booking CTA** (Calendly install call) + **FAQ** "asked on every call, answered
   straight." No dodging.

Build with dummy placeholders; swap in real numbers before launch.

---

## Client acquisition: the dual engine

**Inbound (compounds):**

| Cadence | Asset |
|---|---|
| 4 LinkedIn posts/week | 2 personal-story + 2 value posts |
| 1 YouTube video/week | Show something you BUILT with Claude — screen recording + walkthrough is enough |

Clients search YouTube for exactly these services. Zero videos = invisible = tens of
thousands in missed revenue. The biggest cited deals came through inbound.

**Outbound (controls the timeline):** **highly curated DMs with a Loom demo** — not
spray. First determine where the ICP actually responds (Instagram vs LinkedIn vs
email), then track every channel:

```
Channel | Sent | Response % | Booked % | Closed %
```

Double down on the winner, cut the loser (case: Instagram beat LinkedIn for a
creator-tools SaaS → doubled IG DMs, limited LinkedIn → CMO-level conversations).
**Volume without tracking is wasted volume.** Feed these numbers into the weekly
scorecard in file 15.

---

## Closing loop

1. Run a **bot-less note-taker** that transcribes the sales call in the background
   (nothing joins the meeting).
2. Feed the transcript to Claude with a **proposal skill** — build that skill once,
   reuse forever.
3. Send the generated proposal same-day. This exact loop closed a **$31,000** deal.

Run the call itself on the 20/20/20 structure in file 15; objection scripts live in 11.

---

## Use with

- `02-positioning-offer.md` — value equation + offer structure under the MAGIC formula
- `11-monetization-sales.md` — pricing ladders and the sales conversation itself
- `12-scale-systems.md` — the $5k/hour rule decides which tasks become agents first
- `15-brand-operating-system.md` — weekly scorecard/rhythm that the tracking table feeds
