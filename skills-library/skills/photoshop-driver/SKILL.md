---
name: photoshop-driver
description: >
  Drive Photoshop from the terminal — build, edit, clone and verify layered PSDs
  without touching the GUI. Generate ExtendScript (.jsx), launch Photoshop headlessly,
  and read the result back with psd-tools to prove it worked. Covers live editable
  text layers, Arabic/RTL typesetting, character-range colouring, swapping image
  layers, cloning a hand-tuned master into variants, and writing PSDs from scratch
  when Photoshop isn't available.
  Use for: "export this design as a layered PSD", "make the text editable in
  Photoshop", "the client wants to edit it himself", "build the other versions from
  this one", "batch these PSDs", "read what's in this PSD", "the Arabic is broken in
  Photoshop", "طلّعه فوتوشوب", "عايز النص يبقى قابل للتعديل", "اعمل الباقي زي دا",
  "الخط طالع مربعات", "اشتغل على الفوتوشوب".
---

# Photoshop Driver

Photoshop is scriptable and headless-launchable. You do not need the user to click
anything — you generate a `.jsx`, launch Photoshop with it as an argument, wait for
the output files, then **read the result back and prove it's right**.

## Where you're running

- **On the user's machine** (Claude Code / local shell): do everything yourself —
  inspect, generate, launch, wait, verify. Python may be `py`, not `python`.
- **In a sandbox without Photoshop** (claude.ai code execution): you can still do
  most of the job. `pip install psd-tools` works — inspect and verify any PSD the
  user uploads. Generate the `.jsx` and give it to the user to run locally
  (File → Scripts → Browse), then have them upload the result and verify it with
  `psinspect.py --compare`. The verification loop survives; only the launch step
  moves to the user.

```text
inspect → plan → generate .jsx → launch → wait → read back → compare → report
```

