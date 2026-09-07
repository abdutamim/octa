# -*- coding: utf-8 -*-
"""
psinspect — read a PSD and prove what's inside it.

    py psinspect.py file.psd                 هيكل الطبقات
    py psinspect.py file.psd --text          + تفاصيل النص الحي (خط/حجم/لون/صندوق)
    py psinspect.py file.psd --json          مخرجات JSON للأتمتة
    py psinspect.py out.psd --compare master.psd
    py psinspect.py file.psd --preview p.jpg

--compare هو الخطوة اللي بتثبت إن السكربت اشتغل صح: بيقارن الاسم والنوع
والظهور والـtransform وحجم الخط المخزّن طبقة بطبقة. أي فرق في الهيكل = غلط.
فرق في الـbbox بس = طبيعي لما النص يختلف.

بيحتاج: pip install psd-tools
"""
import argparse, json, os, sys

try:
    from psd_tools import PSDImage
except ImportError:
    sys.exit("محتاج psd-tools:  py -m pip install psd-tools")


def hexof(vals):
    """FillColor.Values في EngineData = ARGB بقيم 0..1"""
    return "#" + "".join("%02x" % round(float(v) * 255) for v in list(vals)[1:4])


def clean_font(name):
    """psd_tools بيرجّع الاسم داخل علامتي تنصيص حرفيتين — فوتوشوب بيرفضه كده."""
    return str(name).strip().strip("'\"")


JUST = {0: "left", 1: "right", 2: "center", 3: "justifyLeft",
        4: "justifyRight", 5: "justifyCenter", 6: "justifyAll"}


def text_info(layer):
    """كل اللي محتاجه عشان تعيد بناء الطبقة دي في مكان تاني."""
    ed = layer.engine_dict
    sr = ed["StyleRun"]
    fonts = [clean_font(f["Name"]) for f in layer.resource_dict["FontSet"]]
    tr = [round(float(v), 4) for v in layer.transform]
    scale = tr[0]

    runs = []
    for i, r in enumerate(sr["RunArray"]):
        d = r["StyleSheet"]["StyleSheetData"]
        size = float(d["FontSize"])
        lead = float(d.get("Leading", size * 1.2))
        runs.append({
            "len":     int(sr["RunLengthArray"][i]),
            "font":    fonts[int(d["Font"])],
            "size":    round(size, 3),
            "leading": round(lead, 3),
            # المقاس اللي بيتشاف فعلاً على الكانفس — ده اللي المصمم شايفه
            "size_on_canvas":    round(size * scale, 2),
            "leading_on_canvas": round(lead * scale, 2),
            "color":   hexof(d["FillColor"]["Values"]),
            "bold":    bool(d.get("FauxBold", False)),
        })

    try:
        pr = ed["ParagraphRun"]["RunArray"][0]["ParagraphSheet"]["Properties"]
        just = JUST.get(int(pr.get("Justification", 0)), "?")
    except Exception:
        just = "?"

    box = None
    try:
        b = layer._data.text_data[b"bounds"]           # صندوق الفقرة قبل الـtransform
        L, T = float(b[b"Left"]), float(b[b"Top "])
        R, B = float(b[b"Rght"]), float(b[b"Btom"])
        box = {                                        # وبعد الـtransform = على الكانفس
            "left":   round(tr[4] + L * scale, 1),
            "top":    round(tr[5] + T * tr[3], 1),
            "width":  round((R - L) * scale, 1),
            "height": round((B - T) * tr[3], 1),
        }
    except Exception:
        pass

    return {"text": layer.text, "transform": tr, "scale": scale,
            "align": just, "box": box, "runs": runs}


def walk(node, depth=0):
    for l in node:
        yield depth, l
        if l.kind == "group":
            for d, c in walk(l, depth + 1):
                yield d, c


def read(path):
    psd = PSDImage.open(path)
    out = {"file": os.path.basename(path), "width": psd.width,
           "height": psd.height, "layers": []}
    for depth, l in walk(psd):
        rec = {"depth": depth, "name": l.name, "kind": l.kind,
               "visible": bool(l.visible), "opacity": int(l.opacity),
               "bbox": list(l.bbox) if l.bbox else None}
        if l.kind == "type":
            try:
                rec["type"] = text_info(l)
            except Exception as e:
                rec["type_error"] = str(e)
        out["layers"].append(rec)
    return psd, out


