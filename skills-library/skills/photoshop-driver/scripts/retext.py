# -*- coding: utf-8 -*-
"""
retext — استنسخ PSD أصلي (اتضبط بالإيد) لنسخ متعددة، وغيّر النص والصور بس.

    py retext.py jobs.json              يولّد الـ.jsx وبس
    py retext.py jobs.json --run        يولّد + يشغّل فوتوشوب + يستنى
    py retext.py jobs.json --run --verify   + يقارن الناتج بالأصل

المبدأ: أي حاجة متقولهاش، بتتنقل من الأصل زي ما هي — الترتيب، الجروبات،
الـtransform، الإفكتس، الطبقات المخفية. عشان كده مش بنعيد التوليد.

شكل jobs.json:

{
  "master": "export/01-room.psd",
  "outDir": "export",
  "flatten": true,
  "jobs": [
    {
      "out": "02-home",
      "images": { "الصورة": "img/02-home.jpg" },
      "text": {
        "العنوان": "بيتك *جديد؟*\\nلا تبدأ قبل ما تشوفه.",
        "السعر":  "ابتداءً من 100 ريال"
      }
    }
  ]
}

• المسارات نسبية لمكان jobs.json
• "out" من غير امتداد — بيبقى outDir/out.psd
• *كلمة* جوّه النص = لون التمييز. اللون بيتقرا من الأصل: تاني لون مختلف
  في نفس الطبقة. لو الأصل لون واحد، النجوم بتتشال وخلاص.
• أي طبقة نص متذكرش، نصها بيفضل زي الأصل.

بيحتاج: pip install psd-tools
"""
import argparse, glob, io, json, os, re, subprocess, sys

try:
    from psd_tools import PSDImage
except ImportError:
    sys.exit("محتاج psd-tools:  py -m pip install psd-tools")

HERE = os.path.dirname(os.path.abspath(__file__))
RTL_RE = re.compile(r"[֐-ࣿיִ-﷿ﹰ-﻿]")

# محارف بتطلع مربعات فاضية في أغلب الخطوط العربية — بنبدّلها بالمكافئ العادي
UNSAFE = {"²": "2", "³": "3", "½": "1/2", "¼": "1/4", " ": " "}


def hexof(vals):
    """FillColor.Values = ARGB بقيم 0..1"""
    return "#" + "".join("%02x" % round(float(v) * 255) for v in list(vals)[1:4])


def clean_font(name):
    """psd_tools بيلف الاسم في علامتي تنصيص — فوتوشوب بيرفضه كده وبيستبدل الخط."""
    return str(name).strip().strip("'\"")


def walk(node):
    for l in node:
        yield l
        if l.kind == "group":
            for c in walk(l):
                yield c


def read_master(path):
    """لكل طبقة نص: الخط والحجم والتباعد ولون الأساس ولون التمييز والمقياس."""
    psd = PSDImage.open(path)
    style = {}
    for l in walk(psd):
        if l.kind != "type":
            continue
        sr = l.engine_dict["StyleRun"]
        fonts = [clean_font(f["Name"]) for f in l.resource_dict["FontSet"]]
        d = sr["RunArray"][0]["StyleSheet"]["StyleSheetData"]
        base = hexof(d["FillColor"]["Values"])
        accent = None
        for r in sr["RunArray"]:
            h = hexof(r["StyleSheet"]["StyleSheetData"]["FillColor"]["Values"])
            if h != base:
                accent = h
                break
        size = float(d["FontSize"])
        lead = float(d.get("Leading", size * 1.2))
        # ── فخ المقاس ──
        # الطبقة ممكن تكون متكبّرة بالـtransform مش بحجم الخط. لما نبعت
        # size بالبكسل، فوتوشوب بيفهمها كمقاس على الكانفس وبيخزّن
        # size ÷ scale. فلازم نضرب في المقياس عشان المخزّن يرجع زي الأصل.
        scale = float(l.transform[0])
        style[l.name] = {
            "font": fonts[int(d["Font"])],
            "scale": round(scale, 6),
            "stored_size": round(size, 3),
            "size": round(size * scale, 3),
            "leading": round(lead * scale, 3),
            "base": base,
            "accent": accent,
        }
    return psd, style


def split_runs(raw, st):
    """يقسّم النص لمقاطع حسب *…* — اللي جوّه النجمتين بلون التمييز."""
    out, plain = [], ""
    for i, seg in enumerate(raw.split("*")):
        if not seg:
            continue
        for bad, good in UNSAFE.items():
            seg = seg.replace(bad, good)
        seg = seg.replace("\r\n", "\r").replace("\n", "\r")   # \r = فاصل السطور
        out.append({"len": len(seg),
                    "hex": st["accent"] if (i % 2 and st["accent"]) else st["base"],
                    "font": st["font"], "size": st["size"], "leading": st["leading"]})
        plain += seg
    return plain, out


