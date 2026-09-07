#!/usr/bin/env node
/* grade.mjs — pull a photo INTO the palette, then finish it.
 *
 *   node grade.mjs in.png --out=out.png --duotone=#0C1638,#3B5BFF
 *   node grade.mjs in.png --out=out.png --preset=filmic
 *   node grade.mjs assets/*.png --preset=plate --grain=8
 *
 * Why this exists: an ungraded photo dropped on a brand field always looks
 * pasted, because it carries hues the palette does not own. Grading the asset
 * into the palette is what makes the frame read as designed rather than
 * assembled. Grain on a flat fill does the same job in reverse — it stops a
 * solid colour reading as an unfinished default swatch.
 *
 * Flags
 *   --out=          output path (default: <name>-graded.png). With multiple
 *                   inputs, treated as a directory.
 *   --duotone=a,b   gradient-map shadows→a, highlights→b. The strongest tool here.
 *   --tint=hex,amt  push the whole image toward one hue by amt 0..1 (subtler).
 *   --sat=1.0       saturation multiplier (0 = mono).
 *   --contrast=1.0  contrast around mid-grey.
 *   --lift=0        raise the black point 0..40 (filmic, milky shadows).
 *   --grain=0       film grain 0..30.
 *   --vignette=0    corner darkening 0..1.
 *   --preset=       filmic | plate | mono | flat   (applied first, flags override)
 *
 * Presets
 *   filmic  lifted blacks, softened saturation, grain — the "shot on film" pass
 *   plate   slight desaturation + vignette, so type wins over the photo
 *   mono    full greyscale + grain, for the palette-cleanser slide
 *   flat    grain only, for solid-colour backgrounds
 *   phone   harder contrast, no vignette, almost no grain — pairs with
 *           gen.mjs --realism. Use when polish would read as fake.
 */
import fs from "node:fs";
import path from "node:path";
import { requireDep } from "./_lib.mjs";

const sharp = requireDep("sharp");

const args = {};
const inputs = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=([\s\S]*))?$/);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  else inputs.push(a);
}
if (!inputs.length) {
  console.error("usage: node grade.mjs <image...> [--out=] [--duotone=a,b] [--preset=]");
  process.exit(1);
}

const PRESETS = {
  filmic: { lift: 14, sat: 0.88, contrast: 1.06, grain: 10, vignette: 0.22 },
  plate: { sat: 0.82, contrast: 1.04, grain: 5, vignette: 0.3 },
  mono: { sat: 0, contrast: 1.1, grain: 12, vignette: 0.2 },
  flat: { grain: 8 },
  // the credibility lever: cinema polish costs you when the implied capture
  // doesn't match the story. Harder, cleaner, no vignette — reads as captured.
  phone: { sat: 1.04, contrast: 1.12, grain: 3, vignette: 0, lift: 0 },
};

const p = PRESETS[args.preset] || {};
const opt = {
  lift: Number(args.lift ?? p.lift ?? 0),
  sat: Number(args.sat ?? p.sat ?? 1),
  contrast: Number(args.contrast ?? p.contrast ?? 1),
  grain: Number(args.grain ?? p.grain ?? 0),
  vignette: Number(args.vignette ?? p.vignette ?? 0),
  duotone: args.duotone ? String(args.duotone).split(",").map(hex2rgb) : null,
  tint: args.tint ? parseTint(args.tint) : null,
};

function hex2rgb(h) {
  const s = h.trim().replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function parseTint(s) {
  const [h, a] = String(s).split(",");
  return { rgb: hex2rgb(h), amt: Number(a ?? 0.25) };
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/* deterministic noise — same input always grades identically */
function rnd(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

async function grade(file, outPath) {
  // Read through a Buffer, never a path. sharp keeps a handle on a path input,
  // so `--out` pointing at the input file fails to open for write — which is
  // exactly the in-place grade the docs recommend.
  const img = sharp(fs.readFileSync(file));
  const meta = await img.metadata();
  const W = meta.width;
  const H = meta.height;
  const { data, info } = await img
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const rand = rnd(W * 7919 + H * 104729 + 17);
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.hypot(cx, cy);

  for (let i = 0, px = 0; i < data.length; i += ch, px += 1) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // luminance (Rec.709)
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (opt.duotone) {
      const t = Y / 255;
      const [a0, a1] = opt.duotone;
      r = a0[0] + (a1[0] - a0[0]) * t;
      g = a0[1] + (a1[1] - a0[1]) * t;
      b = a0[2] + (a1[2] - a0[2]) * t;
    } else {
      if (opt.sat !== 1) {
        r = Y + (r - Y) * opt.sat;
        g = Y + (g - Y) * opt.sat;
        b = Y + (b - Y) * opt.sat;
      }
      if (opt.tint) {
        const { rgb, amt } = opt.tint;
        r += (rgb[0] - r) * amt * (Y / 255);
        g += (rgb[1] - g) * amt * (Y / 255);
        b += (rgb[2] - b) * amt * (Y / 255);
      }
    }

    if (opt.contrast !== 1) {
      r = 128 + (r - 128) * opt.contrast;
      g = 128 + (g - 128) * opt.contrast;
      b = 128 + (b - 128) * opt.contrast;
    }

    if (opt.lift) {
      const k = 1 - opt.lift / 255;
      r = opt.lift + r * k;
      g = opt.lift + g * k;
      b = opt.lift + b * k;
    }

    if (opt.vignette) {
      const x = px % W;
      const y = (px / W) | 0;
      const d = Math.hypot(x - cx, y - cy) / maxR;
      const f = 1 - opt.vignette * Math.max(0, d - 0.45) / 0.55;
      r *= f;
      g *= f;
      b *= f;
    }

    if (opt.grain) {
      const n = (rand() - 0.5) * opt.grain * 2;
      r += n;
      g += n;
      b += n;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  await sharp(data, { raw: { width: W, height: H, channels: ch } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  return { W, H, size: fs.statSync(outPath).size };
}

const multi = inputs.length > 1;
for (const file of inputs) {
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`  ! missing: ${file}`);
    continue;
  }
  let out;
  if (!args.out) {
    out = abs.replace(/(\.[a-z]+)$/i, "-graded.png");
  } else if (multi) {
    fs.mkdirSync(path.resolve(process.cwd(), args.out), { recursive: true });
    out = path.resolve(process.cwd(), args.out, path.basename(abs).replace(/\.[a-z]+$/i, ".png"));
  } else {
    out = path.resolve(process.cwd(), args.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
  }
  const r = await grade(abs, out);
  const what = [
    opt.duotone && "duotone",
    opt.tint && "tint",
    opt.sat !== 1 && `sat ${opt.sat}`,
    opt.contrast !== 1 && `contrast ${opt.contrast}`,
    opt.lift && `lift ${opt.lift}`,
    opt.grain && `grain ${opt.grain}`,
    opt.vignette && `vignette ${opt.vignette}`,
  ]
    .filter(Boolean)
    .join(" · ");
  console.log(`✓ ${path.relative(process.cwd(), out)}  ${r.W}×${r.H}  ${what || "no-op"}`);
}
