# Writing a PSD without Photoshop

For when Photoshop isn't installed, isn't licensed, or must not be launched — and you
still need a layered file.

`scripts/psdwriter.py` is a working, tested writer: RGB, 8-bit, RLE-compressed,
arbitrary named layers with alpha, plus the flattened composite. It's ~180 lines and
Photoshop opens its output without complaint.

```python
from psdwriter import write_psd
write_psd("out.psd", 1080, 1920,
          [("background", rgba_array), ("headline", rgba_array)],   # bottom → top
          flattened_rgb_array)
```

Layers are `(name, numpy uint8 array of shape (H, W, 4))`. The composite is
`(H, W, 3)`. Every layer is full-canvas — simplest correct thing, and PackBits
compresses the transparent regions down to nothing.

---

## Don't use pytoshop

It produces files Photoshop rejects with *"Could not complete your request because the
file is not compatible with this version of Photoshop."* When a file does open, the
composite can render solid black. Debugging its output costs more than writing the
format, which is why `psdwriter.py` exists.

`psd-tools` for **reading** is excellent. It just can't write.

---

## Format notes that cost time

**Channel order per layer is alpha first**, then R, G, B — IDs `-1, 0, 1, 2`. Get this
wrong and you get a plausible-looking image with swapped channels.

**Resolution resource (ID 1005) — set it to 72 dpi.** Photoshop's type engine converts
between points and pixels using the document resolution. At 72 dpi they're 1:1, so a
size of `66` in your generator means 66 pixels on canvas and matches the CSS you
rendered from. At 300 dpi the same number is four times bigger and nothing lines up.

```python
res = (struct.pack(">I", 72 << 16) + struct.pack(">HH", 1, 1)) * 2
block = b"8BIM" + struct.pack(">H", 1005) + bytes(2) + struct.pack(">I", len(res)) + res
```

**Layer names need both encodings.** The legacy Pascal string (padded to a multiple of
4) *and* a `luni` tagged block with UTF-16BE. Non-ASCII names show as mojibake in the
Layers panel without `luni`.

**The layer-info block must be even-length.** Pad with a zero byte.

**`flags` bit 1 is "hidden", not "visible".** Zero means visible.

---

## PackBits, where the bodies are buried

Two edge cases produce corrupt output or an outright crash:

**A run of exactly 129.** Chunking greedily gives 128 + 1, and a run of 1 cannot be
encoded as a run — the length byte would be `257 - 1 = 256`, which isn't a byte. The
fix is to never leave a remainder of 1:

```python
while run >= 2:
    k = min(run, 128)
    if run - k == 1:
        k -= 1              # take 127 so 2 remain, not 128 leaving 1
    out.append(257 - k)
    out.append(data[i])
    i += k
    run -= k
if run == 1:
    out.append(0)           # emit the leftover as a literal
    out.append(data[i])
    i += 1
```

**Literal runs** are `length - 1` followed by the bytes, capped at 128.

Round-trip test your implementation before trusting it. All-same, all-different,
alternating, exactly 128, exactly 129, 130, single byte, empty — 11 cases catch
everything.

---

## Speed

Naïve per-row PackBits on a 1080×1920 nine-layer file takes minutes, because most rows
of most layers are entirely transparent and you scan every byte to discover it.

Detect uniform rows with vectorised min/max and emit their RLE directly:

```python
mins, maxs = chan.min(axis=1), chan.max(axis=1)
for y in range(h):
    row = _uniform_row(int(mins[y]), w) if mins[y] == maxs[y] else packbits(chan[y].tobytes())
```

Verify byte-for-byte identical output against the slow path before shipping the
optimisation.

Print per-layer progress. A silent multi-minute build looks like a hang, and the user
will kill it.

---

## What you cannot write this way

**Live text layers.** The `TySh` block plus Adobe's `EngineData` — a nested,
length-prefixed, partly-binary token format — is dense enough that a single wrong byte
makes Photoshop reject the whole document.

The reliable pattern instead: write raster text layers, and ship a `.jsx` that the
user runs once to add live text layers on top and hide the raster ones. Photoshop
builds the text blocks itself, so they're correct by construction. See
`scripts/lib.jsx` → `setStyledText`.

Split raster layers so that hiding the text does not hide the graphics next to it. If
a badge and its caption share one layer, converting the caption to live text makes the
badge disappear — the user notices immediately and it reads as the file being broken.
One layer per thing that can be hidden independently.
