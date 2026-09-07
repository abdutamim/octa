---
name: "random-stimulus"
description: "Edward de Bono's Random Stimulus technique — force-fit a random unrelated object, place, or phenomenon onto a creative target to break familiar association patterns. Use for product ideation, feature naming, brand direction, copywriting, architecture and design choices when ideas from outside the problem space would help. Triggers include \"random stimulus\", \"random word\", \"force-fit\", \"de Bono\", \"inject a random object\", \"stare out the window\", \"see the tree and squeeze an idea\". Do NOT use for analytical work like debugging, code review, or implementation tasks."
---

# Random Stimulus

## What this technique does

Pick a random thing from outside the problem space — a tree, a glacier, a kettle. List its properties. Force a connection to the target. See what falls out.

The first stimuli you draw are usually trash. The third or fourth is where real ideas appear — which is why you draw a batch and not a single object. The technique works because staying inside the problem space routes you through familiar associations; an external stimulus breaks the routing and forces a fresh trajectory through the same target. The stimulus has a *structural property* — cyclical, layered, swarming, ephemeral, branching — that the target could have but doesn't yet. That mismatch is where new designs hide.

Source: Edward de Bono, *Lateral Thinking: Creativity Step by Step* (1970), specifically the Random Word / Random Object method.

## Workflow

### Step 1: Confirm the target

A valid target is a concrete creative problem: names for a feature, ideas for a product, a novel onboarding flow, how to position a brand. If the target is unclear, ask one focused question — "What's the creative problem, and are there hard constraints?" Default batch size is 8–12 stimuli.

Refuse requests to *perform* analytical work — debugging, reviewing code, implementing a change — and suggest an analytical approach instead. Redesigning or ideating about such a process is a valid creative target: "reinvent our code-review ritual" is in scope; "review this PR" is not.

### Step 2: Pull stimuli

Draw 8–12 stimuli from the stimulus pools (see Appendix A below). Three minimums, all checkable against the batch you drew — Step 3 requires you to label each stimulus with its pool, which is what lets a reader check them:

- **At least five distinct categories.** Not "mixed" as a feeling — count them.
- **At least two concrete physical objects and at least one abstraction.** Judge this per stimulus, not per pool: `hourglass` and `circadian rhythm` both live in Time & Cycles, but one is an object you could hold and the other is a rhythm you cannot. Mark each stimulus `[concrete]` or `[abstract]` beside its pool label so the count is visible. Pure-abstract batches feel intellectualized; pure-concrete batches feel mundane.
- **No two stimuli from the same category adjacent** in the batch order.

If the user offers a triggering metaphor ("look out the window", "what's in my kitchen"), bias toward that pool but always include 2–3 unrelated stimuli to break the cluster. A fully on-theme batch defeats the purpose of randomness.

Track which stimuli have been used this session. On a second batch, draw fresh ones.

### Step 3: For each stimulus, generate and show the chain

The chain is the artifact, not just the resulting idea. Show every link: the stimulus, its properties, the force-fit jump, the idea.

Open with a one-paragraph framing of why the technique works (first invocation only). Use a visual marker (emoji) per stimulus. Show the property list and the `→` force-fit arrow inline.

**Label each stimulus with its pool and its kind** — `🗼 The lighthouse beam — Vehicles & Transit [concrete]`. The label is what makes Step 2's minimums checkable: a reader counts the distinct categories, spots two adjacent draws from the same pool, and tallies concrete against abstract. Unlabelled chains make the rule unfalsifiable, which is the same failure as "it feels strained."

Per-stimulus length varies by quality of result. A weak stimulus gets two sentences and abandonment. A strong one gets two to three paragraphs, developed into a concrete direction with precedent where it exists.

### Step 4: Embrace abandonment

Roughly 1 in 4 stimuli will not pay off. **Show this explicitly**, for example: "🪡 The threading of a needle — every fit restated the target. Moving on."

