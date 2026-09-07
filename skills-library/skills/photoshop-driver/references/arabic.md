# Arabic, Hebrew and other RTL scripts

Four separate things break Arabic, at four separate layers. Diagnose which one you're
looking at before changing anything — they have completely different fixes and the
symptoms overlap.

| What you see | Cause | Fix |
|---|---|---|
| Letters disconnected, reading left-to-right | No Middle East composer | `textScriptOverrideType = 1` |
| Empty boxes / tofu | Font missing, or wrong PostScript name | Correct name, verify it applied |
| Correct shapes but reversed word order | Bidi not applied — usually a non-Photoshop renderer | Use a real shaper |
| One stray box in otherwise fine text | Character absent from the font (`²`, `‑`, `﴾`) | Substitute the plain equivalent |

---

## 1. The Middle East composer

Photoshop won't join Arabic letters unless the layer uses the ME composer. There's no
DOM property. Per text layer, while it is active:

```javascript
var d = new ActionDescriptor(), r = new ActionReference();
r.putEnumerated(cID('TxLr'), cID('Ordn'), cID('Trgt'));
d.putReference(cID('null'), r);
var o = new ActionDescriptor();
o.putBoolean(sID('textOverrideFeatureName'), true);
o.putInteger(sID('textScriptOverrideType'), 1);
d.putObject(cID('T   '), cID('TxLr'), o);
executeAction(cID('setd'), d, DialogModes.NO);
```

Apply it **after** setting contents. Setting text can reset it.

This requires a Photoshop build with Middle Eastern features. Most modern ones have
them; if the action throws, the user needs to enable
*Preferences → Type → Choose Text Engine Options → Middle Eastern*, then restart.

When the file is going to a client, tell them the manual path too, because they'll
retype something eventually: select the layer, Paragraph panel flyout, Middle Eastern
composer.

---

## 2. PostScript font names

`fontPostScriptName` needs the exact PostScript name, not the family name, not the
menu name. `Ping AR + LT` is the family; `PingAR+LT-Bold` is what the API wants. The
`+` is part of the name — dropping it fails silently and you get boxes.

Read real names from an existing PSD rather than guessing:

```bash
py scripts/psinspect.py master.psd --text
```

Or from the installed font files:

```python
from fontTools.ttLib import TTFont
for p in glob.glob(os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts/*")):
    try:
        f = TTFont(p, fontNumber=0, lazy=True)
        n = f["name"].getDebugName(6)      # 6 = PostScript name
        print(n, "|", f["name"].getDebugName(1), "|", os.path.basename(p))
    except Exception:
        pass
```

Note user-installed fonts live in `%LOCALAPPDATA%\Microsoft\Windows\Fonts`, not
`C:\Windows\Fonts`.

Try a list of candidates and **report** when none work:

```javascript
function setFont(t, names) {
  for (var i = 0; i < names.length; i++) {
    try { t.font = names[i]; return true; } catch (e) {}
  }
  missingFont.push(names[0]);     // surface it — do not swallow
  return false;
}
```

---

## 3. Don't render Arabic with PIL

`PIL.ImageFont` does no shaping. The usual workaround, `arabic_reshaper` +
`python-bidi`, converts text to Arabic Presentation Forms (U+FE70–U+FEFF). Many
modern Arabic fonts — including most commercial ones — do not contain that legacy
block at all, because they implement joining through OpenType `init`/`medi`/`fina`
features instead. Result: every glyph is a box, with a font that works perfectly
everywhere else.

Use a real shaper:

- **Headless Chrome** — HarfBuzz, correct, and you get CSS for layout. Screenshot a
  1080×1920 page.
- **Pango / cairo** — correct, heavier to install on Windows.
- **`uharfbuzz` + manual glyph placement** — correct, most work.

Chrome is almost always the right answer:

```bash
chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1080,1920 \
  --default-background-color=00000000 --virtual-time-budget=6000 \
  --user-data-dir=<fresh temp dir> --screenshot=out.png "http://127.0.0.1:PORT/page.html"
```

Two traps: Chrome caches aggressively against a reused `--user-data-dir`, so use a
fresh one and add a cachebuster query param. And `--virtual-time-budget` must exceed
your font-load and layout time or you screenshot a half-rendered page.

---

## 4. Characters the font doesn't have

Superscripts (`²`, `³`), fractions, ornate brackets, and non-breaking spaces are
commonly absent from Arabic display fonts. One box in an otherwise perfect line is
almost always this.

`retext.py` substitutes the known offenders (`م²` → `م2`). Extend `UNSAFE` when you
find more. Prefer substitution over "just pick another font" — the font is usually the
client's brand.

---

## Layout notes for RTL

- **Kashida / tatweel** (`ـ`, U+0640) stretches a word to fill a line. Useful for
  justified display type; the shaper handles it. Inserting it manually is legitimate
  typography in Arabic, unlike letter-spacing Latin.
- **Never letter-space Arabic.** CSS `letter-spacing` breaks the joins outright.
- Arabic runs **taller** than Latin at the same point size — descenders and dots need
  roughly 1.4–1.6 line-height where Latin wants 1.2.
- Numerals: Arabic-Indic (`٠١٢`) vs Western (`012`) is a regional choice. Saudi and
  Gulf audiences generally read Western digits in commercial design; Egypt and the
  Levant mix. Ask, or copy whatever the brand already uses.
- Egyptian dialect in a Gulf client's copy reads as foreign. Default to MSA for
  Saudi/Gulf work unless the brand voice is explicitly dialect.
