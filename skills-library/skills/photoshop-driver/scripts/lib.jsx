// ── مكتبة ExtendScript مشتركة ──────────────────────────────────────────
// retext.py بيلزق الملف ده في أول كل سكربت بيولّده.
// تقدر كمان تعمله #include في أي سكربت بتكتبه بإيدك.

function sID(s) { return stringIDToTypeID(s); }
function cID(s) { return charIDToTypeID(s); }

function rgb(hex) {
  hex = String(hex).replace('#', '');
  return [parseInt(hex.substr(0, 2), 16),
          parseInt(hex.substr(2, 2), 16),
          parseInt(hex.substr(4, 2), 16)];
}

// doc.artLayers.getByName بيدوّر في المستوى الأعلى بس — الطبقات جوّه
// الجروبات مش بيشوفها وبيرمي "no such element" اللي بتضيّعك.
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

function mustFind(doc, name) {
  var l = findLayer(doc, name);
  if (!l) throw new Error('مفيش طبقة اسمها: ' + name);
  return l;
}

// بيبدّل بيكسلات طبقة صورة من غير ما يلمس ترتيب الطبقات ولا الجروبات.
// بيفترض إن الصورة الجديدة بنفس مقاس المستند.
function swapImageLayer(doc, layerName, imgPath) {
  var old = mustFind(doc, layerName);
  var vis = old.visible, op = old.opacity;

  var src = app.open(new File(imgPath));
  src.activeLayer.name = 'src';                 // بيحوّل Background لطبقة عادية
  var dup = src.activeLayer.duplicate(doc, ElementPlacement.PLACEATEND);
  src.close(SaveOptions.DONOTSAVECHANGES);
  app.activeDocument = doc;

  // ننقلها مكان القديمة بالظبط قبل ما نمسح القديمة
  dup.move(old, ElementPlacement.PLACEBEFORE);
  old.remove();
  dup.name = layerName;
  dup.visible = vis;
  dup.opacity = op;
  return dup;
}

// مُركّب الشرق الأوسط. من غيره العربي بيتفكّك لحروف منفصلة معكوسة.
function arabicComposer() {
  try {
    var d = new ActionDescriptor(), r = new ActionReference();
    r.putEnumerated(cID('TxLr'), cID('Ordn'), cID('Trgt'));
    d.putReference(cID('null'), r);
    var o = new ActionDescriptor();
    o.putBoolean(sID('textOverrideFeatureName'), true);
    o.putInteger(sID('textScriptOverrideType'), 1);
    d.putObject(cID('T   '), cID('TxLr'), o);
    executeAction(cID('setd'), d, DialogModes.NO);
  } catch (e) {}
}

/*
  بيكتب نص + لون/خط/حجم لكل مقطع في نداء واحد.

  spec = { layer, text, rtl, runs: [{ len, hex, font, size, leading }] }

  ⚠ فخ المقاس: size و leading هنا بتتفهم كمقاس على الكانفس، وفوتوشوب
  بيخزّنها مقسومة على مقياس الـtransform بتاع الطبقة. اللي بيبعت لازم
  يكون ضرب في المقياس قبل كده. retext.py بيعمل ده.

  بنبعت الخط والحجم والتباعد مع كل مقطع — لو سبنا حاجة، فوتوشوب بيرجّعها
  للافتراضي بدل ما يورّثها.
*/
function setStyledText(doc, spec) {
  var L = mustFind(doc, spec.layer);
  doc.activeLayer = L;

  var d = new ActionDescriptor(), r = new ActionReference();
  r.putEnumerated(sID('textLayer'), sID('ordinal'), sID('targetEnum'));
  d.putReference(sID('null'), r);

  var t = new ActionDescriptor();
  t.putString(sID('textKey'), spec.text);

  var list = new ActionList(), pos = 0;
  for (var i = 0; i < spec.runs.length; i++) {
    var run = spec.runs[i];
    var sr = new ActionDescriptor();
    sr.putInteger(sID('from'), pos);
    sr.putInteger(sID('to'),   pos + run.len);

    var st = new ActionDescriptor();
    st.putString(sID('fontPostScriptName'), run.font);
    st.putUnitDouble(sID('size'),    sID('pixelsUnit'), run.size);
    st.putUnitDouble(sID('leading'), sID('pixelsUnit'), run.leading);
    st.putBoolean(sID('autoLeading'), false);

    var c = rgb(run.hex), col = new ActionDescriptor();
    col.putDouble(cID('Rd  '), c[0]);
    col.putDouble(cID('Grn '), c[1]);
    col.putDouble(cID('Bl  '), c[2]);
    st.putObject(sID('color'), sID('RGBColor'), col);

    sr.putObject(sID('textStyle'), sID('textStyle'), st);
    list.putObject(sID('textStyleRange'), sr);
    pos += run.len;
  }
  t.putList(sID('textStyleRange'), list);
  d.putObject(sID('to'), sID('textLayer'), t);
  executeAction(sID('set'), d, DialogModes.NO);

  if (spec.rtl) arabicComposer();
  return L;
}

function savePSD(doc, path) {
  var opt = new PhotoshopSaveOptions();
  opt.layers = true;
  opt.embedColorProfile = true;
  doc.saveAs(new File(path), opt, false, Extension.LOWERCASE);
}

function saveFlat(doc, path, quality) {
  var dup = doc.duplicate();
  dup.flatten();
  var opt = new JPEGSaveOptions();
  opt.quality = quality || 10;
  dup.saveAs(new File(path), opt, true, Extension.LOWERCASE);
  dup.close(SaveOptions.DONOTSAVECHANGES);
}