Abandonment is a feature. It signals the method is genuine rather than retrofitted, and it reminds the user that quantity is what creates quality here. Forcing every stimulus to produce a good idea poisons the output.

**The redundancy test.** Before keeping a force-fit, ask: *could I have reached this idea from the target alone, without the stimulus?* If yes, the stimulus did no work — abandon it, however pretty the image. This is the test; "it feels strained" is not, because the operator who wants to look clever never feels strained.

The seductive failure is a stimulus that restates the target as a nicer picture of itself. A river delta laid over a churn dashboard yields "commits flow and deposit sediment" — vivid, and exactly what you already knew. Abandon it.

Hard rule: apply the redundancy test to every attempt, and abandon the stimulus the moment two successive attempts both fail it. A further attempt is worth making only to *confirm* the stimulus is dead, and it must be shown as such — "→ Third attempt: nothing new" — never as hope. Patience belongs to the batch, not to any one object.

### Step 5: Find the meta-pattern

After the batch, scan across the *ideas that landed* for a structural property that kept recurring — "all the strong hits had time or slowness as a feature", "three of the strongest cast the user as a defender, not a buyer", "most of these turned out to be community products, not tools".

Then scan the **abandonments** the same way. They usually share a reason, and that reason is itself a finding: if every dead stimulus died by restating the target, the target has an axis it is missing. Say what the abandonments had in common, not just that they happened. A good meta-pattern explains the failures as well as the hits.

This cross-stimulus observation is often where the deepest insight lives. State it explicitly. Name it mid-batch if it emerges before the end.

### Step 6: Honest ranking, no closure pressure

Pick the 3–5 sharpest directions. Say which feel weak, and why. Do not push the user to commit.

End with an explicit offer: pull more stimuli, go deeper on one direction, switch technique, or stop. The user controls when the technique ends.

## Honesty mechanics

**Abandonment rule:** two force-fit attempts, then the redundancy test from Step 4. A batch where every stimulus produces a viable idea is a tell that the output is fabricated — expect 2–3 abandonments per batch of 8–12.

**When the batch itself fails.** If more than half the stimuli die, do not draw more — that is the move that just failed. A target that nothing external will attach to is over-constrained or wrongly framed, and that is a diagnosis, not bad luck. Name the diagnosis, suggest the technique that fits it as the user's next move, and stop there. Do not run it yourself:

- The target is phrased as a solution rather than a problem, or you suspect you are answering the wrong question → suggest `concept-fan`, which climbs to the concept the solution serves.
- The target is fenced by a constraint so fixed that every stimulus bounces off it → suggest `provocation`, which breaks the constraint on purpose.

**Meta-pattern step:** never skip Step 5. The individual ideas matter less than the structural insight that emerges across them — and the abandonments are part of that scan, not excluded from it.

## What NOT to do

- **Don't sanitize weird ideas.** The unexpectedness is the value. If a force-fit produces something edgy or impractical, ship it as a direction; don't soften it.
- **Don't force every stimulus to produce a viable idea.** Abandonment is honest output.
- **Don't keep a force-fit that restates the target.** A vivid image is not a new idea. If you could have reached it without the stimulus, the stimulus did nothing — abandon it.
- **Don't answer a failed batch by drawing more stimuli.** That is the move that already failed. Diagnose the target and suggest the technique that fits — as a next move for the user, not one you run yourself.
- **Don't repeat stimuli** across batches in the same session.
- **Don't skip the meta-pattern step.** It is where the gold is, and it covers the abandonments too.
- **Don't push the user toward a decision.** The technique is divergent; convergence belongs to the user.
- **Don't run more than ~15 stimuli per batch.** Returns diminish and quality suffers.

## References

- Appendix A below — categorized stimulus inventory to draw from
- Appendix B below — a real session showing the full shape, abandonments included

---

## Appendix A: Stimulus pools

