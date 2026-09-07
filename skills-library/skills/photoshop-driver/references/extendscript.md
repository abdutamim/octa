# ExtendScript cookbook

Photoshop's scripting language is ES3 JavaScript. No `let`, no `const`, no arrow
functions, no `JSON.parse` on older versions, no template literals. Write like 1999.

Two APIs coexist:

- **DOM** (`doc.artLayers`, `layer.textItem`) — readable, but can't touch character
  ranges, most type features, or anything modern.
- **Action Manager** (`ActionDescriptor` / `executeAction`) — can do everything the UI
  can, because it *is* what the UI does. Verbose and undocumented.

Use DOM where it suffices, drop to Action Manager for type.

---

## Boilerplate

```javascript
#target photoshop

var oldUnits = app.preferences.rulerUnits;
var oldType  = app.preferences.typeUnits;
var oldDlg   = app.displayDialogs;
app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits  = TypeUnits.PIXELS;
app.displayDialogs = DialogModes.NO;

try {
  // ...
} finally {
  app.preferences.rulerUnits = oldUnits;
  app.preferences.typeUnits  = oldType;
  app.displayDialogs = oldDlg;
}
```

`displayDialogs = NO` is not politeness — a headless launch with a modal open hangs
until someone walks over to the machine. Colour-profile mismatch and missing-font
warnings are both modals.

Units matter: if `rulerUnits` is anything but PIXELS, every coordinate and size you
set is silently reinterpreted.

---

## Finding layers

`doc.artLayers.getByName()` searches **only the top level**. Anything inside a group
throws "no such element". Recurse:

```javascript
function findLayer(where, name) {
  for (var i = 0; i < where.layers.length; i++) {
    var l = where.layers[i];
    if (l.name === name) return l;
    if (l.typename === 'LayerSet') {
      var hit = findLayer(l, name);
      if (hit) return hit;
    }
  }
  return null;
}
```

`layer.typename` is `'ArtLayer'` or `'LayerSet'`. There is no `isGroup`.

---

## Text

### Simple, one style for the whole layer

```javascript
layer.textItem.contents = "hello";
```

Preserves font, size, colour, transform, composer. When the layer needs exactly one
style, this is the right call — it can't lose anything.

### Multiple styles in one layer (a coloured word)

There is no DOM path. Build a `textStyleRange` list:

```javascript
var d = new ActionDescriptor(), r = new ActionReference();
r.putEnumerated(sID('textLayer'), sID('ordinal'), sID('targetEnum'));
d.putReference(sID('null'), r);

var t = new ActionDescriptor();
t.putString(sID('textKey'), text);

var list = new ActionList(), pos = 0;
for (var i = 0; i < runs.length; i++) {
  var sr = new ActionDescriptor();
  sr.putInteger(sID('from'), pos);
  sr.putInteger(sID('to'),   pos + runs[i].len);

  var st = new ActionDescriptor();
  st.putString(sID('fontPostScriptName'), runs[i].font);
  st.putUnitDouble(sID('size'),    sID('pixelsUnit'), runs[i].size);
  st.putUnitDouble(sID('leading'), sID('pixelsUnit'), runs[i].leading);
  st.putBoolean(sID('autoLeading'), false);

  var col = new ActionDescriptor();
  col.putDouble(cID('Rd  '), R);      // note the trailing spaces
  col.putDouble(cID('Grn '), G);
  col.putDouble(cID('Bl  '), B);
  st.putObject(sID('color'), sID('RGBColor'), col);

  sr.putObject(sID('textStyle'), sID('textStyle'), st);
  list.putObject(sID('textStyleRange'), sr);
  pos += runs[i].len;
}
t.putList(sID('textStyleRange'), list);
d.putObject(sID('to'), sID('textLayer'), t);
executeAction(sID('set'), d, DialogModes.NO);
```

**Send the full style in every run.** Anything you omit is not inherited from the
layer — it falls back to the tool default, and you get 12pt Myriad in the middle of
your headline.

`from`/`to` are character offsets into the string you're setting, not the old one.

### Size and the transform — read this twice

`putUnitDouble(sID('size'), sID('pixelsUnit'), v)` sets the size **as seen on canvas**.
Photoshop stores `v ÷ layer_transform_scale`. On an untransformed layer they're equal
and nothing surprises you. On a layer someone scaled with the corner handles they are
not, and your text comes out the wrong size with no error.

Get the scale from psd-tools (`layer.transform[0]`) and multiply before sending. See
the size trap section in SKILL.md.

### Point vs paragraph text

```javascript
var L = doc.artLayers.add();
L.kind = LayerKind.TEXT;
var t = L.textItem;
t.kind = TextType.PARAGRAPHTEXT;   // must come before position/width/height
t.position = [x, y];
t.width  = w;
t.height = h;
```

Paragraph text clips to its box. Overflow shows a tiny `+` on the handle and is
invisible in a flattened render — so give the box slack (`h + size * 2`) unless you're
certain of the wrap.

Setting `t.kind` *after* setting position resets the position. Order matters.

### Line breaks

`\r`, not `\n`. `\n` inserts a literal control character that renders as a box.

---

## Images

Swap a layer's pixels without disturbing layer order or groups:

```javascript
var old = mustFind(doc, name);
var src = app.open(new File(imgPath));
src.activeLayer.name = 'src';            // renaming converts Background → normal layer
var dup = src.activeLayer.duplicate(doc, ElementPlacement.PLACEATEND);
src.close(SaveOptions.DONOTSAVECHANGES);
app.activeDocument = doc;
dup.move(old, ElementPlacement.PLACEBEFORE);
old.remove();
dup.name = name;
```

`duplicate()` across documents preserves canvas coordinates, so a same-size image
lands at 0,0. Different sizes need an explicit `translate()` or `resize()`.

You cannot `duplicate()` a locked Background layer — renaming it is the standard
unlock trick.

---

## Saving

```javascript
var opt = new PhotoshopSaveOptions();
opt.layers = true;                    // false silently flattens
opt.embedColorProfile = true;
doc.saveAs(new File(path), opt, false, Extension.LOWERCASE);
```

The third argument is `asCopy`. Passing `true` leaves the original document dirty and
the next `close(DONOTSAVECHANGES)` throws away work you thought you saved.

Always `doc.close(SaveOptions.DONOTSAVECHANGES)` when done, including in the catch
block. A leaked open document becomes `app.activeDocument` for the next iteration.

---

## Errors

`executeAction` throws plain `Error` with unhelpful messages. Wrap per unit of work,
collect failures, and report all of them at the end:

```javascript
var failed = [];
for (var i = 0; i < jobs.length; i++) {
  var doc = null;
  try {
    doc = app.open(new File(BASE));
    // ...
    doc.close(SaveOptions.DONOTSAVECHANGES);
    doc = null;
  } catch (e) {
    failed.push(jobs[i].id + ': ' + e);
    if (doc) { try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {} }
  }
}
```

**Never write a bare `try { ... } catch (e) {}` around font assignment.** A swallowed
font error produces empty boxes at render time and you will spend an hour blaming the
font file. Collect the failure and alert.

---

## Getting the incantation for anything else

Install ScriptingListener (ships in Adobe's scripting extras), do the thing once in
the UI, and read the generated code from `ScriptingListenerJS.log` on the desktop.
It's verbose but it's *correct*, which beats guessing at stringIDs.
