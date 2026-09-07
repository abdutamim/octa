# Layer doctrine

The layer list is the contract between the HTML design, the PSD export, and the
live-text conversion. Get it wrong and the client's file breaks in their hands.

## One layer per independently-hideable thing

The live-text step hides raster layers and puts editable text on top. If a badge
and its caption share one raster layer, hiding the caption hides the badge — the
client opens the file and reports "the icons disappeared" (this happened; it cost
a full rebuild). So:

**Graphics and text that sit together must be separate layers.**

The proven split for a story (bottom → top):

| key | layer name | contents | hidden by live text? |
|---|---|---|---|
| `bg` | الصورة | the photo | no |
| `scrim` | التعتيم | top panel + bottom gradient | no |
| `logo` | اللوجو | brand mark + rule | no |
| `text` | النص الرئيسي | hook/service/price/kicker | **yes** |
| `features` | شريط المزايا | features card (icons + labels together — clients don't retype these) | no |
| `badge` | بادچ تابي | payment badge graphic | no |
| `ctatext` | نص الدفع | payment title + tagline | **yes** |
| `contactgfx` | أيقونات التواصل | contact icons + divider | no |
| `contacttext` | نص التواصل | phone / handle / location | **yes** |

Judgment call embedded there: the features card keeps text and icons together
because that text is fixed brand copy, not per-variant copy. Split only what the
client will actually edit.

## The HTML side of the contract

`story.html?layer=<key>` shows exactly one group on transparency. Separating
graphics from text inside one visual unit is done with show/hide selector pairs:

```js
badge:       { show: [".cta"],     hide: [".cta-text"] },
ctatext:     { show: [".cta"],     hide: [".badge"] },
contactgfx:  { show: [".divider", ".contact"], hide: [".contact span"] },
contacttext: { show: [".contact"], hide: [".contact svg"] },
```

Same container rendered twice with complementary hides ⇒ the two PNGs composite
back pixel-perfectly.

## Naming

- Arabic names for an Arabic-speaking client — the Layers panel is UI for them.
- Names are also your scripting handles (`retext.py`, `livetext.py` target them).
  Once shipped, **never rename**; every downstream jobs file breaks.
- The PSD writer needs both the Pascal name and the `luni` UTF-16 block or Arabic
  names show as mojibake (psdwriter.py handles it).

## Empty layers

Skip layers whose alpha is all zero instead of writing them — an empty layer in
the panel reads as a bug to the client.

## After the client edits

Expect the structure to drift: they group things (`Group 1`, `Group 2`), add
hidden helper layers, scale text via transform. That's fine — their file is now
the master. Read it with `psinspect.py`, clone with `retext.py`, and never
regenerate over it. If their groups replaced your split layers, target the live
text layers inside the groups; the split raster layers underneath are legacy at
that point.