A grab-bag of random stimuli organized by category. **Draw across categories** — clustering defeats the purpose of randomness. When the user provides a triggering metaphor (e.g., "stare out the window" → natural; "in my kitchen" → household), bias toward that pool but always seed 2–3 unrelated stimuli per batch to break the cluster.

Track which stimuli have been used in the current session. On a second batch, prefer fresh draws.

---

### 🌳 Plants & Trees

Oak, willow, redwood, bamboo grove, ivy, mistletoe, fern, lichen on a stone, dandelion, sequoia rings, mangrove roots, rose with thorns, sunflower turning, bonsai, kudzu vine, baobab, cactus, mushroom ring, moss carpet, mistletoe (parasite host), seedling pushing through asphalt, tree stump with new shoots, autumn leaf drop, sap rising in spring, bark beetles tunneling, root system mapping, orchard rows, hedgerow, pine cone opening with heat, fig fruit (with wasp life cycle), grass after rain, dandelion seed dispersal.

### 🌊 Water & Weather

River, glacier, tide, fog, geyser, waterfall, monsoon, rainbow, dewdrop, lightning, hailstones, snowflake, hurricane eye, ocean current, whirlpool, tsunami, lake at dawn, ice in a cocktail, kettle steam, condensation on a window, frozen puddle, blizzard, drought-cracked earth, oasis, aquifer, downpour on a tin roof, evaporation cycle, tide pool, rain shadow, microclimate, calm before a storm.

### ⛰ Geography & Landscape

Volcano, fault line, canyon, archipelago, isthmus, atoll, sand dune, salt flat, badlands, fjord, savannah, peat bog, tundra, river delta, alpine meadow, deep ocean trench, cave system, sinkhole, mesa, geyser basin, hot spring, glacier carve, moraine, river confluence, watershed, plateau, cliff face, scree slope, beach at low tide.

### 🌌 Cosmos & Scale

Black hole, comet, supernova, asteroid belt, nebula, eclipse, solar flare, planet ring system, lunar phase (as lit geometry), gravity well, galactic spiral, dark matter, exoplanet, light from a dead star, perihelion, parsec, cosmic background radiation, microbe colony under microscope, atom orbit, electron shell, mitochondrion, DNA helix, viral capsid, single-cell organism, pollen grain magnified.

### 🐾 Animals & Creatures

Octopus, hummingbird, raven, wolf pack, hermit crab, jellyfish, bat (echolocation), beaver dam, heron stalking, turtle shell, chameleon, peacock display, salmon spawning run, anglerfish, owl on a fence, puppy chasing a tail, cat in a box, sloth, otter holding hands, swan, vulture circling, snake shedding skin, narwhal, axolotl, mole rat colony, parrot mimicry, dolphin echolocation, mongoose vs cobra, coyote singing at dusk, tortoise (longevity), lemur, octopus mimicry, herd of buffalo migrating.

### 🐝 Insects & Microbes

Bee scout returning, ant trail, termite mound, mantis ambush, butterfly metamorphosis, dragonfly hovering, firefly synchrony, locust swarm, mosquito (small but consequential), spider web (geometric), silkworm, weaver ant bridge, slime mold finding shortest path, yeast fermenting, gut microbiome, lichen as symbiosis, mycorrhizal fungal network.

### 🍳 Food & Cooking

Sourdough starter, kimchi fermenting, soup of the day, mise en place, charcuterie board, bread crust, gravy thickening, dough rising, miso, tea steeping, kombucha SCOBY, espresso crema, layered trifle, layered cake, picnic basket, cast iron seasoning, knife sharpening, salt curing, smoking meat, leftovers reheated, bento box, dim sum cart, ramen broth (8 hours), molecular gastronomy foam, recipe substitution, secret family recipe, pickling cucumber, fruit ripening on the counter, banana browning, apple oxidation.

### 🛏 Household Objects

