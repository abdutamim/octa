# Production — scripts and template

The skill is **global** — it runs from any project, including outside the
repo. Scripts are called by full path and the project can live anywhere.

```powershell
$K = "$HOME\.claude\skills\carousel-forge\scripts"
```

---

## New project

```powershell
node $K\init.mjs my-brand        # or "." for the current folder
```

Creates: `index.html` · `style.css` · `fonts/` · `assets/gen/` · `assets/cut/`
· `data.js` with one working starter post. Also verifies that `playwright`
and `sharp` are present.

**Dependencies — install once for all projects:**
```powershell
npm i --prefix "$HOME\.carousel-forge" playwright sharp
npx playwright install chromium
```
Scripts resolve them in this order: `$env:CAROUSEL_SHARP_PATH` →
`node_modules` inside the project → **`~/.carousel-forge/node_modules`** →
any `node_modules` above the project.

**Writing direction is automatic** and can be overridden per post — see
`scripts-rtl.md`.

> ⚠️ The project is a **copy** of the template. If the template is updated
> later, `render.mjs` will warn you that your files are older — copy them
> across before you chase a bug that no longer exists.

---

## The path

```text
gen.mjs  →  grade.mjs  →  probe.mjs  →  cutout.py  →  data.js  →  render.mjs  →  look
generate     grade        read          cut           typeset     render        with your eyes
```

**Do not skip probe.** Its whole point is telling you where the type can sit
**before** you write coordinates — not after you render and find it
unreadable.

---

## `gen.mjs` — image generation

```powershell
node scripts/gen.mjs --out=assets/p01.png --preset=plate --prompt="..."
node scripts/gen.mjs --out=assets/p01.png --ref=ref/me.jpg --preset=face-lock --prompt="..."
node scripts/gen.mjs --batch=shots.json
```

| Flag | What |
|---|---|
| `--preset=` | `face-lock` · `face-lock-back` · `outpaint` · `cutout-ready` · `plate` · `none` |
| `--vibe=` | path to the lock file (default `./vibe.json`, then `../vibe.json`) · `--novibe` to skip |
| `--dry` | print the assembled prompt and exit. Costs nothing. **Run it before any batch.** |
| `--realism` | swap the film stock for "iPhone" — the credibility lever |
| `--ref=` | Reference images, comma-separated. **First = the pose, the rest = the features** |
| `--n=` | Number of variants (appends `-1 -2` to the filename) |
| `--ar=` | `4:5` (default) · `1:1` · `9:16` · `16:9` · `3:1` |
| `--raw` | Send the prompt through untouched, with no additions |

**Every preset automatically suppresses text inside the image.**

### `vibe.json` — the lock string
Six levers, written once per project, appended to every prompt automatically.
This is what makes twenty images read as **one shoot** instead of twenty
separate good pictures. Hand-writing the look into each prompt drifts; a file
cannot.

```json
{ "subject": "the recurring subject: build, wardrobe, or the hero object",
  "lock": { "stock": "Kodak Portra 400", "light": "...", "grade": "...",
            "lens": "...", "camera": "...", "composition": "..." },
  "signature": "a motif that recurs in every frame",
  "antiStyle": "the generic default you are rejecting",
  "realism": false }
```

**Film stock is the strongest single lever** — a named stock forces identical
grain and contrast every time. **One lock per project. Never mix.**
`antiStyle` matters more than it looks: naming the generic look you reject is
what stops the model reverting to it.
→ [photo-direction.md](photo-direction.md)

**`face-lock-back`** adds a turned/obscured framing. Use it for anything that
is not a deliberate portrait — AI face fidelity falls off fast once the face is
large and front-on.

**`face-lock` is mandatory for any real face.** It injects a
feature-preservation constraint — no beautifying, slimming, lightening,
de-aging, or changing ethnicity. Without it the model returns "someone who
resembles them".

**Batch:**
```json
{ "ref": "ref/me.jpg", "preset": "face-lock", "ar": "4:5",
  "shots": [ { "out": "assets/p01.png", "prompt": "..." } ] }
```

**Key resolution:** `$GEMINI_API_KEY` → `$GEMINI_ENV_FILE` → `./.env` →
`~/.carousel-forge.env`. The script prints which one it used.

> Image generation needs a key with **billing enabled**. A free-tier key
> returns 429 with `limit: 0` on every image model — waiting never helps.

---

## `grade.mjs` — grading and grain

```powershell
node scripts/grade.mjs p01.png --out=p01.png --duotone=#0C1638,#3B5BFF
node scripts/grade.mjs p01.png --out=p01.png --preset=filmic
node scripts/grade.mjs assets/*.png --out=assets/graded --preset=plate
```

| preset | What | When |
|---|---|---|
| `filmic` | lifted blacks · saturation 0.88 · grain 10 · vignette | default for photography |
| `plate` | saturation 0.82 · vignette 0.3 · grain 5 | when the type has to win |
| `mono` | full grayscale + grain 12 | the pattern-break slide |
| `flat` | grain 8 only | solid backgrounds |
| `phone` | harder contrast · no vignette · almost no grain | pairs with `gen --realism`, when polish would read as fake |

Individual flags: `--duotone=a,b` · `--tint=hex,amt` · `--sat=` ·
`--contrast=` · `--lift=` · `--grain=` · `--vignette=`

**Alternative to duotone grading:** darken the image and leave the saturation
alone. The measured target from the reference set: **mean luminance 65–85 out
of 255, saturation 0.41–0.57**. That gives you a plate for type without
killing the photograph.

---

## `probe.mjs` — read the image before you typeset

