# Fonts: embedding, licensing, and why PDF betrays you

## The finding

Exporting a design as PDF from headless Chrome, some fonts come out as real selectable
`/Type0` text and others as `/Type3` outlines — vector shapes with no text at all,
unselectable, unsearchable, uneditable.

Tested four ways with the same page:

| Font | Source | Result |
|---|---|---|
| Arial | system | `/Type0` real text |
| Segoe UI | system | `/Type0` real text |
| PingAR+LT | `@font-face` web font | `/Type3` outlines |
| PingAR+LT | **installed system font** | `/Type3` outlines |

Installing the font changes nothing. It isn't a loading problem.

## The cause

The OS/2 table of every OpenType font carries `fsType`, a bitfield of embedding
permissions:

| Value | Meaning |
|---|---|
| 0 | Installable — embed freely |
| 2 | Restricted — must not be embedded |
| 4 | **Preview & Print only** |
| 8 | Editable — embed, and the document may be edited |

PingAR+LT has `fsType = 4`. Chrome reads it, honours it, and converts the glyphs to
outlines rather than embedding a font it isn't licensed to embed. This is correct
behaviour, not a bug, and there is no flag to turn it off.

Check any font:

```python
from fontTools.ttLib import TTFont
f = TTFont(path)
print(f["OS/2"].fsType, "|", f["name"].getDebugName(6))
```

## The consequence that actually matters

**PDF embeds fonts. PSD only references them by name.**

So a licence restriction that makes editable-text PDF impossible has *no bearing* on
PSD. A PSD text layer stores the string, the PostScript name, and the styling —
nothing from the font file. Photoshop resolves the name against whatever is installed
when the file opens.

This is why "the client wants to edit the text" is answerable with PSD even when it
isn't with PDF.

The condition is that the client has the font installed. Which leads to:

## Do not send the font file to the client

`fsType = 4` means preview and print. Redistributing the file is a licence breach,
and it's yours to answer for, not theirs. Instead:

- Tell them the exact font name and where to buy it.
- If they already licensed it, tell them to install it — most brand fonts arrived with
  the brand kit and are sitting in a folder somewhere.
- If they can't get it, ship raster text layers alongside the live text layers, so the
  file still looks right when the font is missing. `retext.py` masters keep both.

Make the script say so out loud when the font isn't found, rather than letting
Photoshop substitute silently:

```javascript
if (missingFont.length) {
  alert('Font not installed on this machine:\n\n' + missingFont[0] +
        '\n\nText will render as empty boxes.\nInstall it and run again.');
}
```

## Export format, by what the client needs

| They want to | Give them |
|---|---|
| Edit text, keep the layout | **PSD** with live text layers + the font name |
| Edit everything, no Photoshop | PSD anyway — Photopea opens it free in a browser |
| Print it | PDF (outlines are fine — nobody edits a print PDF) |
| Post it | PNG at final size |
| Rebuild it in Illustrator | SVG, but Arabic will need the shaper's output baked to paths |

Photopea is worth naming explicitly for clients without a Creative Cloud licence. It
reads layered PSDs including live text, runs in the browser, and is free.
