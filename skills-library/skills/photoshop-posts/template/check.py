# -*- coding: utf-8 -*-
"""
فحص التباين — بيقيس على المواضع الحقيقية للعناصر مش على أرقام مكتوبة بالورقة.
التشغيل:  py check.py     (لازم serve.py شغّال)
"""
import json, math, os, re, subprocess, tempfile, io
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8912
IDS = ["01-room", "02-home", "03-facade"]


def chrome(args, url):
    return subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                           "--force-device-scale-factor=1", "--window-size=1080,1920",
                           "--virtual-time-budget=10000"] + args + [url],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")


def rects(sid):
    d = tempfile.mkdtemp()
    r = chrome(["--user-data-dir=" + d, "--dump-dom"],
               f"http://127.0.0.1:{PORT}/story.html?id={sid}&rects=1&cb={os.urandom(4).hex()}")
    m = re.search(r"<title>RECTS(.*?)</title>", r.stdout or "", re.S)
    d = json.loads(m.group(1)) if m else {}
    return d.get("rects", d)


def bg_png(sid):
    d = tempfile.mkdtemp()
    out = os.path.join(HERE, "out", f"_bg-{sid}.png")
    chrome(["--user-data-dir=" + d, "--screenshot=" + out],
           f"http://127.0.0.1:{PORT}/story.html?id={sid}&notext=1&cb={os.urandom(4).hex()}")
    return Image.open(out).convert("RGB")


def oklch(L, C, H):
    L /= 100.0; h = math.radians(H); a = C * math.cos(h); b = C * math.sin(h)
    l = (L + .3963377774 * a + .2158037573 * b) ** 3
    m = (L - .1055613458 * a - .0638541728 * b) ** 3
    s = (L - .0894841775 * a - 1.2914855480 * b) ** 3
    r  =  4.0767416621 * l - 3.3077115913 * m + .2309699292 * s
    g  = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s
    bl = -0.0041960863 * l - .7034186147 * m + 1.7076147010 * s
    def e(c):
        c = max(0., min(1., c))
        return 12.92 * c if c <= .0031308 else 1.055 * c ** (1 / 2.4) - .055
    return tuple(round(e(x) * 255) for x in (r, g, bl))


def lum(p):
    def f(c):
        c /= 255.0
        return c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    r, g, b = [f(c) for c in p]
    return .2126 * r + .7152 * g + .0722 * b


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


# ألوان النص — لازم تطابق :root في story.html
GOLD = oklch(88, .048, 85)
T1   = oklch(97, .010, 85)
T2   = oklch(93, .011, 85)
T3   = oklch(90, .011, 85)

L = json.load(io.open("layout.json", encoding="utf-8"))
INK = (46, 41, 35)
A = L["features"]["opacity"] / 100
compose = lambda px: tuple(round(c * (1 - A) + i * A) for c, i in zip(px, INK))

# [المفتاح في rects, الاسم, اللون, الحد المطلوب, هل هو فوق كارت المزايا]
CHECKS = [
    ("#hook",        "الهيدلاين",       T1,   3.0, False),
    ("#service",     "سطر الخدمة",      T2,   4.5, False),
    ("#price",       "السعر الذهبي",    GOLD, 3.0, False),
    ("#kicker",      "السطر الصغير",    T2,   4.5, False),
    (".feat-card",   "نص المزايا",      T2,   4.5, True),
    (".feat-card",   "أيقونات المزايا", GOLD, 3.0, True),
    (".cta-title",   "عنوان CTA",       T1,   3.0, False),
    (".cta-tagline", "تاجلاين CTA",     T3,   4.5, False),
    (".contact",     "صف التواصل",      T3,   4.5, False),
]

fails = []
for sid in IDS:
    R = rects(sid)
    im = bg_png(sid)
    print("\n" + sid)
    for key, name, fg, req, on_card in CHECKS:
        if key not in R:
            print(f"   {name:<18} — العنصر مش موجود")
            continue
        x1, y1, x2, y2 = R[key]
        box = im.crop((max(0, x1), max(0, y1), min(1080, x2), min(1920, y2)))
        worst = max(list(box.getdata()), key=lum)      # أفتح بكسل = أسوأ حالة لنص فاتح
        if on_card:
            worst = compose(worst)
        r = ratio(fg, worst)
        good = r >= req
        if not good:
            fails.append((sid, name, r, req))
        print(f"   {name:<18}{r:>6.2f} / {req}  {'✅' if good else '❌'}")

    # المنطقة الآمنة بتاعة إنستجرام
    bottom = max(v[3] for v in R.values()) if R else 0
    safe = 1920 * 0.87
    ok = bottom < safe
    if not ok:
        fails.append((sid, "خارج المنطقة الآمنة", bottom, safe))
    print(f"   {'أسفل عنصر':<18}{bottom:>6} / {int(safe)}  {'✅' if ok else '❌ هيتغطى بشريط الرد'}")

print("\n" + ("✅ كله عدّى WCAG AA وجوه المنطقة الآمنة" if not fails else "❌ سقوط:"))
for f in fails:
    print(f"   {f[0]}  {f[1]}: {f[2]:.2f} < {f[3]}")