TEMPLATE = """// اتولّد بـ retext.py — متعدّلش بإيدك، عدّل jobs.json وأعِد التوليد
// File > Scripts > Browse، أو:  py psrun.py <الملف ده> --expect ...
#target photoshop

__LIB__

var BASE = __BASE__;
var JOBS = __JOBS__;

var oldUnits = app.preferences.rulerUnits;
var oldType  = app.preferences.typeUnits;
var oldDlg   = app.displayDialogs;
app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits  = TypeUnits.PIXELS;
app.displayDialogs = DialogModes.NO;   // من غير دي، أول ديالوج بيعلّق الرن للأبد

var done = [], failed = [];
for (var j = 0; j < JOBS.length; j++) {
  var job = JOBS[j], doc = null;
  try {
    doc = app.open(new File(BASE));
    // ملحوظة: الصور مصفوفة مش أوبچكت — ExtendScript بيتعتّر في for...in
    // على مفاتيح غير لاتينية، وأسماء الطبقات هنا عربي
    for (var i = 0; i < job.images.length; i++)
      swapImageLayer(doc, job.images[i].layer, job.images[i].path);
    for (var k = 0; k < job.texts.length; k++) setStyledText(doc, job.texts[k]);
    savePSD(doc, job.out);
    if (job.flat) saveFlat(doc, job.flat, 10);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    doc = null;
    done.push(job.id);
  } catch (e) {
    failed.push(job.id + ': ' + e);
    // لازم نقفل المستند في كل الحالات، وإلا الجوب اللي بعده بيشتغل عليه
    if (doc) { try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {} }
  }
}

app.preferences.rulerUnits = oldUnits;
app.preferences.typeUnits  = oldType;
app.displayDialogs = oldDlg;

alert((failed.length ? '\\u26a0 ' : '\\u2713 ') +
      'تم: ' + (done.length ? done.join('\\u060c ') : '\\u2014') +
      (failed.length ? '\\n\\nفشل:\\n' + failed.join('\\n') : ''));
"""


def build(spec_path):
    root = os.path.dirname(os.path.abspath(spec_path))
    spec = json.load(io.open(spec_path, encoding="utf-8"))

    def rel(p):
        return os.path.abspath(os.path.join(root, p))

    master = rel(spec["master"])
    if not os.path.exists(master):
        sys.exit("الأصل مش موجود: " + master)
    outdir = rel(spec.get("outDir", "."))
    os.makedirs(outdir, exist_ok=True)

    psd, style = read_master(master)
    print("الأصل: %s  (%dx%d)" % (os.path.basename(master), psd.width, psd.height))
    for n, s in sorted(style.items()):
        print("  %-16s %-22s %s على الكانفس (مخزّن %s ×%.3f)  %s%s" % (
            n, s["font"], s["size"], s["stored_size"], s["scale"], s["base"],
            "  تمييز " + s["accent"] if s["accent"] else ""))
    print()

    jobs, expect = [], []
    for job in spec["jobs"]:
        out = rel(os.path.join(spec.get("outDir", "."), job["out"] + ".psd"))
        images = []
        for lname, p in (job.get("images") or {}).items():
            if lname not in [l.name for l in walk(psd)]:
                sys.exit("مفيش طبقة اسمها %r في الأصل" % lname)
            ip = rel(p)
            if not os.path.exists(ip):
                sys.exit("صورة مش موجودة: " + ip)
            images.append({"layer": lname, "path": ip.replace("\\", "/")})

        texts = []
        for lname, raw in (job.get("text") or {}).items():
            if lname not in style:
                sys.exit("مفيش طبقة نص اسمها %r في الأصل. الموجود: %s"
                         % (lname, "، ".join(sorted(style))))
            plain, runs = split_runs(str(raw), style[lname])
            texts.append({"layer": lname, "text": plain, "runs": runs,
                          "rtl": bool(RTL_RE.search(plain))})

        rec = {"id": job["out"], "images": images, "texts": texts,
               "out": out.replace("\\", "/")}
        if spec.get("flatten"):
            rec["flat"] = out[:-4].replace("\\", "/") + "-preview.jpg"
        jobs.append(rec)
        expect.append(out)

        print("  " + job["out"])
        for t in texts:
            cols = sorted({r["hex"] for r in t["runs"]})
            print("     %-16s %s" % (t["layer"] + ":",
                                     t["text"].replace("\r", " ⏎ ")[:70]))
            if len(cols) > 1:
                print("     %-16s %d مقطع  %s" % ("", len(t["runs"]), "، ".join(cols)))
        for im in images:
            print("     %-16s %s" % (im["layer"] + ":", os.path.basename(im["path"])))

    lib = io.open(os.path.join(HERE, "lib.jsx"), encoding="utf-8").read()
    jsx = (TEMPLATE
           .replace("__LIB__",  lib)
           .replace("__BASE__", json.dumps(master.replace("\\", "/"), ensure_ascii=False))
           .replace("__JOBS__", json.dumps(jobs, ensure_ascii=False, indent=2)))

    jsx_path = os.path.join(outdir, os.path.splitext(os.path.basename(spec_path))[0] + ".jsx")
    # BOM إجباري: من غيره ExtendScript بيقرا الملف بترميز النظام
    io.open(jsx_path, "w", encoding="utf-8-sig").write(jsx)
    print("\nالسكربت: " + jsx_path)
    return master, jsx_path, expect


def main():
    ap = argparse.ArgumentParser(description="استنسخ PSD أصلي لنسخ بنص وصور مختلفة")
    ap.add_argument("spec", help="مسار jobs.json")
    ap.add_argument("--run", action="store_true", help="شغّل فوتوشوب واستنى")
    ap.add_argument("--verify", action="store_true", help="قارن الناتج بالأصل بعد الرن")
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()

    master, jsx, expect = build(a.spec)
    if not a.run:
        print("\nضيف --run عشان يشتغل، أو افتحه من File > Scripts > Browse")
        return

    print()
    r = subprocess.run([sys.executable, os.path.join(HERE, "psrun.py"), jsx,
                        "--expect"] + expect + ["--timeout", str(a.timeout)])
    if r.returncode:
        sys.exit(r.returncode)

    if a.verify:
        bad = 0
        for p in expect:
            print("\n" + "─" * 60)
            bad |= subprocess.run([sys.executable, os.path.join(HERE, "psinspect.py"),
                                   p, "--compare", master]).returncode
        if bad:
            sys.exit("\n✗ فيه فروق جوهرية — راجع فوق")


if __name__ == "__main__":
    main()