Mirror, mailbox, doormat, key under the doormat, broom, sock missing its pair, knot of yarn, candle, photograph in a frame, refrigerator magnet, ice cube tray, postcard, curtain in a breeze, doorbell, peephole, threshold (the doorsill), attic ladder, garage shelves, junk drawer, rolling pin, bookshelf, clothes hanger, ironing board, vacuum cleaner, washing machine cycle, calendar on the wall, alarm clock, key ring, drawer with hidden compartment, hand-me-down sweater, holiday decorations in a box.

### 🧰 Tools & Machines

Anvil & forge, lathe, hammer, level (bubble), pulley, lever, wedge, screw, scaffold, crane, conveyor belt, sewing machine, typewriter, dial-up modem, fax machine, walkie-talkie, vending machine, cash register, scale, sundial, compass, sextant, abacus, slide rule, microscope, telescope, oscilloscope, 3D printer, CNC mill, soldering iron, paintbrush, kiln, loom, spinning wheel, water wheel, windmill.

### 🚗 Vehicles & Transit

Train (with conductor), tram, lighthouse beam (vehicle for ships), submarine, hot air balloon, sailboat tacking, kayak, dogsled, hovercraft, pneumatic tube, dumbwaiter, escalator, ski lift, ferry, container ship, bicycle, unicycle, wheelbarrow, parade float, ambulance with siren, tricycle, monorail, gondola in Venice, cable car, hot rod, motorcycle, school bus.

### 🎵 Music & Performance

Choir, conductor's baton, drum circle, jazz improvisation, orchestra warming up, lullaby, fugue (counterpoint), rest (silence as part of music), beat drop, harmony stack, key change, encore, soundcheck, mosh pit, singer-songwriter open mic, busker, music box, metronome, vinyl record groove, piano hammer hitting strings, viola section, didgeridoo drone, theater in the round, curtain call, stage left, monologue, ensemble, improv "yes and", soliloquy.

### 🎨 Art & Craft

Origami fold, kintsugi (gold-veined repaired pottery), watercolor bleed, charcoal smudge, mosaic tiles, stained glass, tapestry weave, quilt patch, calligraphy stroke, batik wax-resist, woodblock print, pottery wheel, lost-wax casting, glass blowing, neon sign bending, marbling, photogram, collage, palimpsest (overwritten manuscript), restored painting under x-ray, brushstroke direction, color theory wheel, complementary contrast.

### 📚 Stories & Books

Library card, dog-eared page, bookmark, marginalia, encyclopedia, almanac, dictionary entry, footnote, table of contents, glossary, index, dewey decimal, plot twist, red herring, MacGuffin, in medias res, unreliable narrator, oral tradition, fairy tale (3 wishes, talking animals), myth (origin story), parable, fable, koan, chapter break, prologue, epilogue, sequel, prequel, fan fiction, choose-your-own-adventure.

### 🏛 Buildings & Spaces

Cathedral, library, lighthouse, attic, basement, bunker, treehouse, gazebo, patio, courtyard, atrium, cloister, mezzanine, balcony, pantry, root cellar, walk-in closet, panic room, secret passage, dumbwaiter shaft, fire escape, alley, parking garage spiral, train station concourse, airport gate, hospital waiting room, theater lobby, locker room, sauna, opera house chandelier, museum gallery, planetarium dome, amphitheater, observatory.

### 🎭 Rituals & Ceremonies

Wedding, funeral, graduation, baby shower, christening, bar/bat mitzvah, quinceañera, retirement party, baptism, vigil, oath ceremony, ribbon cutting, ground breaking, christening of a ship, naming day, housewarming, going-away party, ribbon at a finish line, carol singing, advent calendar, lighting Hanukkah candles, fasting, breaking a fast, communion, sweat lodge, tea ceremony, sand mandala (and its destruction), procession, parade, eulogy, toast, vow renewal.

### 🎲 Games & Sports

