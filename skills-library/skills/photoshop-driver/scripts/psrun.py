# -*- coding: utf-8 -*-
"""
psrun — لاقي فوتوشوب، شغّله بسكربت .jsx، واستنى المخرجات.

    py psrun.py script.jsx
    py psrun.py script.jsx --expect out/a.psd out/b.psd --timeout 600
    py psrun.py --which                    اطبع مسار فوتوشوب وبس

فوتوشوب بيقبل مسار .jsx كأول أرچومنت وبيشغّله وهو بيفتح. مفيش خرج على
stdout ومفيش كود خروج مفيد — الطريقة الوحيدة لمعرفة إنه خلص هي إنك تراقب
الملفات المتوقّعة يتغيّر تاريخ تعديلها. عشان كده --expect مهمة.

النسخ الـportable مش متسجّلة في الريجستري ولا COM — بنلاقيها بالـglob.
"""
import argparse, glob, os, subprocess, sys, time

# الأماكن المعتادة، بالترتيب. النسخ الـportable الأول لأنها الأغرب.
CANDIDATES = [
    r"C:\Users\*\Desktop\Apps\Adobe Photoshop*\App\Program Files\Adobe\Adobe Photoshop*\Photoshop.exe",
    r"C:\Users\*\Desktop\*\Adobe Photoshop*\**\Photoshop.exe",
    r"C:\Program Files\Adobe\Adobe Photoshop*\Photoshop.exe",
    r"C:\Program Files (x86)\Adobe\Adobe Photoshop*\Photoshop.exe",
    r"D:\**\Photoshop.exe",
]


def find_photoshop(hint=None):
    if hint:
        if not os.path.exists(hint):
            sys.exit("مش موجود: " + hint)
        return hint
    # لو شغّال دلوقتي، خد مساره من العملية نفسها — أضمن حاجة
    try:
        out = subprocess.run(
            ["wmic", "process", "where", "name='Photoshop.exe'", "get", "ExecutablePath"],
            capture_output=True, text=True, timeout=20).stdout
        for line in out.splitlines():
            line = line.strip()
            if line.lower().endswith("photoshop.exe") and os.path.exists(line):
                return line
    except Exception:
        pass
    for pat in CANDIDATES:
        hits = sorted(glob.glob(pat, recursive="**" in pat))
        hits = [h for h in hits if os.path.exists(h)]
        if hits:
            return hits[-1]          # الأحدث أبجديًا = أحدث إصدار عادةً
    return None


def is_running():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq Photoshop.exe"],
                             capture_output=True, text=True, timeout=20).stdout
        return "Photoshop.exe" in out
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser(description="شغّل سكربت ExtendScript في فوتوشوب")
    ap.add_argument("jsx", nargs="?", help="مسار ملف .jsx")
    ap.add_argument("--expect", nargs="*", default=[],
                    help="ملفات لازم تتكتب — بنستنى تاريخ تعديلها يتقدّم")
    ap.add_argument("--timeout", type=int, default=600, help="ثواني (افتراضي 600)")
    ap.add_argument("--exe", help="مسار Photoshop.exe صراحةً")
    ap.add_argument("--which", action="store_true", help="اطبع مسار فوتوشوب وبس")
    a = ap.parse_args()

    exe = find_photoshop(a.exe)
    if not exe:
        sys.exit("ملقتش Photoshop.exe — مرّر --exe بالمسار")
    if a.which:
        print(exe)
        return
    if not a.jsx:
        ap.error("محتاج مسار .jsx")

    jsx = os.path.abspath(a.jsx)
    if not os.path.exists(jsx):
        sys.exit("مش موجود: " + jsx)

    if is_running():
        print("⚠ فوتوشوب شغّال بالفعل — السكربت هيشتغل على الجلسة المفتوحة")

    before = {p: (os.path.getmtime(p) if os.path.exists(p) else 0) for p in a.expect}

    print("فوتوشوب: " + exe)
    print("سكربت:  " + jsx)
    subprocess.Popen([exe, jsx], close_fds=True)

    if not a.expect:
        print("مفيش --expect — مش هستنى. راجع الناتج بنفسك.")
        return

    print("مستني %d ملف (حد أقصى %ds) ..." % (len(a.expect), a.timeout))
    deadline = time.time() + a.timeout
    pending = set(a.expect)
    while pending and time.time() < deadline:
        time.sleep(3)
        for p in sorted(pending):
            if os.path.exists(p) and os.path.getmtime(p) > before[p] + 1:
                size = os.path.getsize(p)
                # استنى الملف يبطّل يكبر — الحفظ مش لحظي
                time.sleep(2)
                if os.path.getsize(p) == size and size > 0:
                    print("  ✓ %s  (%.1f MB)" % (p, size / 1048576))
                    pending.discard(p)

    if pending:
        print("\n✗ متكتبوش خلال المهلة:")
        for p in sorted(pending):
            print("    " + p)
        print("\nشوف لو فيه ديالوج مفتوح في فوتوشوب. حط "
              "app.displayDialogs = DialogModes.NO في أول السكربت.")
        sys.exit(1)

    print("\n✓ كل الملفات اتكتبت. دلوقتي تحقّق منها:")
    print("    py psinspect.py %s --compare <master.psd>" % a.expect[0])


if __name__ == "__main__":
    main()
