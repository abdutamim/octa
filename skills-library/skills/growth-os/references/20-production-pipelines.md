# 20 — Production Pipelines

The strategy refs decide WHAT to make (05 content, 06 hooks, 08 carousel
design, 17 static ads, 19 video craft). This file is HOW it gets rendered on
this machine — real commands, real paths. Everything here is tested; do not
re-derive it, and do not re-download tools that already exist.

Base folder for relative paths: `C:\Users\Admin\Desktop\Tamim Portfolio\`.

## The plant at a glance

| Output | Pipeline | Lives in |
|---|---|---|
| Carousel / static-post PNGs | HTML+CSS chassis → Playwright | `carousel-forge` skill (+ `tamim-carousel` for Tamim, `carousel-studio` for any brand) |
| Generated photos (faces, scenes) | Gemini `gemini-3-pro-image` | `social-v2/gen.mjs` · vibe system example in `social-v4/` |
| Cinematic AI clips (10s, with audio) | Gemini Omni | `social-v3/omni.mjs` |
| Kinetic-type reels (Arabic-safe) | Remotion (React) | `social-v2/video/` |
| Arabic voice-over | Gemini TTS | `social-v2/video/tts.mjs` |
| Motion QA — "eyes" | Gemini video analysis | `social-v2/video/watch.mjs` |
| Cutouts / alpha | Python helpers | `social-v2/cut.py`, `cutout.py`, `chroma.py` |
| Frame assembly, overlays, cuts | ffmpeg (static build — never re-download) | `C:/Users/Admin/Desktop/Outfred/_reference_build/node_modules/ffmpeg-static/ffmpeg.exe` |

**Keys.** All Gemini calls (images, Omni, TTS, watch) run on ONE key:
`GEMINI_API_KEY` in `social-v2/.env` — the **brand-faces key**, the only key
with image quota. Several scripts fall back to the Outfred social-engine
`.env`; that key is free-tier with **zero image quota**. If an image call fails
with quota errors immediately, you are on the wrong key.

## Images

### Generate
```
node social-v2/gen.mjs --out=<path>.png --ref=me.png,headshot.png --prompt="..."
MODEL=gemini-3-pro-image   # default; override via env
```
- First `--ref` = pose reference, the rest = face clarity. Face-lock work uses
  `social-v4/assets/me.png + headshot.png`.
- **Vibe lock** (`vibe.json`, see `social-v4/vibe.json` as the live example):
  the look written once — six levers (`stock`, `light`, `grade`, `lens`,
  `camera`, `composition`) + `signature` + `antiStyle` — appended to every
  prompt so a whole set reads as one shoot. One vibe per set; change it only
  deliberately. Dry-run the prompt list (`--dry`) before any batch.
- **Prompt anatomy that works** (see `social-v4/shots.json`): subject identity
  clause (hair/beard/wardrobe, verbatim every time) + one concrete action +
  ONE light source + lens/angle + subject placement + an **explicit empty zone
  reserved for typography** + film grade words. Every generated image must
  reserve clean space for type — that is the difference between a photo and a
  slide background.

### Render (type over image → final PNG/JPG)
- The render system is owned by the `carousel-forge` skill
  (`references/pipeline.md` there): data.js + HTML chassis → Playwright
  screenshot. `social-v3/render.mjs` renders 1080×1350; `social-v4/` is the
  newest live project; `social-v2/` holds older variants (ed/ed2/ed3, covers).
- Static ads (ref 17 formats) render through the same chassis — an ad is a
  one-slide carousel with a harder hook and one job.
- Canvas: 1080×1350 posts · 1080×1920 reels/stories.

## Video — the three reel recipes

| Recipe | When | How |
|---|---|---|
| **A — Cinematic** | Human/atmosphere hook scenes | Omni generates the scene → Arabic typography overlaid by our HTML system → ffmpeg overlay/cut |
| **B — Pure kinetic** | Word-by-word Arabic type, collages, logos | HTML/CSS animation → Playwright shoots frames → ffmpeg assembles 30fps. Pixel-perfect Arabic, zero AI |
| **C — Hybrid** | Moving gradient/generated bg + type layer | CSS animated background + HTML type, assembled like B |

### Omni (recipe A source material)
```
node social-v3/omni.mjs "<detailed prompt>" out/hook.mp4
```
- Verified: `POST /v1alpha/interactions`, model `gemini-omni-flash-preview`,
  synchronous response, video in `steps[] → model_output → content[0]` base64.
- Output: 10s · 1280×720 · 24fps · AAC audio baked in.
- Cost ≈ **58k output tokens per generation** — write the prompt right the
  first time; no casual retries. Fallback when Omni is busy: `veo-3.1-*`
  models on the same key (`predictLongRunning` + polling).
- Arabic in prompts must travel through **Node** (fetch/URLSearchParams) —
  git-bash curl mangles UTF-8. Arabic filenames on disk: use PowerShell.

### Remotion (recipe B engine)
```
cd social-v2/video
npm run studio      # live preview
npx remotion render # final MP4
```
- `src/`: `Promo.jsx` (composition) · `motion.js` (easing helpers) ·
  `schedule.js` (beat timing) · `vo-manifest.json` (VO line timings).
  Assets in `public/` (fonts, vo, work).
- **Arabic-spans trap:** never split Arabic strings into per-letter/пер-word
  spans for animation — shaping and ligatures break. Animate whole lines or
  pre-shaped blocks.

### Voice-over (Gemini TTS)
```
node social-v2/video/tts.mjs               # generate + split
node social-v2/video/tts.mjs --split-only  # re-split without a new API call
```
- Model `gemini-2.5-flash-preview-tts`, voice `Charon`, 24kHz WAV → ffmpeg
  splits per line into `public/vo/`.
- **One API call for the whole script.** Per-line calls give a different
  voice/performance every time. Edit the `LINES` array, regenerate once.
- Write lines **with tashkeel** (بَعْمِل مَواقِع...) — diacritics are what make
  Egyptian delivery come out right.

### Eyes — QA and reference cloning
```
node social-v2/video/watch.mjs <video.mp4> ["custom question"]
```
- Sends the video to `gemini-3-pro-preview` with a motion-designer teardown
  prompt: shot list, exact on-screen text, per-element motion with easing,
  stagger, transitions, typography, colour, beat sync, premium factors.
- Inline limit ~19MB — trim with ffmpeg first.
- Use it twice: to reverse-engineer a reference before building (19's method),
  and to QA our own render against intent before publishing. ffmpeg frame
  extraction gives static composition; watch.mjs gives the motion.

## QA gates before anything leaves this file
1. Thumbnail test: the post reads at 300px wide (08's contrast rules).
2. Arabic shaping correct on frame 1 and every type frame (recipe B renders
   are safe; anything AI-generated with Arabic in-frame is not — overlay type
   ourselves, never ask the model to render Arabic).
3. Video: watch.mjs teardown on our own render; beats land on cuts.
4. Naming for publish: `{id}-{nn}.jpg` per ref 24 before handing off.

## Use with
05 · 06 · 08 · 17 · 19 · 24 · `profiles/` (paths above are the Tamim plant;
client work scaffolds fresh via carousel-forge `init.mjs` — see
`profiles/_client-template.md`).
