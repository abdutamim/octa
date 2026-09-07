# 19 — Video Craft

Story, storyboard, motion, and scene design for short video — the craft layer, tool-agnostic.
The local render/TTS commands live in ref 20; nothing here depends on a specific editor.
Sources: a viral documentary-reel breakdown (Remotion + Claude Code) and a SaaS-explainer
storyboard tutorial (After Effects). The principles transfer to any stack.

---

## Reel anatomy (documentary-style reel)

| Spec | Value |
|---|---|
| Voice lines | 5–6, no more |
| Length per line | ~5 seconds |
| Total runtime | 25–30 seconds |
| Scenes | one per voice line (6 lines = 6 scenes) |
| Canvas | 1080×1920 vertical @ 30 fps |
| Assets per scene | ~4 (background + midground + foreground character + treatment) |
| Motion helpers | posterize-time boil, ping-pong entrance |

**Voice-over comes first. The storyboard rides on it.** Lock the voice lines before touching
a single visual — every scene, cut, and keyframe is timed against the audio.

**Retell a known story; do not invent one.** Every good story has already been told — great
creators are not more original, they retell a good story better. A proven 6-beat arc:

```
Beat 1  Underdog pitches the giant   "In 2000, Netflix pitched Blockbuster to buy them out"
Beat 2  Concrete ask                 "They asked for $50 million"
Beat 3  Rejection                    "Blockbuster laughed them out of the room"
Beat 4  Build the opposite           "No late fees, no stores, customer first"
Beat 5  Reversal with a number       "10 years later, Blockbuster closed 1,000 stores — bankrupt"
Beat 6  Scale of the win             "Today Netflix drives $45 billion a year"
```

One beat = one voice line = one scene.

---

## Storyboard discipline

Run this order. Do not pass a gate until the previous one is locked.

1. **Voice lines locked** (5–6 lines).
2. **Choreography per scene** — prompt for it, then iterate; the first pass is rarely the best.
   Good choreography is one sentence: "The boss stands before a dead Blockbuster; the shot
   punches in with him and the store scaling together."
3. **Asset sheet** — per scene: background (wallpaper/sky), midground (building/prop),
   foreground character, treatment overlays. Source is irrelevant (Google Images, image-gen,
   asset packs); completeness is not. What sells the reel is choreography, never asset origin.
4. **Build scene by scene, then merge into one master reel.** Never build the whole reel in
   one composition: fix something in scene 1 and something else breaks in scene 6.
5. **Fine-tune pass per scene** — alignment details sell it (the logo rests ON the hands,
   the eyes track correctly, the prop marks the logo).

**Direct edits by frame number, never by timestamp.** Read the frame counter and give a
range: "motion blur from frame 56 to 67." It lands exactly where named; "right after X
happens" plus screenshots does not.

**Make two storyboard versions — one rejected, one approved** — and paste the final rendered
frame next to each storyboard frame (before/after). Personal projects can stay rough; for a
client, draw every frame properly so they see the intended animation before you build it.

---

## Film treatment — what makes digital images cinematic

Stack these on every scene. This is the whole difference between "a digital image" and film.

| Layer | Spec |
|---|---|
| Film grain | always on |
| Grunge wash | dirt/texture overlay |
| Scan lines | 1.6 px black lines @ 16% opacity |
| Vignette | darkened edges |
| Corner blur | soft focus falloff in the corners |
| Gate weave | slight frame wobble, like a projector |
| Texture sandwich | two textures at different brightness/contrast |
| Color grade | unify every asset into one palette |

---

## Scene techniques (the exact tricks)

| Technique | How |
|---|---|
| Weld / detach | Frame graphic welded to the image behind it; on the zoom-in it detaches at a set frame |
| Character boil | Subtle posterized drift on the character so a still feels hand-drawn alive |
| Cloud drift | Background clouds move slowly; even buildings get a very slight shift |
| Parallax | Background zooms slower than the character zooms |
| Fake contact shadow | Duplicate the character image, blacken it, skew it, project it on the floor by the feet |
| Smoke / particles | Layer stock smoke, screen-blend, add contrast (lift then crush the greys), feather the edges so it dissipates |
| Newspaper fly-ins | One after another — stagger the timing AND vary each direction, or it reads rushed instead of organic |
| Lamp swing + light | Static scene → turn the light on and swing the lamp; direct it with the lamp's exact position and frame |
| Cache highlight flicker | Sepia + saturation + hue-rotate on the desk highlight; held static it looks fake — flicker it with hold keyframes |
| Motion blur | Applied over an exact frame range only (e.g. frames 56–67), at the punch-in |
| Scene reuse | Final scene = an earlier scene with character + background swapped; the punch-in animation stays identical |
| Plain-words direction | Describe motion as a human gesture — "a finger wag, like an actual no-no-no" — not as formulas |

