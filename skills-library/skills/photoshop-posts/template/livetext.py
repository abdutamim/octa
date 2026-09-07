# -*- coding: utf-8 -*-
"""
بيولّد سكربت فوتوشوب (.jsx) بيحوّل النصوص لطبقات نص حية قابلة للكتابة.

ليه سكربت بدل ما نكتب طبقات النص في الـPSD مباشرة؟
صيغة طبقات النص في PSD (كتلة TySh + EngineData بتاعة أدوبي) معقّدة
وحسّاسة لدرجة إن غلطة بايت واحد بترفض الملف. السكربت بيخلي فوتوشوب
نفسه يبنيها — مضمون.

الاستخدام عند العميل:
  1. يفتح الـPSD في فوتوشوب
  2. File → Scripts → Browse → يختار ملف الـjsx بتاع نفس الستوري
  3. تظهر طبقات نص حية، وطبقات الصور المقابلة بتتخفي

⚠️ خط Ping AR + LT لازم يكون متثبّت على جهاز العميل — الـPSD بيشير
لاسم الخط بس، مش بيضمّنه (على عكس PDF).
"""
import json, os, re, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8912
IDS = ["01-room", "02-home", "03-facade"]
OUT = os.path.join(HERE, "export")
os.makedirs(OUT, exist_ok=True)

# أسماء PostScript الحقيقية — مقروءة من ملفات الخط المثبّتة، مش تخمين.
# لكل وزن قائمة بدائل؛ السكربت بيجرّبهم بالترتيب لحد ما واحد يشتغل.
PS_FONT = {
    700: ["PingAR+LT-Bold", "PingARLT-Bold", "PingAR+LT-Regular"],
    400: ["PingAR+LT-Regular", "PingARLT-Regular", "PingAR+LT-Bold"],
    300: ["PingAR+LT-ExtraLight", "PingAR+LT-Regular", "PingARLT-Regular"],
}

# كل نص حي بيخفي طبقة الصور اللي هو جزء منها
# مهم: دي بتخفي طبقات النص بس. الجرافيك (بادچ تابي، أيقونات
# التواصل، الفاصل) في طبقات منفصلة وبيفضلوا ظاهرين.
HIDE_FOR = {
    "#hook": "النص الرئيسي", "#service": "النص الرئيسي",
    "#price": "النص الرئيسي", "#kicker": "النص الرئيسي",
    "#ctaTitle": "نص الدفع", "#ctaTagline": "نص الدفع",
    "#waNumber": "نص التواصل", "#igHandle": "نص التواصل",
    "#locName": "نص التواصل",
}


def probe(sid):
    r = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         "--force-device-scale-factor=1", "--window-size=1080,1920",
         "--virtual-time-budget=12000", "--user-data-dir=" + tempfile.mkdtemp(),
         "--dump-dom",
         f"http://127.0.0.1:{PORT}/story.html?id={sid}&rects=1&cb={os.urandom(4).hex()}"],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = re.search(r"<title>RECTS(.*?)</title>", r.stdout or "", re.S)
    return json.loads(m.group(1))["live"] if m else []


def js(v):
    return json.dumps(v, ensure_ascii=False)