Chess opening, poker bluff, card shuffle, dice roll, lottery ticket, jigsaw puzzle, crossword, Sudoku, escape room, scavenger hunt, marathon (vs sprint), relay baton handoff, fencing parry, wrestling pin, sumo ritual, surfing wave selection, skateboard line, billiards bank shot, dart bullseye, bowling spare, hopscotch, hide-and-seek, Marco Polo, Monopoly board, Risk, Settlers of Catan, video game checkpoint, save state, easter egg, NPC quest dialog.

### 👤 People & Roles

Lighthouse keeper, midwife, mailman, fishmonger, monk, nun, hermit, shepherd, sentry, bouncer, concierge, librarian, archivist, cartographer, taxidermist, undertaker, blacksmith, watchmaker, perfumer, sommelier, fact-checker, court reporter, simultaneous interpreter, sketch artist, ghostwriter, doula, chaplain, ferryman (mythic Charon), translator, bookbinder, archaeologist sifting dirt, lighthouse-keeper's daughter, scarecrow.

### ⏳ Time & Cycles

Tide (as rhythm), season, sundial shadow, hourglass, lunar phase (as calendar), menstrual cycle, circadian rhythm, jet lag, daylight saving, leap year, decade, century, news cycle, fiscal quarter, election cycle, harvest, sowing, dormant winter, equinox, solstice, eclipse cycle, generations, geologic era, erosion, fossil layer, tree ring, ice core (climate record), carbon dating, sleep cycle (REM), heartbeat, breath in/out.

### 🎨 Sensory & Perceptual

Petrichor (rain on dry earth), color of dusk, the smell of an old book, sound of a door closing softly, texture of velvet, weight of a wet towel, taste of metal, sting of cold hands warming up, déjà vu, tip-of-the-tongue feeling, earworm, optical illusion, blind spot, peripheral vision, the "presence" of being watched, white noise, silence at 3 a.m., warmth of a hand, chill in a basement, sour going to sweet (kombucha), umami, sense of time slowing, motion sickness, vertigo, nostalgia for a place you've never been (saudade), the click of a lightbulb burning out.

### 💭 Abstractions & Concepts

Gravity, momentum, friction, entropy, equilibrium, threshold (critical point), quorum, critical mass, emergence, feedback loop, fork in the road, watershed moment, network effect, escape velocity, point of no return, Rubicon, palimpsest, palimpsest of identity, paradox, infinite regress, recursion, fractal, attractor, signal vs noise, false positive, asymmetric warfare, Pareto principle, power law, fat-tail event, Black Swan, opportunity cost, sunk cost, reservation price, asymptote.

### 🎁 Curiosities & Edge Cases

Russian doll (matryoshka), trojan horse, Pandora's box, Ouroboros (snake eating tail), Klein bottle, Möbius strip, Penrose stairs, Schrödinger's cat, ship of Theseus, broken-window theory, tragedy of the commons, prisoner's dilemma, Nash equilibrium, butterfly effect, chaos pendulum, hidden Markov model, three-body problem, antikythera mechanism, voynich manuscript, dead-letter office, time capsule, unsent letter, message in a bottle, the unopened gift, the expired warranty.

---

### How to draw

For each batch (typically 8–12 stimuli):

1. Start by selecting 6–8 categories at random (no repeat within a batch where possible). **Five distinct categories is the floor** — count them before you begin.
2. From each chosen category, pick 1–2 stimuli at random.
3. If a category feels too on-theme for the target problem, deliberately substitute one with a stimulus from a category that feels *unrelated* — that's where the surprise force-fits live.
4. Within the batch, alternate between concrete physical objects and abstract concepts: **at least two concrete, at least one abstraction**. This is a property of the stimulus, not of its category — `hourglass` and `circadian rhythm` sit in the same pool, but one is an object and the other is a rhythm. Pure-abstract batches feel intellectualized; pure-concrete batches feel mundane. Never place two stimuli from the same category next to each other.

