# -*- coding: utf-8 -*-
"""
تصدير PSD بطبقات — لفوتوشوب.
التشغيل:  py psd.py        (لازم serve.py شغّال)

كل عنصر بيترندر لوحده على خلفية شفافة وبيتحط في طبقة منفصلة.
النص صور مش خط حي — وده مقصود: خط PingAR ترخيصه fsType=4
(معاينة وطباعة فقط)، فأي ملف نص حي هيطلب الخط عند العميل
ويعوّضه ويكسر العربي. الصور بترسم مظبوط عند أي حد.
"""
import os, subprocess, tempfile
import numpy as np
from PIL import Image
from psdwriter import write_psd

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8912
W, H = 1080, 1920
IDS = ["01-room", "02-home", "03-facade"]
OUT = os.path.join(HERE, "export")
os.makedirs(OUT, exist_ok=True)

# الترتيب من تحت لفوق — زي ما هيظهر في فوتوشوب
LAYERS = [
    ("bg",          "الصورة"),
    ("scrim",       "التعتيم"),
    ("logo",        "اللوجو"),
    ("text",        "النص الرئيسي"),
    ("features",    "شريط المزايا"),
    ("badge",       "بادچ تابي"),          # الجرافيك — بيفضل ظاهر
    ("ctatext",     "نص الدفع"),           # النص — ده اللي بيتخفي
    ("contactgfx",  "أيقونات التواصل"),    # الأيقونات والفاصل — بيفضلوا
    ("contacttext", "نص التواصل"),         # النص — ده اللي بيتخفي
]


def shot(sid, layer, path):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", f"--window-size={W},{H}",
                    "--default-background-color=00000000",
                    "--virtual-time-budget=6000",
                    "--user-data-dir=" + tempfile.mkdtemp(),
                    "--screenshot=" + path,
                    f"http://127.0.0.1:{PORT}/story.html?id={sid}&layer={layer}"
                    f"&cb={os.urandom(4).hex()}"], capture_output=True)


for sid in IDS:
    tmp = tempfile.mkdtemp()
    built = []
    for n_i, (key, name) in enumerate(LAYERS, 1):
        print(f"   [{sid}] {n_i}/{len(LAYERS)}  {name} ...", flush=True)
        png = os.path.join(tmp, key + ".png")
        shot(sid, key, png)
        im = Image.open(png).convert("RGBA")
        if im.size != (W, H):
            im = im.resize((W, H), Image.LANCZOS)
        a = np.array(im)

        # طبقة فاضية = مفيش داعي نضيفها
        if a[..., 3].max() == 0:
            print(f"  ⚠️  {sid}/{key}: الطبقة طلعت فاضية — اتخطّت")
            continue

        built.append((name, a))

    # المعاينة المسطّحة = الـPNG النهائي اللي اترندر أصلاً
    flat = np.array(Image.open(os.path.join("out", sid + ".png")).convert("RGB"))
    path = os.path.join(OUT, sid + ".psd")
    print(f"   [{sid}] بيكتب الملف ...", flush=True)
    write_psd(path, W, H, built, flat)
    print(f"{sid}.psd  —  {len(built)} طبقة  —  {os.path.getsize(path)//1024//1024} MB")

print("\nالناتج في: export/")