HEADER = r"""// طبقات نص حية — آركيدوت {sid}
// افتح الـPSD الأول، وبعدين: File > Scripts > Browse > الملف ده
#target photoshop

var doc = app.activeDocument;
var oldUnits = app.preferences.rulerUnits;
var oldType  = app.preferences.typeUnits;
app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits  = TypeUnits.PIXELS;

var missingFont = [];

function hexColor(hex) {{
  var c = new SolidColor();
  c.rgb.hexValue = hex.replace('#', '');
  return c;
}}

// بنجرّب أسماء الخط بالترتيب. لو مفيش ولا واحد اشتغل بنسجّلها
// ونبلّغ في الآخر — مش بنبلع الخطأ، لأن ساعتها العربي بيطلع مربعات.
function setFont(t, names) {{
  for (var i = 0; i < names.length; i++) {{
    try {{ t.font = names[i]; return true; }} catch (e) {{}}
  }}
  missingFont.push(names[0]);
  return false;
}}

// مُركّب الشرق الأوسط — من غيره حروف العربي بتتفكّك
function arabicComposer() {{
  try {{
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(charIDToTypeID('TxLr'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    d.putReference(charIDToTypeID('null'), r);
    var o = new ActionDescriptor();
    o.putBoolean(stringIDToTypeID('textOverrideFeatureName'), true);
    o.putInteger(stringIDToTypeID('textScriptOverrideType'), 1);
    d.putObject(charIDToTypeID('T   '), charIDToTypeID('TxLr'), o);
    executeAction(charIDToTypeID('setd'), d, DialogModes.NO);
  }} catch (e) {{}}
}}

function addText(name, content, x, y, w, h, size, leading, hex, align, ps, rtl) {{
  var L = doc.artLayers.add();
  L.kind = LayerKind.TEXT;
  L.name = name;
  var t = L.textItem;
  t.kind   = TextType.PARAGRAPHTEXT;
  t.position = [x, y];
  t.width    = w + 8;
  t.height   = h + size * 2;        // مساحة زيادة عشان النص ما يتقصّش
  setFont(t, ps);
  t.size    = size;
  t.leading = leading;
  t.color   = hexColor(hex);
  t.justification = align === 'right' ? Justification.RIGHT
                  : (align === 'center' ? Justification.CENTER : Justification.LEFT);
  t.contents = content;
  if (rtl) arabicComposer();
  return L;
}}

// إخفاء طبقات النص الصور — النص الحي بياخد مكانها
var toHide = {hide};
for (var i = 0; i < toHide.length; i++) {{
  try {{ doc.artLayers.getByName(toHide[i]).visible = false; }} catch (e) {{}}
}}

"""

FOOTER = r"""
app.preferences.rulerUnits = oldUnits;
app.preferences.typeUnits  = oldType;

if (missingFont.length) {{
  alert('\u26a0 الخط مش متثبّت على الجهاز ده:\n\n' + missingFont[0] +
        '\n\nالنص هيطلع مربعات فاضية.\n' +
        'ثبّت خط "Ping AR + LT" وشغّل السكربت تاني،\n' +
        'أو تراجع (Ctrl+Alt+Z) وسيب طبقات الصور زي ما هي.');
}} else {{
  alert('تم — {n} طبقة نص حية.\n\n' +
        'لو العربي طلع مقطّع: اختار طبقة النص،\n' +
        'ومن لوحة Paragraph اختار Middle Eastern composer.');
}}
"""

for sid in IDS:
    live = probe(sid)
    if not live:
        print(f"⚠️  {sid}: مفيش بيانات نص — اتأكد إن serve.py شغّال")
        continue

    hide = sorted({HIDE_FOR[t["sel"]] for t in live if t["sel"] in HIDE_FOR})
    body = [HEADER.format(sid=sid, hide=js(hide))]

    for t in live:
        ps = PS_FONT.get(t["weight"], PS_FONT[400])
        content = t["text"].replace("\n", "\r")      # \r = فاصل السطور في فوتوشوب
        body.append(
            "addText({name}, {txt}, {x}, {y}, {w}, {h}, {size}, {lead}, "
            "{col}, {al}, {ps}, {rtl});".format(
                name=js(t["label"]), txt=js(content),
                x=t["left"], y=t["top"], w=t["width"], h=t["height"],
                size=round(t["size"], 1), lead=round(t["leading"], 1),
                col=js(t["color"]), al=js(t["align"]),
                ps=js(ps), rtl=js(t["rtl"])))

    body.append(FOOTER.format(n=len(live)))

    path = os.path.join(OUT, sid + "-livetext.jsx")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(body))
    print(f"{sid}-livetext.jsx  —  {len(live)} طبقة نص")

# ننسخها كمان لمجلد سكربتات فوتوشوب عشان تظهر في File > Scripts مباشرة
import glob, shutil
PS_GLOB = os.path.join("C:" + os.sep, "Users", "Admin", "Desktop", "Apps",
                       "Adobe Photoshop*", "App", "Program Files", "Adobe",
                       "Adobe Photoshop*", "Presets", "Scripts")
for base in glob.glob(PS_GLOB):
    for f in glob.glob(os.path.join(OUT, "*-livetext.jsx")):
        shutil.copy2(f, base)
    print("واتنسخت كمان لمجلد سكربتات فوتوشوب")
    break

print("\nالناتج في: export/")
