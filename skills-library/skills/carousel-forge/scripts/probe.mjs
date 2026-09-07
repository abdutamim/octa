#!/usr/bin/env node
/* probe.mjs — read a photo BEFORE you place type on it.
 *
 *   node probe.mjs assets/p01.png
 *   node probe.mjs assets/p01.png --grid=6x8 --json
 *
 * Answers three questions the eye is bad at answering fast:
 *   1. WHERE can type go?      → per-cell luminance + busyness map
 *   2. WHAT colour should it be? → contrast ratio for white and for near-black, per zone
 *   3. WHAT is the palette?     → dominant colours, so the accent can be sampled from the photo
 *
 * The rule it enforces (see references/composition.md):
 *   Type never sits on a mid-tone. Put it on a calm zone that is either
 *   dark (L* < 35) for white type, or light (L* > 72) for near-black type.
 *   A zone that is mid-tone OR busy is disqualified no matter how empty it looks.
 */
import path from "node:path";
import { requireDep } from "./_lib.mjs";

const sharp = requireDep("sharp");

const args = {};
const files = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=([\s\S]*))?$/);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  else files.push(a);
}
if (!files.length) {
  console.error("usage: node probe.mjs <image> [--grid=6x8] [--json]");
  process.exit(1);
}

const [GX, GY] = (args.grid || "6x8").split("x").map(Number);

/* ---------- --set : does this batch read as ONE shoot? ----------
 * A lock string keeps the prompts consistent; this checks the pixels agreed.
 * One image drifting in hue or exposure is what breaks a carousel's cohesion,
 * and it is very hard to see by flicking between files. */
async function cohesion(files, sharpLib) {
  const rows = [];
  for (const f of files) {
    const abs = path.resolve(process.cwd(), f);
    const { data, info } = await sharpLib(abs)
      .resize(64, 64, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let L = 0;
    let C = 0;
    let hx = 0;
    let hy = 0;
    const n = info.width * info.height;
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const d = mx - mn;
      L += (mx + mn) / 2;
      C += d;
      if (d > 0.04) {
        let h;
        if (mx === r) h = ((g - b) / d) % 6;
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= Math.PI / 3;
        hx += Math.cos(h) * d;
        hy += Math.sin(h) * d;
      }
    }
    const hueDeg = ((Math.atan2(hy, hx) * 180) / Math.PI + 360) % 360;
    rows.push({
      name: path.basename(f),
      L: (L / n) * 100,
      C: (C / n) * 100,
      hue: hueDeg,
    });
  }

  const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  const sd = (k, m) =>
    Math.sqrt(rows.reduce((a, r) => a + (r[k] - m) ** 2, 0) / rows.length);
  // hue is circular — average it as a vector, not a number
  const hx = rows.reduce((a, r) => a + Math.cos((r.hue * Math.PI) / 180), 0);
  const hy = rows.reduce((a, r) => a + Math.sin((r.hue * Math.PI) / 180), 0);
  const hueMean = ((Math.atan2(hy, hx) * 180) / Math.PI + 360) % 360;
  const hueDist = (a, b) => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  };
  const mL = mean("L");
  const mC = mean("C");
  const sL = sd("L", mL);
  const sC = sd("C", mC);

  console.log(`\nBATCH COHESION — ${rows.length} images`);
  console.log(`  exposure  L ${mL.toFixed(0)} ±${sL.toFixed(0)}`);
  console.log(`  chroma    C ${mC.toFixed(0)} ±${sC.toFixed(0)}`);
  console.log(`  hue       ${hueMean.toFixed(0)}°`);
  console.log("");
  for (const r of rows) {
    const flags = [];
    if (sL > 1 && Math.abs(r.L - mL) > 1.6 * sL) flags.push(r.L > mL ? "brighter" : "darker");
    if (sC > 1 && Math.abs(r.C - mC) > 1.6 * sC) flags.push(r.C > mC ? "more saturated" : "flatter");
    if (hueDist(r.hue, hueMean) > 40) flags.push(`hue off by ${hueDist(r.hue, hueMean).toFixed(0)}°`);
    console.log(
      `  ${r.name.padEnd(22)} L${r.L.toFixed(0).padStart(3)}  C${r.C.toFixed(0).padStart(3)}  ` +
        `${r.hue.toFixed(0).padStart(3)}°   ${flags.length ? "← " + flags.join(", ") : "ok"}`
    );
  }
  const bad = rows.filter(
    (r) =>
      (sL > 1 && Math.abs(r.L - mL) > 1.6 * sL) ||
      (sC > 1 && Math.abs(r.C - mC) > 1.6 * sC) ||
      hueDist(r.hue, hueMean) > 40
  );
  console.log(
    bad.length
      ? `\n  ${bad.length} outlier(s). Re-grade them toward the set, or regenerate with the\n` +
          `  same vibe.json lock string. One drifting frame breaks the carousel.`
      : `\n  Reads as one shoot.`
  );
  console.log("");
}