def show(d, want_text):
    print("%s   %dx%d   %d طبقة" % (d["file"], d["width"], d["height"], len(d["layers"])))
    for r in d["layers"]:
        pad = "  " * r["depth"]
        kind = {"type": "نص حي", "group": "جروب", "pixel": "صورة"}.get(r["kind"], r["kind"])
        print("  %s%-*s %-6s %-6s %s" % (
            pad, 22 - len(pad), r["name"], kind,
            "مرئية" if r["visible"] else "مخفية", r["bbox"]))
        t = r.get("type")
        if not (want_text and t):
            continue
        print("      نص: %r" % t["text"])
        b = t["box"]
        print("      مقياس ×%.3f   محاذاة %s%s" % (
            t["scale"], t["align"],
            "   صندوق %sx%s @(%s,%s)" % (b["width"], b["height"], b["left"], b["top"]) if b else ""))
        for i, run in enumerate(t["runs"]):
            print("        [%d] %-22s %s ← مخزّن %s   تباعد %s   %s   %d حرف" % (
                i, run["font"], run["size_on_canvas"], run["size"],
                run["leading_on_canvas"], run["color"], run["len"]))
        if r.get("type_error"):
            print("      ⚠ " + r["type_error"])


def compare(a, b):
    """a = الناتج، b = الأصل. بيرجّع عدد الفروق الجوهرية."""
    print("مقارنة %s  ←  %s\n" % (a["file"], b["file"]))
    bad = 0
    if (a["width"], a["height"]) != (b["width"], b["height"]):
        print("✗ المقاس مختلف: %dx%d مقابل %dx%d"
              % (a["width"], a["height"], b["width"], b["height"]))
        bad += 1
    if len(a["layers"]) != len(b["layers"]):
        print("✗ عدد الطبقات مختلف: %d مقابل %d" % (len(a["layers"]), len(b["layers"])))
        bad += 1

    for i in range(min(len(a["layers"]), len(b["layers"]))):
        x, y = a["layers"][i], b["layers"][i]
        diffs = []
        for k in ("name", "kind", "visible", "depth", "opacity"):
            if x[k] != y[k]:
                diffs.append("%s: %r ≠ %r" % (k, x[k], y[k]))
        tx, ty = x.get("type"), y.get("type")
        if tx and ty:
            if [round(v, 2) for v in tx["transform"]] != [round(v, 2) for v in ty["transform"]]:
                diffs.append("transform: %s ≠ %s" % (tx["transform"], ty["transform"]))
            if tx["align"] != ty["align"]:
                diffs.append("محاذاة: %s ≠ %s" % (tx["align"], ty["align"]))
            # اللي بيهم هو المقاس اللي بيتشاف على الكانفس = المخزّن × المقياس.
            # لو ده مختلف، النص بيبان بحجم تاني حتى لو المخزّن مطابق.
            cvx = sorted({r["size_on_canvas"] for r in tx["runs"]})
            cvy = sorted({r["size_on_canvas"] for r in ty["runs"]})
            if cvx != cvy:
                sx = sorted({r["size"] for r in tx["runs"]})
                sy = sorted({r["size"] for r in ty["runs"]})
                hint = "  ← فخ المقاس" if sx != sy and tx["scale"] == ty["scale"] else ""
                diffs.append("المقاس على الكانفس: %s ≠ %s  (مخزّن %s ≠ %s)%s"
                             % (cvx, cvy, sx, sy, hint))
            cx = sorted({r["color"] for r in tx["runs"]})
            cy = sorted({r["color"] for r in ty["runs"]})
            if cx != cy:
                diffs.append("ألوان: %s ≠ %s" % (cx, cy))
            fx = sorted({r["font"] for r in tx["runs"]})
            fy = sorted({r["font"] for r in ty["runs"]})
            if fx != fy:
                diffs.append("خطوط: %s ≠ %s" % (fx, fy))
        if diffs:
            bad += len(diffs)
            print("✗ [%d] %s" % (i, x["name"]))
            for d in diffs:
                print("      " + d)

    print("\n%s" % ("✓ الهيكل مطابق — الفروق في الـbbox بس (طبيعي لما النص يختلف)"
                    if bad == 0 else "✗ %d فرق جوهري" % bad))
    return bad


def main():
    ap = argparse.ArgumentParser(description="اقرا PSD وأثبت اللي جوّاه")
    ap.add_argument("psd")
    ap.add_argument("--text", action="store_true", help="تفاصيل طبقات النص الحي")
    ap.add_argument("--json", action="store_true", help="مخرجات JSON")
    ap.add_argument("--compare", metavar="MASTER", help="قارن الهيكل بملف أصلي")
    ap.add_argument("--preview", metavar="OUT.jpg", help="اطلع معاينة مسطّحة")
    a = ap.parse_args()

    psd, d = read(a.psd)

    if a.json:
        print(json.dumps(d, ensure_ascii=False, indent=2))
    elif a.compare:
        _, m = read(a.compare)
        sys.exit(1 if compare(d, m) else 0)
    else:
        show(d, a.text)

    if a.preview:
        im = psd.composite()
        if a.preview.lower().endswith((".jpg", ".jpeg")):
            im = im.convert("RGB")
        im.save(a.preview, quality=90)
        print("\nمعاينة: " + a.preview)


if __name__ == "__main__":
    main()