A few stimuli appear in two categories on purpose — *tide* under both Water and Time, *lunar phase* under Cosmos and Time, *threshold* as a doorsill and as a critical point. The category is what tells you which properties to list, so these are genuinely different draws. They still count as used once: do not draw *tide* twice in a session because you found it in two places.

When the user requests "another batch": exclude all stimuli used in this session so far, prefer 3–4 fresh categories, and deliberately swap two of the strong-performing categories for ones that didn't pay off last batch.

---

## Appendix B: Worked example

### Worked Example: Naming a Code-Churn Feature

A real session. The target was a naming and ideation problem:

> "Suggest names for a feature that shows users which parts of their codebase change most often."

Eight stimuli were drawn across six categories — Time & Cycles (×2), Geography & Landscape (×2), Insects & Microbes, Household Objects, Animals & Creatures, Art & Craft. Six concrete, two abstract. That clears the five-category floor and the two-concrete/one-abstract minimum, and no two same-pool draws sit adjacent. Each chain is labelled with its pool and its kind so you can check all three yourself rather than take this sentence's word for it.

Note that kind is a property of the stimulus, not of its pool: *erosion* sits in Time & Cycles beside *hourglass*, but a process is abstract where an object is concrete. *Heron stalking* is filed under Animals, yet the stimulus is the stillness, not the bird.

Six landed; two were abandoned. Both abandonments are shown, because they are the point.

---

### Opening framing

State briefly why the technique works, once per session, before the first chain:

> Staying inside the problem space — files, commits, diffs — routes every association through the same familiar paths, which is why the obvious name is "Hotspots" and why everyone lands there. A stimulus from outside the space breaks the routing. The first stimuli are usually trash; the third or fourth is where real ideas appear — which is why we draw a batch rather than squeeze one object. Look for a stimulus whose *structural property* the target could have but doesn't yet.

---

### The chains

#### 🕰 The hourglass — Time & Cycles [concrete]

Properties: sand falls one way only; the neck is the constraint; you flip it to reset; you can always see how much remains.

→ Force-fit: a codebase's change flows through a neck too — the files everything else must pass through.

**Idea: "Hourglass"** — surface the narrow waist: files with *low* churn but *high* fan-in. Rename one and everything breaks.

Half-hit. It names a chokepoint, not churn. Kept as a weaker direction rather than dressed up as a strong one.

#### 🌋 The fault line — Geography & Landscape [concrete]

Properties: two plates grind past each other; stress accumulates invisibly; release is sudden; the line is mapped precisely *because* it is dangerous.

→ Force-fit: files that change constantly aren't the danger. The danger is where two *teams* grind against the same file. Churn plus authorship equals accumulated stress.

**Idea: "Faultline"** — map files by churn × distinct authors. Not "what changes" but "what changes under contention." Seismologists don't map every tremor; they map where plates meet.

Strong. It reframes the metric and the name carries the warning.

#### 🐜 The termite mound — Insects & Microbes [concrete]

Properties: built with no architect; each termite follows local rules; ventilation shafts nobody designed; constantly repaired.

→ Force-fit: nobody designed the churn hotspots either — they emerge from thousands of local commits.

→ Second attempt: termites repair continuously, so churn as *repair rate*? That is just churn again.

→ Third attempt: nothing new.

**Abandoned.** The emergent-structure insight is genuine, but it collapses into the fault-line idea and every name it yields is worse. Moving on.

#### 🗄 The junk drawer — Household Objects [concrete]

Properties: everything without a home ends up here; nobody owns it; you dread opening it; it works, sort of.

→ Force-fit: every codebase has a `utils.ts`, and it churns precisely *because* it is where homeless code lands.

**Idea: "Junk Drawer"** — flag files whose churn comes from heterogeneity: many unrelated changes, low cohesion. A different signal from Faultline — not contention, but the absence of ownership.

Lands. Immediately legible to any engineer who has opened one.

#### 🦩 The heron stalking — Animals & Creatures [abstract]