The life test: play the scene twice. If nothing drifts, boils, or shifts, it is a slideshow,
not an animation.

---

## Sound layer

Three stems mixed under the master reel:

1. **Voice-over** — recorded first (see anatomy)
2. **Per-scene SFX** — impacts, whooshes, ambience on the cuts
3. **Music bed**

The source video generated VO + SFX with ElevenLabs; our stack uses Gemini TTS — commands in ref 20.

---

## SaaS explainer craft

**Topic gate: one clear idea a stranger of any age understands instantly.** "Order food
inside ChatGPT." Do not pass this gate until the idea survives a one-sentence telling.
Fancy animation never rescues a muddy topic.

**List the features BEFORE writing the script** (payment gateway, backend UI, the
integration, new app UI, voice agent…). The feature list generates the script — never the
reverse.

**Script structure: hook → body → CTA.**

| Part | Job | Verbatim example from a shipped script |
|---|---|---|
| Hook | one of the 3 modes below | "The future of e-commerce is about to change — and it all begins with a conversation." |
| Body | features + how it works in real life | "GPT searches nearby restaurants and surfaces the best options instantly. It compares price, ratings, delivery time and overall value — so you don't have to." |
| Reveal / CTA | name the thing, then what they can now do | "Introducing GPT-6 with Uber Eats integration. Now you can order directly inside ChatGPT." |

Three hook modes: **positive** (open with the good news), **negative** (open with the
problem/situation), **informative** (open with awareness — the example above is informative).

**Write the draft yourself — 50–70% of the work.** Structure it with your own brain, then
hand the draft to the LLM to enhance and produce variants, and select the best sentences.
The LLM's share is 20–30%. Never invert the ratio.

**Explainer scene grammar (tool-agnostic):**
- **Show the backend.** Visualize what the product does behind the curtain as a flowchart of
  floating cards (analyze → find restaurants → compare pricing…) with connector lines that
  draw on. Give every card its OWN slight drift — copy-pasted keyframes read fake, random
  movement reads authentic. Floating means slow.
- **Use real assets.** Official Figma community UI kits for the product (panels, icons, food
  images) and real in-app reviews — mixed ratings, 5-star AND 1–2-star, so it reads true.
- **One color theme, minimal.** Match the brand hue (ChatGPT video → blue family), copy one
  hex across every gradient. Kill decorative shapes behind text.
- **Randomize grid reveals** instead of sequential order — but keep the center cell fixed:
  it is the focus.
- **Depth by blur:** blur the duplicated back/side layers (~13%) so the hero layer pops.
- **Jitter on purpose:** posterize time to ~12 fps for stop-motion texture; scroll lists as
  stop-motion with hold keyframes, each item snapping to center.
- **Integration metaphor:** two logos push a link icon between them; when they meet, the
  link rotates — the connection is shown, never said.

**Inspiration is a system, not a mood.** Watching outlier videos does nothing unless you
SAVE them: boards in Figma (everyone), FreeForm (iOS), Pinterest — separate boards per
type — plus a feed curated to surround you with designers and SaaS explainers. When a
client needs ideation, you re-watch the board: ideation becomes instant retrieval, not a
blank page. Study channels with strong scripting (Base44, Vix Studios, ElevenLabs).

---

## Use with

- **06 — Attention, Hooks & Scripts:** the hook owns the first 2 seconds of any reel; the
  three explainer hook modes slot under its rules.
- **05 — Content System:** where reels and explainers sit in pillars, cadence, and the 3C split.
- **20 — Production Pipelines:** the local stack (Remotion, Gemini TTS, render commands)
  that executes this craft.
