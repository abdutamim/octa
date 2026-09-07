# -*- coding: utf-8 -*-
"""
تصدير الستوريات لصيغ يقدر العميل يفتحها في إليستريتور/فوتوشوب/كانفا.
التشغيل:  py export.py      (لازم serve.py شغّال)

بيطلّع لكل ستوري:
  .pdf  ← إليستريتور، فوتوشوب، كانفا. ﭬيكتور، أعلى جودة.
  .svg  ← إليستريتور، فيجما، إنكسكيب. ﭬيكتور برضه.
  .png  ← أي حاجة. 1080×1920 جاهزة للنشر.
"""
import os, subprocess, tempfile, sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8912
IDS = ["01-room", "02-home", "03-facade"]
OUT = os.path.join(HERE, "export")
os.makedirs(OUT, exist_ok=True)


def chrome(extra, url):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", "--window-size=1080,1920",
                    "--virtual-time-budget=12000",
                    "--user-data-dir=" + tempfile.mkdtemp()] + extra + [url],
                   capture_output=True)


def url(sid):
    return f"http://127.0.0.1:{PORT}/story.html?id={sid}&cb={os.urandom(4).hex()}"


try:
    import fitz            # PyMuPDF — للتحويل لـSVG
except ImportError:
    fitz = None
    print("⚠️  PyMuPDF مش متاح — هيتعمل PDF و PNG بس. للتثبيت: py -m pip install pymupdf")

for sid in IDS:
    pdf = os.path.join(OUT, sid + ".pdf")
    png = os.path.join(OUT, sid + ".png")

    chrome(["--print-to-pdf=" + pdf, "--no-pdf-header-footer"], url(sid))
    chrome(["--screenshot=" + png], url(sid))

    line = f"{sid}:  pdf {os.path.getsize(pdf)//1024}KB   png {os.path.getsize(png)//1024}KB"

    if fitz:
        svg = os.path.join(OUT, sid + ".svg")
        d = fitz.open(pdf)
        # text_as_path=True: الحروف تتحوّل لأشكال — بترسم صح في أي برنامج
        # من غير ما الخط يكون متثبّت، وبتحترم ترخيص الخط (fsType 4).
        with open(svg, "w", encoding="utf-8") as f:
            f.write(d[0].get_svg_image(text_as_path=True))
        d.close()
        line += f"   svg {os.path.getsize(svg)//1024}KB"

    print(line)

print("\nالناتج في: export/")