Properties: absolute stillness for minutes, then one strike. The stillness *is* the technique, not a pause between techniques.

→ Force-fit: then the stillest files are the interesting ones — untouched for three years, still imported everywhere.

**Idea: "Heron"** — invert the brief. Show what *hasn't* changed and ask whether that is maturity or abandonment. A stable file with heavy use is bedrock; a stable file nobody imports is dead code.

Lands, and it was the surprise of the batch: the stimulus inverted the target rather than serving it.

#### 🏺 Kintsugi — Art & Craft [concrete]

Properties: broken pottery repaired with gold; the repair is highlighted, never hidden; the object is more valuable after breaking than before.

→ Force-fit: the highest-churn files are the most-repaired files. What if the dashboard rendered them gold-veined instead of red-alerted?

**Idea: "Kintsugi view"** — churn as accumulated care rather than accumulated risk. The most-changed file is the most-tended file.

Lands as a visual mechanic more than as a name. It reframes the tool's entire emotional register.

#### 🌊 The river delta — Geography & Landscape [concrete]

Properties: one channel splits into many; sediment deposits where flow slows; the shape changes yearly; the map is obsolete the moment it prints.

→ Force-fit: commits flow from trunk into branches, depositing change downstream...

→ Second attempt: sediment as accumulated churn in leaf modules. But that is Faultline's measure, drawn prettier.

→ Third attempt: the delta's shifting map — a churn dashboard is stale the moment it renders? That is a caveat, not a product.

**Abandoned.** The sediment image is seductive and every fit reduces to a restatement of churn. Moving on.

#### ⏳ Erosion — Time & Cycles [abstract]

Properties: slow, invisible day to day, total across years; the softest rock goes first; what resists is left standing as landmarks.

→ Force-fit: run churn across years rather than weeks. What is left standing is architecture; what eroded was scaffolding.

**Idea: "Bedrock"** — the dashboard as a geological cross-section. Whatever survived five years of churn is the real architecture, whatever the docs claim.

Lands, and it pairs naturally with Heron.

---

### The meta-pattern

Six landed, two were abandoned. Scanning only the ideas that landed — Faultline, Junk Drawer, Heron, Bedrock, Kintsugi, Hourglass:

**Four of the six invert the brief.** The request was "show which parts change most often," yet the strongest results surfaced what *doesn't* change (Heron, Bedrock, Hourglass) or recast change as a positive (Kintsugi). The two that stayed literal succeeded by adding a *second axis* to churn — authorship for Faultline, cohesion for Junk Drawer — rather than by measuring churn harder.

So: **raw churn is not the interesting signal.** Churn is only meaningful against a second axis. Against contention it means risk. Against ownership it means rot. Against time it means the difference between scaffolding and architecture. Against nothing, it means very little.

That also explains both abandonments. The termite mound and the river delta each restated churn as a prettier picture of itself and supplied no second axis. They didn't fail because the stimuli were weak; they failed because they were *redundant* — which is exactly the diagnostic the meta-pattern step exists to surface.

---

### Honest ranking

Strongest, in order:

1. **Faultline** — churn × authors. Reframes the metric, and the name does the warning for you.
2. **Heron** — inverts the brief entirely; the absence of change is the finding. Highest risk of confusing users who asked for churn.
3. **Junk Drawer** — churn × cohesion. Weakest name, sharpest diagnosis.

Two that surprised me:

4. **Bedrock** — churn over years, not weeks. Pairs with Heron; possibly the same product.
5. **Kintsugi view** — a visual language rather than a name. Would change how the tool *feels* more than what it *shows*.

Weakest: **Hourglass**, which answers a question nobody asked (chokepoints, not churn). Included because pretending it was strong would be dishonest.

Next moves, your call: pull a fresh batch from different pools, go deep on Faultline or Heron, switch to a convergent technique to narrow these, or stop here.

---

*Source: [danium/lateral-thinking](https://github.com/danium/lateral-thinking), MIT licensed.*
