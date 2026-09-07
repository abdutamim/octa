#!/usr/bin/env python3
"""cutout.py — background-remove a subject so it can be layered OVER the headline.

    py cutout.py assets/p01.png
    py cutout.py assets/*.png --out=assets/cut
    py cutout.py assets/p01.png --feather=2 --keep-largest

Writes RGBA PNGs. The alpha edge is what sells the depth trick, so:
  --feather=N     blur the matte N px (1-3). Kills the "sticker" edge.
  --keep-largest  drop every blob but the biggest. Removes the stray
                  background scraps rembg leaves behind, which are the
                  #1 reason a cutout looks pasted.
  --shrink=N      erode the matte N px so no background halo survives.

Needs: pip install rembg pillow numpy
"""
import argparse
import glob
import os
import sys

# Windows consoles default to cp1252, which cannot encode the arrows below.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    import numpy as np
    from PIL import Image, ImageFilter
    from rembg import remove, new_session
except ImportError as e:
    sys.exit(f"cutout.py: missing dependency ({e}). pip install rembg pillow numpy")


def keep_largest_blob(alpha):
    """Flood-fill label the matte, keep only the biggest connected region."""
    try:
        from scipy import ndimage
    except ImportError:
        print("  (--keep-largest needs scipy; skipping)")
        return alpha
    mask = alpha > 8
    labels, n = ndimage.label(mask)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    biggest = int(np.argmax(sizes)) + 1
    out = alpha.copy()
    out[labels != biggest] = 0
    dropped = n - 1
    print(f"  dropped {dropped} stray blob{'s' if dropped != 1 else ''}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("images", nargs="+")
    ap.add_argument("--out", default=None, help="output dir (default: <input dir>/cut)")
    ap.add_argument("--feather", type=float, default=1.5)
    ap.add_argument("--shrink", type=int, default=1)
    ap.add_argument("--keep-largest", action="store_true")
    ap.add_argument("--model", default="isnet-general-use",
                    help="u2net | isnet-general-use | birefnet-general")
    args = ap.parse_args()

    paths = []
    for pattern in args.images:
        hits = glob.glob(pattern)
        paths.extend(hits if hits else [pattern])
    if not paths:
        sys.exit("cutout.py: no input images matched")

    session = new_session(args.model)

    for src in paths:
        if not os.path.isfile(src):
            print(f"  ! missing: {src}")
            continue

        out_dir = args.out or os.path.join(os.path.dirname(src) or ".", "cut")
        os.makedirs(out_dir, exist_ok=True)
        dst = os.path.join(out_dir, os.path.splitext(os.path.basename(src))[0] + ".png")

        print(f"→ {src}")
        img = Image.open(src).convert("RGBA")
        cut = remove(img, session=session, post_process_mask=True)

        arr = np.array(cut)
        alpha = arr[:, :, 3]

        if args.keep_largest:
            alpha = keep_largest_blob(alpha)

        a = Image.fromarray(alpha, mode="L")
        if args.shrink > 0:
            a = a.filter(ImageFilter.MinFilter(1 + 2 * args.shrink))
        if args.feather > 0:
            a = a.filter(ImageFilter.GaussianBlur(args.feather))

        arr[:, :, 3] = np.array(a)
        Image.fromarray(arr).save(dst)

        covered = float((np.array(a) > 8).mean()) * 100
        print(f"  ✓ {dst}  subject covers {covered:.0f}% of frame")
        if covered > 62:
            print("    ! subject fills most of the frame — there is no room for a"
                  " headline behind it. Recrop or pick another shot.")
        elif covered < 8:
            print("    ! almost nothing was kept. Wrong model, or the subject does not"
                  " separate from the background. Try --model=birefnet-general.")


if __name__ == "__main__":
    main()