```powershell
node scripts/probe.mjs assets/p01.png
node scripts/probe.mjs assets/p01.png --grid=6x8 --json
```

**Output:**
```text
PLACEMENT MAP   W=white works · B=black works · ·=mid-tone · #=busy
    0– 12%   W  W  W  W  W  W
   12– 25%   W  W  W  W  W  W
   25– 38%   W  W  ·  W  W  W
   38– 50%   ·  #  #  #  ·  ·
   ...

BEST TYPE BANDS
  y   0– 25%  white       100% clean

PALETTE  (pull the accent from here)
  #0C1638   34.2%  L* 12
  #3B5BFF    8.1%  L* 44
```

### Batch cohesion
```powershell
node scripts/probe.mjs --set assets/gen/*.png
```
Reports exposure, chroma and hue per image and names the outliers. One frame
drifting is what breaks a carousel's cohesion, and it is very hard to see by
flicking between files.

**How to read it:**
- **BEST TYPE BANDS** → put the headline here. The band gives you `y` and the
  ink color.
- **PALETTE** → pull the accent from here. Don't invent a color.
- **L\* spread** → below 45, the image is flat and the cover will die at
  thumbnail size.
- **No clean band?** → the image is wrong. Fix it (push the horizon, outpaint
  above) or make the slide a designed background. **Do not add a scrim.**

---

## `cutout.py` — cut out the subject

```powershell
py scripts/cutout.py assets/p01.png --keep-largest --feather=1.5
py scripts/cutout.py assets/*.png --out=assets/cut --model=birefnet-general
```

| Flag | Why |
|---|---|
| `--keep-largest` | Drops every stray blob. **The number one reason a cutout looks pasted on** |
| `--feather=1.5` | Blurs the matte 1–3px. Kills the sticker edge |
| `--shrink=1` | Erodes the matte by a px so no background halo survives |
| `--model=` | `isnet-general-use` (default) · `u2net` · `birefnet-general` |

It warns you if the subject occupies **>62%** of the frame (no room for a
headline behind them) or **<8%** (the cut failed).

`pip install rembg pillow numpy scipy`

---

## `render.mjs` — HTML → PNG

```powershell
node scripts/render.mjs --dir=<project>
node scripts/render.mjs --dir=<project> --post=01
node scripts/render.mjs --dir=<project> --post=01 --slide=3      # fast iteration
```

**Reads** `<dir>/data.js`, which sets `window.POSTS = [...]`
**Emits:**
```text
out/<id>-<slug>/01..NN.png     the slides
out/<id>-<slug>/PREVIEW.png    contact sheet for the post
out/COVERS.png                 the grid test ← look at this one
out/ALL-SLIDES.png
out/manifest.json
```

### The automatic audit
After each slide it inspects the DOM and prints warnings:
- `overflow` — an element outside the card bounds
- `clipped-line` — a line cut off by `white-space: nowrap`
- `collision` — copy overlapping the fixed chassis
- `low-contrast` / `busy-behind` — it hides every text layer, photographs what
  is actually behind them, and measures. This is the check that catches
  "the copy is invisible against the image"

> **The audit catches geometry, not taste.** "The copy is hidden behind the
> head" and "the image has nothing to do with the copy" will not be caught.
> **Look at `PREVIEW.png`.**

---

## `data.js` — content shape

```js
window.POSTS = [{
  id: "01",
  slug: "carousel-covers",
  title: "Carousel covers",
  slides: [
    {
      type:  "cover",
      image: "assets/p01.png",
      cut:   "assets/cut/p01.png",   // optional — for depth
      focus: "50% 40%",              // object-position
      at:    { t: 210, r: 72, w: 880 },
      hsize: 118,
      kicker:"5 rules",
      lines: [
        { text: "The cover" },
        { text: "decides", accent: true, in: 1 }
      ],
      body:  "…", bodyAt: { b: 200, r: 72, w: 520 }
    }
  ]
}];
```

| Field | What |
|---|---|
| `type` | `cover` · `teach` · `grid` · `cta` |
| `at` / `bodyAt` | `{t,r,b,l,w}` in pixels inside the card |
| `lines[].accent` | the accent color |
| `lines[].in` | line indent (1 or 2) — the organized-scatter rhythm |
| `wash` | `["top","bottom","left"]` — **local only** |
| `hooks[]` | for the grid slide: `{name, text}` |
| `latin` / `rtl` | override the auto-detected direction — see `scripts-rtl.md` |

**How to set `at`:**
1. `probe.mjs` → take the clean band.
2. Convert the % to pixels. `t = y% × 1350`.
3. Render that slide alone: `--post=01 --slide=0`
4. **Look.** Covered? Change `r`, `w`, or `hsize`.

---

## The project

Copy `template/` and swap in the identity:

```text
<project>/
  index.html      the renderer — turns data into slides
  style.css       the identity ← swap colors and fonts here
  data.js         the content
  fonts/          .ttf / .otf
  assets/         images
  assets/cut/     cutouts
  out/            output
```

---

## Before you say "done"

```powershell
node scripts/render.mjs --dir=<project>
```
1. Open `PREVIEW.png` — is every line readable?
2. Open `COVERS.png` — do the three rows read as one brand?
3. Downscale to 350px — is the headline still readable? (That is its size in
   the feed.)

**Don't call it done without looking.**

---

## Dependencies

```powershell
node -v                                    # 18+
py -c "import rembg"                        # rembg pillow numpy scipy
node -e "require('playwright'); require('sharp')"
```

Scripts look for `playwright` and `sharp` in: the project's `node_modules` →
the skill's `node_modules` → the shared install at
`~/.carousel-forge/node_modules`.