The last three steps are not optional. Photoshop silently reinterprets half of what
you send it (see [The size trap](#the-size-trap)). A script that "ran without errors"
is not evidence of anything.

> **ExtendScript API recipes** → [references/extendscript.md](references/extendscript.md)
> **Arabic / RTL / non-Latin** → [references/arabic.md](references/arabic.md)
> **Writing a PSD without Photoshop** → [references/psd-from-scratch.md](references/psd-from-scratch.md)
> **Fonts, licensing, PDF vs PSD** → [references/fonts.md](references/fonts.md)

---

## The one rule that matters

**Never regenerate what a human has hand-tuned. Clone it.**

The moment someone opens your PSD and nudges things, their file contains state your
generator cannot reproduce — groups they made, layers they scaled with the transform
handles, layers they added, things they moved. Regenerating from your source of truth
throws all of it away and they will notice immediately.

So when asked "make the other versions match this one":

1. Open **their** file as the master.
2. Change only the things that genuinely differ between variants (usually: one image
   layer, a few text layers).
3. Everything else — order, groups, transforms, effects, hidden helper layers —
   travels along untouched, for free.

`scripts/retext.py` implements exactly this and is usually the whole job.

---

## Tools

All three take `--help`. Run them with `py` on Windows (there is often no `python`).

| Script | Job |
|---|---|
| `scripts/psinspect.py` | Read a PSD: layer tree, transforms, text contents, fonts, colours, paragraph boxes. `--compare` diffs two files' structure. **Start here, always.** |
| `scripts/retext.py` | Clone a master PSD into variants, swapping named image layers and re-texting named text layers. Emits the `.jsx` and can run it. |
| `scripts/psrun.py` | Find Photoshop, launch it with a `.jsx`, wait for expected outputs to appear. Used by `retext.py`, useful standalone for any script you write. |

```bash
py scripts/psinspect.py master.psd --text
```

```bash
py scripts/retext.py jobs.json --run
```

---

## The size trap

The single most expensive mistake in this domain, so it goes at the top.

A text layer has **two independent scales**: the font size stored in its
`EngineData`, and the layer's own transform matrix. A designer who drags a corner
handle changes the *transform*, not the font size. A layer showing 75px type may
store `FontSize: 66` with a transform of `×1.14`.

When you set size through an ActionDescriptor:

```javascript
st.putUnitDouble(sID('size'), sID('pixelsUnit'), value);
```

Photoshop treats `value` as the **on-canvas** size and stores `value ÷ transform_scale`.
Pass the stored 66 to a `×1.14` layer and you get `66 ÷ 1.14 = 58` stored — the text
renders at 66px where it used to render at 75. Everything looks subtly small and
nobody can say why.

**Always multiply by the layer's transform scale before sending:**

```python
scale   = float(layer.transform[0])          # xx of (xx, xy, yx, yy, tx, ty)
send_size    = stored_size    * scale
send_leading = stored_leading * scale
```

The same applies to `leading`. `retext.py` does this for you.

Catch it by reading the file back: if the stored `FontSize` in the output doesn't
equal the master's, your scale compensation is wrong.

---

## Workflow

### 1. Inspect before you touch anything

```bash
py scripts/psinspect.py master.psd --text
```

You need, per text layer: its **name** (this is the handle you script against), the
**transform**, the **stored font size and leading**, the **PostScript font name**,
and the **colour of every style run**. You need, per image layer, its name and bbox.

If layer names are `Layer 1`, `Layer 1 copy` — stop and ask the user which is which,
or name them yourself in a first pass. Scripting against ordinal positions is how you
destroy someone's file.

### 2. Decide what actually varies

Write it down explicitly. In a typical set of variants only 20% of layers change.
Everything you don't list is guaranteed identical, which is the point.

### 3. Generate, run, verify

```bash
py scripts/retext.py jobs.json --run
```

Then, non-negotiably:

```bash
py scripts/psinspect.py out-a.psd --compare master.psd
```

`--compare` reports layer-by-layer drift in name, kind, visibility, and transform.
Expect **zero** structural drift and only bbox differences (because the text differs).
It also flags stored-font-size mismatches, which is the size trap firing.

### 4. Look at it

```bash
py scripts/psinspect.py out-a.psd --preview out-a.jpg
```

Flatten and actually open the image. Structural equality does not mean it looks right
— text can overflow its box, wrap differently, or collide with graphics beneath.

---

## Hard-won facts

**Launching.** `Photoshop.exe path\to\script.jsx` runs the script on startup. Portable
installs have no registry entry and no COM registration — find the exe by globbing.
`psrun.py` handles both portable and standard installs.

**`app.displayDialogs = DialogModes.NO`** at the top, restore at the end. Otherwise a
single modal (colour profile mismatch, missing font) hangs the run forever with no
output and no error.

**`doc.artLayers.getByName()` only searches the top level.** Layers inside groups are
invisible to it and you get a "no such element" you'll misread as a naming problem.
Use a recursive finder — `lib.jsx` has one.

**Wrap each job in try/catch and always close the doc** in the catch. One failed
variant should not leave a modified document open and poison the next iteration.

**psd-tools quirks** (you will hit all of these):
- `layer._data` on a text layer *is* the `TypeToolObjectSetting` — it has no
  `.tagged_blocks`; go straight to `._data.text_data`.
- Font names come back wrapped in literal quote characters: `"'PingAR+LT-Bold'"`.
  Strip them or Photoshop rejects the name and silently substitutes.
- `FillColor.Values` is **ARGB in 0..1**, not RGB in 0..255.
- `engine_dict['StyleRun']['RunLengthArray']` sums to `len(text) + 1` — Photoshop
  counts a trailing terminator.

**`pytoshop` produces PSDs Photoshop refuses** ("not compatible with this version").
Don't reach for it. If you must write a PSD without Photoshop, see
[references/psd-from-scratch.md](references/psd-from-scratch.md).

**Justification** in EngineData is `0 = left, 1 = right, 2 = center`.

**RGB keys** in an ActionDescriptor colour object are the padded charIDs
`'Rd  '`, `'Grn '`, `'Bl  '` — note the trailing spaces.

**Save with layers explicitly:**

```javascript
var opt = new PhotoshopSaveOptions();
opt.layers = true;
doc.saveAs(new File(path), opt, false, Extension.LOWERCASE);
```

---

## When Photoshop can't be launched

Some machines have no Photoshop, or the user is mid-session with unsaved work and you
must not steal focus. Then:

- **Read-only work** — `psd-tools` alone does everything: inspection, flattening,
  extracting layers as PNG.
- **Building a new layered PSD** — write the bytes yourself.
  [references/psd-from-scratch.md](references/psd-from-scratch.md) has a working
  RGB/8-bit/RLE writer and the PackBits edge cases that corrupt files.
- **Live editable text** — not possible without Photoshop. The text-layer format
  (`TySh` + Adobe `EngineData`) is dense enough that a one-byte error rejects the
  whole file. Ship raster layers plus a `.jsx` the user runs once to convert them to
  live text. That is the reliable pattern.

Before launching, check whether Photoshop is already running and tell the user what
you're about to do if it is — the script will operate on `app` while their documents
are open.