if (args.set) {
  await cohesion(files, sharp);
  process.exit(0);
}

/* ---------- colour maths ---------- */
const srgbToLin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const relLum = (r, g, b) =>
  0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
// perceptual lightness 0..100
const lstar = (Y) => (Y <= 0.008856 ? Y * 903.3 : 116 * Math.cbrt(Y) - 16);
const hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

const WHITE = relLum(255, 255, 255);
const INK = relLum(12, 12, 12);

for (const file of files) {
  const abs = path.resolve(process.cwd(), file);
  const img = sharp(abs);
  const meta = await img.metadata();
  const W = meta.width;
  const H = meta.height;

  // downsample once; every measurement runs off this buffer
  const SW = 240;
  const SH = Math.round((SW * H) / W);
  const { data } = await img
    .clone()
    .resize(SW, SH, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = (x, y) => {
    const i = (y * SW + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  /* ---------- per-cell map ---------- */
  const cells = [];
  const cw = SW / GX;
  const ch = SH / GY;
  for (let gy = 0; gy < GY; gy += 1) {
    for (let gx = 0; gx < GX; gx += 1) {
      const x0 = Math.floor(gx * cw);
      const x1 = Math.floor((gx + 1) * cw);
      const y0 = Math.floor(gy * ch);
      const y1 = Math.floor((gy + 1) * ch);
      let sum = 0;
      let sum2 = 0;
      let n = 0;
      let rs = 0;
      let gs = 0;
      let bs = 0;
      let edge = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const [r, g, b] = px(x, y);
          const Y = relLum(r, g, b);
          sum += Y;
          sum2 += Y * Y;
          rs += r;
          gs += g;
          bs += b;
          n += 1;
          if (x + 1 < x1) {
            const [r2, g2, b2] = px(x + 1, y);
            edge += Math.abs(relLum(r2, g2, b2) - Y);
          }
        }
      }
      const mean = sum / n;
      const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      cells.push({
        gx,
        gy,
        L: lstar(mean),
        sd: sd * 100,
        busy: (edge / n) * 100,
        color: hex(rs / n, gs / n, bs / n),
        cWhite: contrast(WHITE, mean),
        cInk: contrast(INK, mean),
      });
    }
  }

  /* ---------- verdict per cell ---------- */
  // calm = low local variance AND low edge energy
  const verdict = (c) => {
    const calm = c.sd < 9 && c.busy < 4.5;
    if (!calm) return { ok: false, why: "busy" };
    if (c.cWhite >= 4.5) return { ok: true, ink: "white", ratio: c.cWhite };
    if (c.cInk >= 4.5) return { ok: true, ink: "near-black", ratio: c.cInk };
    return { ok: false, why: "mid-tone" };
  };

  /* ---------- render ascii map ---------- */
  // W = safe for white type · B = safe for black type · · = mid-tone · # = busy
  const rows = [];
  for (let gy = 0; gy < GY; gy += 1) {
    let row = "";
    for (let gx = 0; gx < GX; gx += 1) {
      const c = cells[gy * GX + gx];
      const v = verdict(c);
      row += v.ok ? (v.ink === "white" ? " W " : " B ") : v.why === "busy" ? " # " : " · ";
    }
    rows.push(row);
  }

  /* ---------- best contiguous band ---------- */
  // score each horizontal band of rows: how much of it is placeable, same ink
  const bands = [];
  for (let start = 0; start < GY; start += 1) {
    for (let span = 1; span <= Math.min(3, GY - start); span += 1) {
      let white = 0;
      let black = 0;
      let bad = 0;
      for (let gy = start; gy < start + span; gy += 1)
        for (let gx = 0; gx < GX; gx += 1) {
          const v = verdict(cells[gy * GX + gx]);
          if (!v.ok) bad += 1;
          else if (v.ink === "white") white += 1;
          else black += 1;
        }
      const total = span * GX;
      const ink = white >= black ? "white" : "near-black";
      const good = Math.max(white, black);
      bands.push({
        start,
        span,
        ink,
        purity: good / total,
        coverage: (good / total) * span,
        yFrom: Math.round((start / GY) * 100),
        yTo: Math.round(((start + span) / GY) * 100),
        bad,
      });
    }
  }
  bands.sort((a, b) => b.coverage - a.coverage || b.purity - a.purity);
  const best = bands.filter((b) => b.purity >= 0.7).slice(0, 3);

  /* ---------- palette ----------
   * Fine buckets first, then merge perceptually-near ones. Without the merge
   * a smooth gradient splits into six near-identical entries and crowds out
   * the minority hue you actually want as an accent. */
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    e.n += 1;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(key, e);
  }
  const total = data.length / 3;

  const merged = [];
  for (const e of [...buckets.values()].sort((a, b) => b.n - a.n)) {
    const c = { n: e.n, r: e.r / e.n, g: e.g / e.n, b: e.b / e.n };
    // distance weighted toward hue so light/dark variants of one hue collapse
    const near = merged.find((m) => {
      const dr = m.r - c.r;
      const dg = m.g - c.g;
      const db = m.b - c.b;
      const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
      return dist < 110;
    });
    if (near) {
      const n = near.n + c.n;
      near.r = (near.r * near.n + c.r * c.n) / n;
      near.g = (near.g * near.n + c.g * c.n) / n;
      near.b = (near.b * near.n + c.b * c.n) / n;
      near.n = n;
    } else {
      merged.push(c);
    }
  }

  const palette = merged
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((e) => ({
      hex: hex(e.r, e.g, e.b),
      share: +((e.n / total) * 100).toFixed(1),
      L: +lstar(relLum(e.r, e.g, e.b)).toFixed(0),
    }));

  if (args.json) {
    console.log(JSON.stringify({ file, W, H, cells, bands: best, palette }, null, 2));
    continue;
  }

  /* ---------- report ---------- */
  console.log(`\n${path.basename(file)}  ${W}×${H}  (${(W / H).toFixed(2)}:1)`);
  console.log(`\nPLACEMENT MAP   W=white type ok · B=black type ok · ·=mid-tone · #=busy`);
  rows.forEach((r, i) => {
    const y0 = Math.round((i / GY) * 100);
    const y1 = Math.round(((i + 1) / GY) * 100);
    console.log(`  ${String(y0).padStart(3)}–${String(y1).padStart(3)}%  ${r}`);
  });

  console.log(`\nBEST TYPE BANDS`);
  if (!best.length) {
    console.log(
      "  none. Every band is busy or mid-tone.\n" +
        "  → Fix the PHOTO, not the type: outpaint headroom, reshoot with negative space,\n" +
        "    or move this slide to a designed background. Do NOT reach for a scrim."
    );
  } else {
    for (const b of best)
      console.log(
        `  y ${String(b.yFrom).padStart(3)}–${String(b.yTo).padStart(3)}%  ` +
          `${b.ink.padEnd(10)}  ${Math.round(b.purity * 100)}% clean`
      );
  }

  console.log(`\nPALETTE  (sample your accent from here, don't invent one)`);
  for (const p of palette)
    console.log(`  ${p.hex}  ${String(p.share).padStart(5)}%  L*${String(p.L).padStart(3)}`);

  const darkest = palette.reduce((a, b) => (a.L < b.L ? a : b));
  const lightest = palette.reduce((a, b) => (a.L > b.L ? a : b));
  console.log(
    `\n  spread L*${darkest.L}–${lightest.L}` +
      (lightest.L - darkest.L < 45
        ? "  ← FLAT. Low tonal range means the cover will die at thumbnail size."
        : "")
  );
  console.log("");
}
